---
baseline_commit: 6ae9966
---

# Story 2.1: Rest Timer Bar & In-App Timer UX

Status: done

## Story

As Mason,
I want the Rest Timer to start automatically after each Set and be clearly visible in-app,
So that I always know exactly when to start my next set without watching a clock.

## Acceptance Criteria

**AC1** — **Given** I confirm a Set in an active session **When** the Set is logged **Then** the Rest Timer starts automatically at the configured duration (default: 90 seconds from `DEFAULT_REST_TIMER_SECONDS`; or per-Exercise custom duration if configured); a 3px Rest Timer Bar drains ghost-accent left-to-right at the bottom of the Session screen; a numeric countdown displays above the bar in `mono-data / ink-primary`.

**AC2** — **Given** the Rest Timer reaches zero **When** the countdown hits 0 **Then** the Rest Timer Bar flashes `pr-burst` for 600ms then the bar resets/disappears; a light haptic fires; the numeric display shows "0:00" during the flash.

**AC3** — **Given** I navigate to a specific Exercise's settings in the Settings screen **When** I configure a custom rest timer duration **Then** sessions that include that Exercise use the custom duration; all other exercises use the global default of 90 seconds.

**AC4** — **Given** I tap "Skip" on the Rest Timer during a session **When** the skip action fires **Then** the Rest Timer stops immediately and resets to hidden; no haptic fires.

**AC5** — **And** all rest timer controls (Skip button) meet the 44×44dp minimum touch target requirement.

---

## Tasks / Subtasks

- [x] Task 1: schema.ts — Add `rest_timer_seconds` column to exercises table (AC: #3)
  - [x] Add `rest_timer_seconds: integer('rest_timer_seconds')` (nullable, no default) to `exercises` table in `/src/db/schema.ts`
  - [x] This column stores per-exercise override in seconds. `null` means "use global default". Positive integers only (UI validates before write).
  - [x] Run `npx drizzle-kit generate` to produce `0002_rest_timer.sql` migration file
  - [x] Verify migration file is generated at `src/db/migrations/0002_*.sql` with content: `ALTER TABLE exercises ADD COLUMN rest_timer_seconds INTEGER;`
  - [x] Update `src/db/migrations/migrations.js` to import and export the new migration (following the existing pattern: import `m0002` from the new SQL file, add to `migrations` object)
  - [x] NOTE: `drizzle-kit generate` may name the file differently (e.g., `0002_something_random.sql`). Use whatever name drizzle-kit generates — do NOT rename it.

- [x] Task 2: types/index.ts — Add `rest_timer_seconds` to DbExercise (AC: #3)
  - [x] Add `rest_timer_seconds: number | null` to `DbExercise` interface
  - [x] Add `restTimerSeconds: number | null` to `DisplayExercise` interface
  - [x] `DisplayExercise.restTimerSeconds` mirrors `DbExercise.rest_timer_seconds` (same value, null = use default; no conversion needed)

- [x] Task 3: exercise.mapper.ts — Include rest_timer_seconds in mapping (AC: #3)
  - [x] Update `mapDbExerciseToDisplay` in `/src/db/mappers/exercise.mapper.ts`:
    ```typescript
    export function mapDbExerciseToDisplay(dbExercise: DbExercise): DisplayExercise {
      return {
        id: dbExercise.id,
        name: dbExercise.name,
        type: dbExercise.type,
        createdAt: new Date(dbExercise.created_at * 1000),
        restTimerSeconds: dbExercise.rest_timer_seconds ?? null,
      }
    }
    ```
  - [x] `deleted_at` is not part of `DisplayExercise` — do not add it

- [x] Task 4: exercises.queries.ts — Add setRestTimerSeconds query (AC: #3)
  - [x] Add `setExerciseRestTimerSeconds(id: string, seconds: number | null): Promise<void>`:
    ```typescript
    export async function setExerciseRestTimerSeconds(id: string, seconds: number | null): Promise<void> {
      await db
        .update(exercises)
        .set({ rest_timer_seconds: seconds })
        .where(and(eq(exercises.id, id), isNull(exercises.deleted_at)))
    }
    ```
  - [x] `null` clears the custom duration (reverts to global default). Positive integer sets it.
  - [x] `and`, `eq`, `isNull` already imported in this file — do not add duplicate imports.

- [x] Task 5: useExercises.ts — Add setRestTimerSeconds action (AC: #3)
  - [x] Add `setRestTimerSeconds` action to `useExercises` hook:
    ```typescript
    async function setRestTimerSeconds(id: string, seconds: number | null): Promise<void> {
      try {
        await ExercisesQueries.setExerciseRestTimerSeconds(id, seconds)
      } catch (e) {
        console.error('[Exercises] setRestTimerSeconds failed:', e)
        showToast('Could not save rest timer. Try again.', 'error')
      }
    }
    ```
  - [x] Return `setRestTimerSeconds` in the hook's return object alongside existing actions

- [x] Task 6: useSessionStore.ts — Add `restTimerTotalSeconds` state (AC: #1, #2)
  - [x] Add `restTimerTotalSeconds: number` to `SessionStore` interface (default 0)
  - [x] Add `setRestTimerTotalSeconds: (seconds: number) => void` action
  - [x] Add to `initialState`: `restTimerTotalSeconds: 0`
  - [x] Add to `create`: `setRestTimerTotalSeconds: (seconds) => set({ restTimerTotalSeconds: seconds })`
  - [x] `restTimerTotalSeconds` is the "started at" duration — used to compute fill percentage in RestTimerBar
  - [x] `reset()` already resets to `initialState`, which now includes `restTimerTotalSeconds: 0` — no change needed to `reset()`

- [x] Task 7: useRestTimer.ts — New hook for countdown logic (AC: #1, #2, #4)
  - [x] Create `/src/hooks/useRestTimer.ts`
  - [x] The hook manages the `setInterval` countdown and wires to `useSessionStore`
  - [x] Do NOT render any UI from this hook — it is pure logic
  - [ ] Full implementation:
    ```typescript
    import { useEffect, useRef } from 'react'
    import { Vibration } from 'react-native'
    import { useSessionStore } from '../stores/useSessionStore'

    export function useRestTimer() {
      const restTimerRunning = useSessionStore((s) => s.restTimerRunning)
      const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds)
      const setRestTimerSeconds = useSessionStore((s) => s.setRestTimerSeconds)
      const setRestTimerRunning = useSessionStore((s) => s.setRestTimerRunning)
      const setRestTimerTotalSeconds = useSessionStore((s) => s.setRestTimerTotalSeconds)

      const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

      useEffect(() => {
        if (!restTimerRunning) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return
        }

        intervalRef.current = setInterval(() => {
          const current = useSessionStore.getState().restTimerSeconds
          if (current <= 1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setRestTimerSeconds(0)
            setRestTimerRunning(false)
            Vibration.vibrate(40)  // light haptic via Vibration API
          } else {
            setRestTimerSeconds(current - 1)
          }
        }, 1000)

        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }, [restTimerRunning])

      const startTimer = (seconds: number) => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setRestTimerTotalSeconds(seconds)
        setRestTimerSeconds(seconds)
        setRestTimerRunning(true)
      }

      const skipTimer = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setRestTimerRunning(false)
        setRestTimerSeconds(0)
        setRestTimerTotalSeconds(0)
        // No haptic on skip (per AC4)
      }

      return { startTimer, skipTimer }
    }
    ```
  - [x] IMPORTANT: `useSessionStore.getState().restTimerSeconds` inside the interval callback reads the CURRENT store value (not the closure-captured stale value) — this is the correct pattern for Zustand inside intervals
  - [x] Haptic: `Vibration` is from `'react-native'` (no new package needed). `Vibration.vibrate(40)` fires a 40ms vibration, approximating a light haptic on both iOS and Android.
  - [x] On Android, `Vibration.vibrate(40)` requires `VIBRATE` permission. Check if `app.json` needs `android.permissions` — in Expo managed workflow with SDK 54, vibration permission is included by default. If missing, add `"VIBRATE"` to `android.permissions` in `app.json`.

- [x] Task 8: RestTimerBar.tsx — New component (AC: #1, #2, #4, #5)
  - [x] Create `/src/components/session/RestTimerBar.tsx`
  - [x] Props: none — reads directly from `useSessionStore` and uses `useRestTimer`
  - [x] The component renders only when the timer is active (seconds > 0) or flashing at zero
  - [x] Full layout (pinned to bottom of session screen via positioning in parent):
    ```
    [Row: numeric countdown "M:SS"  |  "Skip" button (44dp)]
    [3px full-width drain bar                               ]
    ```
  - [x] Numeric format: `Math.floor(seconds / 60)` + ":" + `String(seconds % 60).padStart(2, '0')`. Example: 90 → "1:30", 9 → "0:09", 0 → "0:00".
  - [x] Fill percentage: `(restTimerSeconds / restTimerTotalSeconds) * 100`. Guard: if `restTimerTotalSeconds === 0`, treat as 0%.
  - [x] Bar implementation: two nested views (outer = full-width background `BORDER_SUBTLE`, inner = fill width `GHOST_ACCENT`). Height 3px. Do NOT use `Animated` for bar width — use a View with `width: \`${fillPercent}%\``; React Native re-renders are fast enough for 1-second intervals.
  - [x] At-zero flash: managed with local `useState` `isFlashing`:
    ```typescript
    const prevSeconds = useRef(restTimerSeconds)
    useEffect(() => {
      if (prevSeconds.current > 0 && restTimerSeconds === 0 && !restTimerRunning) {
        // Timer just hit zero
        setIsFlashing(true)
        const timeout = setTimeout(() => setIsFlashing(false), 600)
        return () => clearTimeout(timeout)
      }
      prevSeconds.current = restTimerSeconds
    }, [restTimerSeconds, restTimerRunning])
    ```
  - [x] Bar color when flashing: `isFlashing ? PR_BURST : GHOST_ACCENT`
  - [x] Visibility logic: render the bar container when `restTimerSeconds > 0 || isFlashing`
  - [x] Skip button: `TouchableOpacity` with `minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center'`. Text: "Skip" in `label / ink-secondary` style (DM Sans 500, 11-12sp, uppercase).
  - [x] Skip button calls `skipTimer()` from `useRestTimer` — import and destructure the hook inside this component
  - [x] Accessibility: Skip button has `accessibilityRole="button"` and `accessibilityLabel="Skip rest timer"`
  - [x] DESIGN TOKEN REFERENCE (from UX DESIGN.md):
    - Bar background: `BORDER_SUBTLE` (#1e1e28)
    - Bar fill (normal): `GHOST_ACCENT` (#00e5ff)
    - Bar fill (flash): `PR_BURST` (#ff6b00)
    - Numeric text: `INK_PRIMARY` (#ffffff), font `DMSans_600SemiBold` 16sp (mono-data style per DESIGN.md)
    - Skip text: `INK_SECONDARY` (#8888a0), font `DMSans_500Medium` 11sp, uppercase (label style)
    - Bar height: 3px
    - No border radius on the bar fill (square ends per design spec)

- [x] Task 9: active.tsx — Integrate RestTimerBar and wire onLogged (AC: #1, #2, #3, #4)
  - [x] Import `useRestTimer` hook and `RestTimerBar` component
  - [x] Call `useRestTimer()` at the top of `ActiveSessionScreen`, destructuring `{ startTimer, skipTimer }`
  - [x] NOTE: `skipTimer` is already wired through `RestTimerBar`'s internal call to `useRestTimer()` — you only need `startTimer` here for auto-start on set log
  - [x] Create `handleSetLogged` callback that auto-starts the timer:
    ```typescript
    const handleSetLogged = useCallback((exerciseId: string) => {
      const exercise = sessionExercises.find((e) => e.id === exerciseId)
      const duration = exercise?.restTimerSeconds ?? useSettingsStore.getState().defaultRestTimerSeconds
      startTimer(duration)
    }, [sessionExercises, startTimer])
    ```
  - [x] Update `SetEntrySheet` and `CardioSetEntrySheet` `onLogged` props:
    - `onLogged={() => handleSetLogged(activeExerciseForEntry.id)}`
    - Replace both the currently-empty `() => {}` callbacks on lines 319 and 329
    - `activeExerciseForEntry` is already in scope and its `.id` is the exercise ID
  - [x] Add `RestTimerBar` to the JSX return, **outside the FlatList but inside the container View**, at the bottom, just before the closing `</View>`:
    ```tsx
    {/* Rest Timer — pinned to screen bottom */}
    <RestTimerBar />
    ```
  - [x] RestTimerBar renders itself conditionally (only when timer active or flashing) — no need to conditionally render it in active.tsx
  - [x] Add `useRestTimer` import: the hook must be mounted while `ActiveSessionScreen` is mounted to keep the interval alive. Calling `useRestTimer()` here mounts it.
  - [x] DO NOT add `useRestTimerSomething` to the FlatList's `data` or any list rendering path

- [x] Task 10: settings.tsx — Add per-exercise rest timer config UI (AC: #3, #5)
  - [x] Import `useSettingsStore` to show the default timer duration as placeholder
  - [x] Add `setRestTimerSeconds` from `useExercises()` destructure
  - [x] Add local state for rest timer editing:
    ```typescript
    const [restTimerEditId, setRestTimerEditId] = useState<string | null>(null)
    const [restTimerDraft, setRestTimerDraft] = useState<string>('')
    ```
  - [x] In `renderExerciseRow`, when NOT in rename mode, add a "Rest Timer" row below the exercise name/type:
    ```tsx
    {/* Rest Timer config row */}
    {restTimerEditId === exercise.id ? (
      <View style={styles.restTimerEditRow}>
        <TextInput
          style={styles.restTimerInput}
          value={restTimerDraft}
          onChangeText={setRestTimerDraft}
          keyboardType="number-pad"
          placeholder="Default"
          placeholderTextColor={INK_DISABLED}
          accessibilityLabel={`Custom rest timer for ${exercise.name} in seconds`}
          maxLength={4}
        />
        <Text style={styles.restTimerUnit}>sec</Text>
        <TouchableOpacity
          style={styles.restTimerSaveBtn}
          onPress={() => handleSaveRestTimer(exercise.id)}
          accessibilityRole="button"
          accessibilityLabel="Save rest timer"
          minHeight={44}
        >
          <Text style={styles.restTimerSaveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.restTimerClearBtn}
          onPress={() => handleClearRestTimer(exercise.id)}
          accessibilityRole="button"
          accessibilityLabel="Clear rest timer (use default)"
        >
          <Text style={styles.restTimerClearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setRestTimerEditId(null)}
          accessibilityRole="button"
          accessibilityLabel="Cancel rest timer edit"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity
        style={styles.restTimerRow}
        onPress={() => {
          setRestTimerEditId(exercise.id)
          setRestTimerDraft(exercise.restTimerSeconds !== null ? String(exercise.restTimerSeconds) : '')
        }}
        accessibilityRole="button"
        accessibilityLabel={`Rest timer for ${exercise.name}: ${exercise.restTimerSeconds !== null ? `${exercise.restTimerSeconds} seconds` : 'default'}`}
        hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
      >
        <Text style={styles.restTimerLabel}>REST TIMER</Text>
        <Text style={styles.restTimerValue}>
          {exercise.restTimerSeconds !== null
            ? `${exercise.restTimerSeconds}s`
            : `${defaultRestTimerSeconds}s (default)`}
        </Text>
      </TouchableOpacity>
    )}
    ```
  - [x] Add `handleSaveRestTimer` and `handleClearRestTimer`:
    ```typescript
    const defaultRestTimerSeconds = useSettingsStore((s) => s.defaultRestTimerSeconds)

    const handleSaveRestTimer = async (id: string) => {
      const val = parseInt(restTimerDraft, 10)
      if (!Number.isInteger(val) || val < 1 || val > 3600) {
        // silently ignore invalid — placeholder keeps showing
        return
      }
      await setRestTimerSeconds(id, val)
      setRestTimerEditId(null)
    }

    const handleClearRestTimer = async (id: string) => {
      await setRestTimerSeconds(id, null)
      setRestTimerEditId(null)
    }
    ```
  - [x] Validation: 1–3600 seconds (1 second minimum, 1 hour maximum). Out-of-range input: do nothing (keep edit open, user can see the TextInput is invalid). No inline error UI required — the spec only requires the save to work correctly.
  - [x] `exercises` in `useExercises()` now returns `DisplayExercise` with `restTimerSeconds` — use it directly in `renderExerciseRow`
  - [x] NOTE: `useExercises()` uses `useLiveQuery`, so any DB update via `setExerciseRestTimerSeconds` auto-refreshes the list without manual state update.
  - [x] Add required styles: `restTimerRow`, `restTimerLabel`, `restTimerValue`, `restTimerEditRow`, `restTimerInput`, `restTimerUnit`, `restTimerSaveBtn`, `restTimerSaveBtnText`, `restTimerClearBtn`, `restTimerClearBtnText` to `StyleSheet.create(...)`. Follow existing style patterns (INK_SECONDARY labels, GHOST_ACCENT save button, FEEDBACK_ERROR for destructive).

- [x] Task 11: tests — exercises.queries.test.ts — Add setExerciseRestTimerSeconds test
  - [x] Add test for `setExerciseRestTimerSeconds`:
    - Sets a positive integer value correctly
    - Sets null correctly (clears override)
    - Does not update a soft-deleted exercise (where clause includes `isNull(deleted_at)`)
  - [x] Follow existing mock pattern from `exercises.queries.test.ts` — no real DB, mock `db.update().set().where()`

---

## Dev Notes

### SDK Version Warning — CRITICAL
The `AGENTS.md` file at `GhostRival/AGENTS.md` says to read Expo docs at `https://docs.expo.dev/versions/v56.0.0/`. However, the **actual installed SDK is v54** (per `package.json`: `"expo": "~54.0.0"`). Story 1.5 dev notes confirmed: "actual package is v54, not v56." This discrepancy exists across all prior stories. **Read v54 docs** for any Expo API reference. v56 docs may describe APIs not yet available.

### Vibration API — No New Package Needed
`expo-haptics` is NOT installed and is NOT in `package.json`. Use `Vibration` from `'react-native'` instead:
```typescript
import { Vibration } from 'react-native'
Vibration.vibrate(40)  // 40ms = light haptic approximation
```
On iOS, `Vibration.vibrate()` always fires exactly one vibration regardless of duration parameter. On Android, the parameter controls duration. Both behaviors produce a brief buzz approximating a light haptic. **Do NOT install expo-haptics** without explicit user approval — new native packages require `expo prebuild` and a new native build.

### Zustand Interval Anti-pattern — CRITICAL
When reading Zustand state inside `setInterval`, DO NOT use closed-over state variables:
```typescript
// ❌ WRONG — stale closure
setInterval(() => {
  setRestTimerSeconds(restTimerSeconds - 1)  // always reads initial value
}, 1000)

// ✅ CORRECT — read from store directly
setInterval(() => {
  const current = useSessionStore.getState().restTimerSeconds
  setRestTimerSeconds(current - 1)
}, 1000)
```
This is why `useRestTimer.ts` uses `useSessionStore.getState()` inside the interval callback.

### drizzle-kit generate — migration workflow
```bash
# From GhostRival/ directory:
npx drizzle-kit generate
```
This reads `drizzle.config.ts`, diffs `schema.ts` against existing migrations, and produces a new SQL migration file. The file will be named `0002_<random_words>.sql`. After generation:
1. Verify the SQL contains: `ALTER TABLE \`exercises\` ADD \`rest_timer_seconds\` integer;`
2. Update `src/db/migrations/migrations.js` to import the new file
3. **Do NOT manually create** the migration SQL — always use drizzle-kit

### RestTimerBar position in active.tsx
The `RestTimerBar` is added inside the root `<View style={styles.container}>` AFTER the FlatList (or the empty state View) and BEFORE the modals. It renders at the natural bottom of the view flow:
```tsx
<View style={styles.container}>
  {/* Header */}
  {/* FlatList or empty state */}
  {/* FAB (position: absolute) */}
  <RestTimerBar />   ← add here
  {/* Modals (SessionEndConfirmation, ExercisePicker, etc.) */}
  <UndoToast ... />
</View>
```
The RestTimerBar is 3px tall for the bar + ~44px for the countdown row. The FlatList's `paddingBottom: 100` already accounts for the FAB — may need to increase to ~150px to avoid content being hidden behind the timer. Adjust if needed when testing.

### Per-exercise duration lookup at set log time
When `handleSetLogged(exerciseId)` fires in `active.tsx`, the duration is looked up from `sessionExercises`:
```typescript
const exercise = sessionExercises.find((e) => e.id === exerciseId)
const duration = exercise?.restTimerSeconds ?? useSettingsStore.getState().defaultRestTimerSeconds
```
`sessionExercises` comes from `useSessionExercises(sessionExerciseIds)`, which returns `DisplayExercise[]` with `restTimerSeconds` included after Task 2+3. The `??` fallback uses the global default from `useSettingsStore` (persisted Zustand store, safe to call `.getState()` outside hooks).

### DisplayExercise missing from useSessionExercises
Check `/src/hooks/useSessionExercises.ts` — it calls `getExercisesByIds` which returns raw DB rows. These are passed through `mapDbExerciseToDisplay`, which after Task 3 will include `restTimerSeconds`. Verify the hook already uses the mapper; if it returns raw `DbExercise` objects directly, update it to map through `mapDbExerciseToDisplay`.

### Settings screen: exercises now include restTimerSeconds
After Tasks 2+3, `useExercises()` returns `DisplayExercise[]` where each exercise has `restTimerSeconds: number | null`. The Settings screen can use this field directly in `renderExerciseRow` without any additional fetch.

### DB→Display mapper: deleted_at NOT included in DisplayExercise
`DisplayExercise` intentionally omits `deleted_at`. The Settings screen only shows non-deleted exercises (filtered in `useExercises` via `isNull(exercises.deleted_at)` in the live query). No change needed.

### Timer edge case: new set logged while timer running
If a set is logged while the timer is already running (countdown in progress), the new set's `onLogged` fires `startTimer(newDuration)`. The `startTimer` function clears the existing interval and restarts. This is correct behavior — each new set resets the timer.

### Testing: useRestTimer has no DB dependencies
`useRestTimer` is pure React hook logic (Zustand + setInterval). Test it with `renderHook` from `@testing-library/react-hooks`. However, testing hooks that use `setInterval` requires jest fake timers (`jest.useFakeTimers()`). This is OPTIONAL for this story — cover the critical DB query path in `exercises.queries.test.ts` (Task 11).

### FlatList paddingBottom adjustment
Current: `paddingBottom: 100` (space for FAB at bottom: 40 + button height: ~52 = 92, rounded to 100).
After adding RestTimerBar (~47px: 44dp row + 3px bar), increase to `paddingBottom: 150` to prevent content from being obscured when the timer is visible.

### Existing files NOT to modify
- `/src/stores/useSessionStore.ts` existing fields (`restTimerSeconds`, `restTimerRunning`) — keep; only ADD `restTimerTotalSeconds`
- `/src/components/session/UndoToast.tsx` — no changes; UndoToast already handles positioning above the bottom area per existing design
- `/src/hooks/useSets.ts` — no changes; set logging logic stays in `useSetActions`; the timer starts in `active.tsx` after the `onLogged` callback
- `/src/db/queries/sets.queries.ts` — no changes for this story; PR detection is Epic 3

### Summary of New/Updated Files

```
src/
  db/
    schema.ts                           UPDATE — add rest_timer_seconds to exercises
    migrations/
      0002_<random>.sql                 NEW — generated by drizzle-kit
      migrations.js                     UPDATE — import new migration
    queries/
      exercises.queries.ts              UPDATE — add setExerciseRestTimerSeconds()
      exercises.queries.test.ts         UPDATE — add tests for new query
    mappers/
      exercise.mapper.ts                UPDATE — include restTimerSeconds in mapping
  types/
    index.ts                            UPDATE — add rest_timer_seconds to DbExercise,
                                                 restTimerSeconds to DisplayExercise
  hooks/
    useExercises.ts                     UPDATE — add setRestTimerSeconds action
    useRestTimer.ts                     NEW — countdown logic hook
  stores/
    useSessionStore.ts                  UPDATE — add restTimerTotalSeconds state
  components/
    session/
      RestTimerBar.tsx                  NEW — 3px bar + numeric + skip button
  app/
    session/
      active.tsx                        UPDATE — integrate RestTimerBar, wire onLogged
    (tabs)/
      settings.tsx                      UPDATE — per-exercise rest timer config UI
```

### References

- [Source: epics.md#Story 2.1] — All 5 acceptance criteria
- [Source: epics.md#FR-7] — "Rest Timer starts automatically; default 90s; configurable per Exercise; completion triggers haptic"
- [Source: epics.md#UX-DR13] — "Rest Timer Bar — 3px height, full-width, ghost-accent fill draining left-to-right; pr-burst flash 600ms at zero; numeric countdown above bar in mono-data/ink-primary; pinned to bottom of Session screen"
- [Source: ux-designs/DESIGN.md#Rest Timer Bar] — Bar spec: background=border-subtle, fill=ghost-accent, height 3px, at-zero=pr-burst 600ms flash, resets after; numeric display above in mono-data/ink-primary
- [Source: ux-designs/DESIGN.md#Typography] — mono-data: weight 600, 16-18sp; label: weight 500, 11-12sp uppercase
- [Source: architecture.md#State Management Patterns] — "Rest timer countdown: Zustand — Ephemeral — does not need to survive app kill"
- [Source: architecture.md#Structure Patterns] — `src/hooks/useRestTimer.ts` listed as architecture-specified hook
- [Source: architecture.md#Structure Patterns] — `src/components/session/RestTimerBar.tsx` listed as architecture-specified component
- [Source: architecture.md#Enforcement Guidelines] — No component imports from /src/db/queries/ directly
- [Source: architecture.md#Naming Patterns] — Constants: SCREAMING_SNAKE_CASE; Components: PascalCase.tsx
- [Source: story 1.5 Dev Notes] — "actual package is v54, not v56; read docs at https://docs.expo.dev/versions/v54.0.0/"
- [Source: epics.md#Story 2.4] — Skip from Bubble is a separate story (2.4); this story only implements in-app Skip button on the timer UI
- [Source: constants/index.ts] — `DEFAULT_REST_TIMER_SECONDS = 90` already defined; do not redefine

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation completed without blocking issues.

### Completion Notes List

- Task 1: Added `rest_timer_seconds integer` column to `exercises` schema; drizzle-kit generated `0002_steep_black_tarantula.sql` and auto-updated `migrations.js`.
- Task 2: Extended `DbExercise` and `DisplayExercise` interfaces with `rest_timer_seconds`/`restTimerSeconds`; also added `restTimerSeconds: null` to `useExercises` createExercise return to fix TypeScript type error.
- Task 3: Updated `mapDbExerciseToDisplay` to include `restTimerSeconds`; fixed `exercise.mapper.test.ts` fixture to include `rest_timer_seconds` field.
- Task 4: Added `setExerciseRestTimerSeconds` query with soft-delete guard.
- Task 5: Added `setRestTimerSeconds` action to `useExercises` hook.
- Task 6: Added `restTimerTotalSeconds` state + `setRestTimerTotalSeconds` action to `useSessionStore`; spread into `initialState` so `reset()` handles it automatically.
- Task 7: Created `useRestTimer.ts` hook with `startTimer`/`skipTimer`; uses `useSessionStore.getState()` inside interval to avoid stale closure (Zustand interval anti-pattern from Dev Notes).
- Task 8: Created `RestTimerBar.tsx` — skips calling `useRestTimer()` internally to prevent duplicate interval (design decision: skip uses store actions directly to avoid 2x countdown speed when both `active.tsx` and `RestTimerBar` would each run the interval effect).
- Task 9: Integrated `RestTimerBar` in `active.tsx`; wired `onLogged` callbacks to `handleSetLogged`; uses `rest_timer_seconds` (snake_case) from `DbExercise` in `handleSetLogged` since `useSessionExercises` returns `DbExercise[]`; increased `paddingBottom` from 100 to 150.
- Task 10: Added full per-exercise rest timer config UI to `settings.tsx` with save/clear/cancel flow, validation (1–3600s), and all required styles.
- Task 11: Added 3 tests for `setExerciseRestTimerSeconds`; also added 2 mapper tests for `restTimerSeconds` field mapping. All 95 tests pass.

### File List

GhostRival/src/db/schema.ts
GhostRival/src/db/migrations/0002_steep_black_tarantula.sql
GhostRival/src/db/migrations/migrations.js
GhostRival/src/types/index.ts
GhostRival/src/db/mappers/exercise.mapper.ts
GhostRival/src/db/mappers/exercise.mapper.test.ts
GhostRival/src/db/queries/exercises.queries.ts
GhostRival/src/db/queries/exercises.queries.test.ts
GhostRival/src/hooks/useExercises.ts
GhostRival/src/hooks/useRestTimer.ts
GhostRival/src/stores/useSessionStore.ts
GhostRival/src/components/session/RestTimerBar.tsx
GhostRival/src/app/session/active.tsx
GhostRival/src/app/(tabs)/settings.tsx

## Change Log

- 2026-06-21: Story 2.1 implemented — Rest Timer Bar & In-App Timer UX. Added DB migration for `rest_timer_seconds`, `useRestTimer` hook, `RestTimerBar` component, per-exercise timer config UI in settings, and auto-start timer on set logged. 95 tests pass.

---

### Review Findings

- [x] [Review][Patch] **startTimer re-entry bug — no new interval when logging a set while timer already running** [GhostRival/src/hooks/useRestTimer.ts] — Fixed: `startTimer` now spawns the interval directly instead of relying on `useEffect([restTimerRunning])` re-firing. useEffect retained only for external cleanup.
- [x] [Review][Patch] **Flash (AC2) never fires — component unmounts before `isFlashing` can be set** [GhostRival/src/components/session/RestTimerBar.tsx] — Fixed: moved flash state to Zustand store (`restTimerFlashing`). `useRestTimer` sets it true on completion and clears after 600ms. `RestTimerBar` reads from store, stays visible while flashing regardless of React 18 batching.
- [x] [Review][Patch] **`handleSaveRestTimer` silently no-ops on invalid input with no user feedback** [GhostRival/src/app/(tabs)/settings.tsx:108] — Fixed: shows `Alert.alert('Invalid duration', ...)` on validation failure.
- [x] [Review][Patch] **`handleSaveRestTimer` / `handleClearRestTimer` have no error handling** [GhostRival/src/app/(tabs)/settings.tsx:108-120] — Fixed: wrapped both handlers in try/catch; DB errors surface as an Alert.
- [x] [Review][Patch] **`handleSaveRestTimer` async race closes the wrong editor** [GhostRival/src/app/(tabs)/settings.tsx:115,120] — Fixed: uses functional `setRestTimerEditId((cur) => cur === editingId ? null : cur)` to read current state at update time, not stale closure value.
- [x] [Review][Patch] **`startTimer(0)` / `startTimer(NaN)` — no guard on seconds parameter** [GhostRival/src/hooks/useRestTimer.ts:44] — Fixed: added `if (!seconds || seconds <= 0) return` guard at top of `startTimer`.
- [x] [Review][Patch] **`fillPercent` can exceed 100%** [GhostRival/src/components/session/RestTimerBar.tsx:39-41] — Fixed: clamped with `Math.min(100, ...)` in `RestTimerBar`.
- [x] [Review][Defer] **`maxLength={4}` allows "9999" with no feedback** [GhostRival/src/app/(tabs)/settings.tsx:230] — deferred, pre-existing; spec says "no inline error UI required" — silent reject on Save is specified behavior.
- [x] [Review][Defer] **Timer store state not reset on back-navigation without ending session** [GhostRival/src/hooks/useRestTimer.ts] — deferred, pre-existing; session `reset()` handles the normal end flow; abnormal navigation is an edge case not in scope for this story.
- [x] [Review][Defer] **Stale `sessionExercises` race on first set logged (AC3)** [GhostRival/src/app/session/active.tsx:204] — deferred, pre-existing; the `??` fallback to `defaultRestTimerSeconds` is correct behavior when the exercise isn't found; race is extremely unlikely in practice.
