---
baseline_commit: NO_VCS
---

# Story 1.4: Strength Set Logging

Status: done

## Story

As Mason,
I want to log a Strength Set by entering weight and reps with smart pre-fill,
So that recording each set takes under 5 seconds and never interrupts my training flow.

## Acceptance Criteria

**AC1** — **Given** I have a Strength exercise in my active session and tap it **When** the set entry form opens **Then** weight (in kg or lb per Settings) and reps fields display with correct pre-fill: (1) previous Set's weight/reps + label "Same as last set" if Sets 2+; (2) Ghost benchmark values + label "From your ghost" if Set 1 and Ghost exists; (3) blank fields if Set 1 and no Ghost.

**AC2** — **Given** weight field value is 0 or negative **When** I attempt to tap "Log Set" **Then** "Log Set" is disabled; inline `feedback-error` appears below the weight field: "Weight must be greater than 0."; error clears immediately on correction.

**AC3** — **Given** reps field value is 0 **When** I attempt to tap "Log Set" **Then** "Log Set" is disabled; inline `feedback-error` appears: "Enter at least 1 rep."; error clears immediately on correction.

**AC4** — **Given** I tap "Log Set" with valid weight and reps **When** the Set is confirmed **Then** a row is written to `sets` with `weight_kg` in canonical kilograms (converted from lb if user's unit is lb), `reps` as integer, `logged_at` as Unix epoch integer, `session_id`, and `exercise_id`; a Set Row appears immediately in the exercise list via `useLiveQuery`.

**AC5** — **Given** a Set Row is visible and less than 30 seconds have elapsed since logging **When** I swipe left on the Set Row **Then** the Set is removed from `sets`; an Undo Toast appears ("Set deleted" in ink-secondary + "Undo" link in ghost-accent); toast auto-dismisses after 4 seconds (8 seconds when VoiceOver or TalkBack is active).

**AC6** — **Given** the Undo Toast is visible **When** I tap "Undo" before dismissal **Then** the Set Row is restored in place with the original data.

**AC7** — **Given** more than 30 seconds have elapsed since logging **When** I tap the locked Set Row **Then** a toast appears: "Sets are locked after 30 seconds".

**AC8** — **Given** VoiceOver (iOS) or TalkBack (Android) is active **When** I navigate to a Set Row **Then** accessibility label reads: "Set [number]. [Weight] by [reps]."; a "Delete" custom action is available via `accessibilityActions` (UX-DR25).

**AC9** — **And** the Undo Toast container has `accessibilityLiveRegion` set so screen readers announce "Set deleted" on appearance.

---

## Tasks / Subtasks

- [x] Task 1: sets.queries.ts — Strength Set CRUD (AC: #4, #5, #6)
  - [x] Create `/src/db/queries/sets.queries.ts`
  - [x] `logStrengthSet(data)` → wraps in `db.transaction(tx => ...)`: INSERT into sets (id, session_id, exercise_id, weight_kg, reps, logged_at; duration_s/distance_m = null for strength); inner try/catch stub for future PR detection (see Dev Notes)
  - [x] `getLastSetForExerciseInSession(sessionId, exerciseId)` → SELECT from sets WHERE session_id = ? AND exercise_id = ? ORDER BY logged_at DESC LIMIT 1; returns row or null; used for pre-fill
  - [x] `getSetsForExerciseInSession(sessionId, exerciseId)` → SELECT from sets WHERE session_id = ? AND exercise_id = ? ORDER BY logged_at ASC; returns array; used for live display
  - [x] `getSetsForSession(sessionId)` → SELECT from sets WHERE session_id = ? ORDER BY logged_at ASC; returns all sets; used in summary
  - [x] `deleteSet(id)` → DELETE from sets WHERE id = ?
  - [x] `restoreSet(data)` → INSERT into sets with the original id, session_id, exercise_id, weight_kg, reps, logged_at (preserves original logged_at epoch)
  - [x] Create `/src/db/queries/sets.queries.test.ts` — mocked tests (same pattern as sessions.queries.test.ts)

- [x] Task 2: ghost.queries.ts — Ghost pre-fill query stub (AC: #1)
  - [x] Create `/src/db/queries/ghost.queries.ts`
  - [x] `getGhostForExercise(exerciseId, activeSessionId)` → SELECT from ghosts WHERE exercise_id = ? AND (session_id != ? OR session_id IS NULL) LIMIT 1; returns null until Epic 3 populates ghosts table; see Dev Notes for NULL handling

- [x] Task 3: set.mapper.ts + formatWeight utility (AC: #1, #4, #8)
  - [x] Create `/src/db/mappers/set.mapper.ts`
  - [x] Export `DbSet` interface (snake_case, mirrors schema: id, session_id, exercise_id, weight_kg, reps, duration_s, distance_m, logged_at)
  - [x] `formatWeight(weightKg: number | null, unit: 'kg' | 'lb'): string` — converts for display; lb: `(weightKg / 0.453592).toFixed(1) + ' lb'`; kg: `weightKg + ' kg'`; null: `'–'`
  - [x] `convertToKg(value: number, unit: 'kg' | 'lb'): number` — lb to kg: `value * 0.453592`; kg: pass through
  - [x] Update `/src/types/index.ts` — add `DbSet` interface (snake_case raw DB row)
  - [x] Note: existing `DisplaySet` in types.ts has `displayWeight: string` (not `weightDisplay`) — use `displayWeight` for consistency

- [x] Task 4: useSets.ts hook (AC: #4, #5, #6, #7)
  - [x] Create `/src/hooks/useSets.ts`
  - [x] `useLiveSetsByExercise(sessionId: string | null, exerciseId: string)` → uses `useLiveQuery` from `drizzle-orm/expo-sqlite/query` on sets table with session_id + exercise_id filter, ordered by logged_at ASC; returns DbSet[]; returns [] when sessionId is null
  - [x] `useSetActions()` → returns `{ logStrengthSet, deleteSetForUndo, restoreSet }` actions wrapped in useCallback; all wrap their queries in try/catch with `showToast` on error; `logStrengthSet` reads unit from `useSettingsStore` and calls `convertToKg` before writing `weight_kg`
  - [x] `logStrengthSet(exerciseId, weightRaw, reps)` → generates `crypto.randomUUID()` for id, `Math.floor(Date.now() / 1000)` for logged_at; converts weight; calls SetsQueries.logStrengthSet; returns `{ id, loggedAt }` on success or null on error
  - [x] `deleteSetForUndo(id)` → calls SetsQueries.deleteSet; no return value needed (caller already has the data)
  - [x] `restoreSet(data)` → calls SetsQueries.restoreSet with full data

- [x] Task 5: SetRow.tsx component (AC: #5, #6, #7, #8)
  - [x] Create `/src/components/session/SetRow.tsx`
  - [x] Props: `set: DbSet`, `setNumber: number`, `unit: 'kg' | 'lb'`, `onDelete: (set: DbSet) => void`
  - [x] Layout: `[surface-raised, rounded.sm (8px), padding: 8×16]` — Left: Set number (`mono-data, ink-secondary` — "Set 3"); Center: weight × reps (`display, ink-primary`); Right: ghost delta stub (body, ghost-dim — blank in Story 1.4, Epic 3 wires this)
  - [x] 30s lock window: `useState(isLocked)` initialized from `Date.now()/1000 - set.logged_at >= 30`; if not locked on mount, schedule `setTimeout(() => setIsLocked(true), remainingMs)` then clear on unmount
  - [x] Accessibility (VoiceOver/TalkBack): 90s lock window — detect via `AccessibilityInfo.isScreenReaderEnabled()` in useEffect; store result and use `lockWindowS = screenReaderEnabled ? 90 : 30`
  - [x] Swipe-to-delete (unlocked rows): use `Animated.Value` + `PanResponder` (no gesture library installed — see Dev Notes); on swipe left past threshold → call `onDelete(set)` and animate slide-out; on insufficient swipe → spring back
  - [x] Locked rows: tap → `showToast('Sets are locked after 30 seconds', 'info')` (no swipe affordance)
  - [x] Accessibility label: `"Set ${setNumber}. ${formattedWeight} by ${reps}."`
  - [x] `accessibilityActions`: `[{ name: 'delete', label: 'Delete' }]` — `onAccessibilityAction`: if locked → showToast; else → `onDelete(set)` (UX-DR25)
  - [x] Min touch target: 44dp height (NFR-11)
  - [x] Import `formatWeight` from `../../db/mappers/set.mapper` — NEVER compute display conversion inside component

- [x] Task 6: UndoToast.tsx component (AC: #5, #6, #9)
  - [x] Create `/src/components/session/UndoToast.tsx`
  - [x] Props: `visible: boolean`, `onUndo: () => void`, `onDismiss: () => void`, `screenReaderEnabled?: boolean`
  - [x] Layout: `[surface-overlay, rounded.md (12px), padding: 8×16, margin: spacing.3 from bottom]` — Left: "Set deleted" (body, ink-secondary); Right: "Undo" (body, ghost-accent, tappable)
  - [x] Auto-dismiss: `useEffect` with `setTimeout` — 4000ms normally, 8000ms if `screenReaderEnabled`; calls `onDismiss` on timeout; clears on unmount or when `visible` changes to false
  - [x] `accessibilityLiveRegion="polite"` on the container View (AC9)
  - [x] Position: `position: 'absolute', bottom: 16, left: 16, right: 16` — appears above Rest Timer Bar area

- [x] Task 7: SetEntrySheet.tsx component (AC: #1, #2, #3, #4)
  - [x] Create `/src/components/session/SetEntrySheet.tsx`
  - [x] Props: `visible: boolean`, `exerciseId: string`, `exerciseName: string`, `sessionId: string`, `unit: 'kg' | 'lb'`, `onDismiss: () => void`, `onLogged: () => void`
  - [x] Bottom sheet: React Native `Modal`, `animationType="slide"`, same pattern as ExercisePicker (surface-overlay bg, rounded.lg top corners 16px, Pressable backdrop dismisses)
  - [x] On open: call `SetsQueries.getLastSetForExerciseInSession(sessionId, exerciseId)` for pre-fill; if exists → pre-fill weight + reps + show label "Same as last set"; else call `GhostQueries.getGhostForExercise(exerciseId, sessionId)` → if ghost exists → pre-fill from ghost weight_kg/reps (formatted) + label "From your ghost"; else → blank fields
  - [x] Weight field: `TextInput`, numeric keyboard (`keyboardType="decimal-pad"`), display style (DM Sans 800 weight, 40sp, ink-primary); shows value in user's unit (convert from pre-fill kg using `formatWeight` — strip unit suffix for input value)
  - [x] Reps field: `TextInput`, numeric keyboard (`keyboardType="number-pad"`), display style
  - [x] Pre-fill label: below fields, `body/ink-secondary` — "Same as last set" or "From your ghost"; omit if blank
  - [x] Validation (live, on every keystroke): weight must parse to > 0; reps must parse to integer ≥ 1; disable "Log Set" CTA and show inline `feedback-error` text if invalid
  - [x] Weight error: `feedback-error` below weight field: "Weight must be greater than 0."
  - [x] Reps error: `feedback-error` below reps field: "Enter at least 1 rep."
  - [x] "Log Set" CTA: rounded-pill, ghost-accent border, ink-primary text; disabled state = opacity 0.4 + not pressable; min 44dp height (NFR-11)
  - [x] On "Log Set" tap: call `useSets().logStrengthSet(exerciseId, weightRaw, reps)` where `weightRaw` is the numeric value the user typed (hook handles kg/lb conversion); on success → `onLogged()` + `onDismiss()`; on error → already toasted by hook, stay open
  - [x] inflight guard: `useState(inFlight)` — disable button while request in progress; reset on completion
  - [x] CRITICAL: NEVER import from `/src/db/queries/` directly inside this component — all calls go through hooks

- [x] Task 8: Update active.tsx — exercise cards tappable + set display + UndoToast (AC: #1–#9)
  - [x] Update `/src/app/session/active.tsx`
  - [x] Add state: `activeExerciseForEntry: DbExercise | null` for SetEntrySheet
  - [x] Add state: `undoData: DbSet | null` + `showUndoToast: boolean` for undo
  - [x] Add state: `screenReaderEnabled: boolean` — init via `AccessibilityInfo.isScreenReaderEnabled()`
  - [x] Add `useSettingsStore` to get `unit`
  - [x] Add `activeSessionId` from `useSessionStore`
  - [x] Each exercise card in FlatList: add `onPress={() => setActiveExerciseForEntry(exercise)}` (only for non-deleted exercises); add "Add Set" label or "+" button (ghost-accent, label style)
  - [x] Below each exercise card: render `<ExerciseSetList exerciseId={item.id} sessionId={activeSessionId} unit={unit} onDeleteSet={handleDeleteSet} />` — a sub-component that calls `useLiveSetsByExercise` and renders SetRow list; pass `setNumber` as index+1
  - [x] `handleDeleteSet(set: DbSet)`: call `deleteSetForUndo(set.id)`, store `set` in `undoData`, set `showUndoToast(true)`
  - [x] `handleUndo()`: call `restoreSet(undoData)`, clear `undoData`, hide toast
  - [x] `handleToastDismiss()`: clear `undoData`, hide toast (delete already happened in DB)
  - [x] Add `<SetEntrySheet>` controlled by `activeExerciseForEntry`
  - [x] Add `<UndoToast>` controlled by `showUndoToast`
  - [x] Keep existing: EndConfirmation, ExercisePicker, ExerciseCreator, BackHandler (unchanged)
  - [x] ExerciseSetList: create as inline component or separate file — uses `useLiveSetsByExercise`; renders SetRow list; handles empty (no sets yet = no rows shown, exercise card still tappable)

- [x] Task 9: Update summary.tsx — real set data (AC: #4)
  - [x] Update `/src/app/session/summary.tsx`
  - [x] Replace stub "0 sets" with real data: use `useLiveQuery` on sets WHERE session_id = activeSessionId (read sessionId from store before reset)
  - [x] Group sets by exercise_id; for each exercise: show set count + total volume (Σ weight_kg × reps, formatted in user's unit via `formatWeight`)
  - [x] Volume display: e.g., "3 sets · 360 kg total" using `mono-data/ink-primary` style
  - [x] Read `unit` from `useSettingsStore` for volume display
  - [x] If exercise has 0 sets in session (shouldn't happen but guard): show "0 sets"

### Review Follow-ups (AI)

- [x] [Review][Patch] Undo data overwritten on second swipe-delete — Resolved: disable swipe when toast visible. Pass `deletionLocked={showUndoToast}` from active.tsx → ExerciseSetList → SetRow; add `!deletionLocked` guard in PanResponder `onMoveShouldSetPanResponder`. [active.tsx + SetRow.tsx]

- [x] [Review][Patch] PanResponder stale `isLocked` closure — AC5/AC7 violated: PanResponder captures `isLocked` at creation time; after 30s the lock state changes but swipe still works. Fix: use `isLockedRef = useRef(isLocked)` kept in sync via effect; read `isLockedRef.current` inside PanResponder callbacks. [SetRow.tsx]
- [x] [Review][Patch] Alert hardcodes "30 seconds" for SR users who get 90s window — Wrong duration in locked-row alert. Fix: `` `Sets are locked after ${screenReaderEnabled ? 90 : 30} seconds` ``. [SetRow.tsx:handleLockedTap]
- [x] [Review][Patch] AccessibilityInfo SR changes not subscribed mid-session — If SR toggled on after mount, lock window stays 30s. Fix: `AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled)`. [SetRow.tsx]
- [x] [Review][Patch] `activeSessionId!` non-null assertion in logStrengthSet may throw — Runtime TypeError if store is in unexpected state. Fix: `const sid = useSessionStore.getState().activeSessionId; if (!sid) return null`. [useSets.ts]
- [x] [Review][Patch] `restoreSet` no duplicate-key guard — Double-tap Undo throws UNIQUE constraint violation. Fix: use `INSERT OR REPLACE` or catch UNIQUE error gracefully. [sets.queries.ts]
- [x] [Review][Patch] SetRow/RowContent subcomponent missing TypeScript prop types. Fix: add explicit interface for RowContent props. [SetRow.tsx]
- [x] [Review][Patch] `require('react-native')` inside `handleLockedTap` event handler — Anti-pattern; may fail in certain bundler configs. Fix: import `Alert` at module top. [SetRow.tsx]
- [x] [Review][Patch] Ghost query no ORDER BY — Non-deterministic result when multiple ghosts exist for an exercise. Fix: add `.orderBy(desc(ghosts.created_at))` or similar deterministic sort. [ghost.queries.ts]
- [x] [Review][Patch] AC2/AC3: validation errors hidden when field empty on "Log Set" tap — Button disabled but no inline error text appears; AC2/AC3 require error on tap attempt. Fix: track a `hasAttempted` flag; show errors on attempt regardless of field length. [SetEntrySheet.tsx]
- [x] [Review][Patch] AC1: pre-fill label "Same as last set" / "From your ghost" not rendered in UI — `loadPrefill` returns a `label` field but no JSX renders it. Fix: add `{prefill?.label && <Text style={styles.prefillLabel}>{prefill.label}</Text>}` below fields. [SetEntrySheet.tsx]
- [x] [Review][Patch] `getPrefillForExercise` no null sessionId guard — Passes empty-string to DB query when sessionId is null. Fix: `if (!sessionId) return null` at function top. [useSets.ts]
- [x] [Review][Patch] Lock timeout useEffect missing cleanup — `clearTimeout` not returned; memory leak / setState on unmounted component. Fix: `return () => clearTimeout(t)`. [SetRow.tsx]
- [x] [Review][Patch] `loadPrefill` useEffect no cleanup — Rapid sheet open/close stacks async calls; stale prefill can overwrite fresh data. Fix: cancellation flag (`let cancelled = false; return () => { cancelled = true }`). [SetEntrySheet.tsx]
- [x] [Review][Patch] `handleLogSet` `inFlight` not reset in finally — Button permanently disabled after any error. Fix: `finally { setInFlight(false) }`. [SetEntrySheet.tsx]
- [x] [Review][Patch] `weightValid` partial parse passes — `parseFloat('1abc')===1` accepts malformed weight string. Fix: `Number.isFinite(Number(weightText)) && Number(weightText) > 0`. [SetEntrySheet.tsx]
- [x] [Review][Patch] `repsValid` fractional reps silently truncated — `parseInt('2.9')===2` writes wrong rep count. Fix: `Number.isInteger(Number(repsText)) && Number(repsText) >= 1`. [SetEntrySheet.tsx]
- [x] [Review][Patch] `handleDeleteSet` shows undo toast when `deleteSetForUndo` throws — Undo toast appears for a set that was never deleted; restoring it inserts a phantom row. Fix: check for success before setting toast state. [active.tsx]
- [x] [Review][Patch] `handleUndo` state not cleared when `restoreSet` throws — Toast and `undoData` remain stale; second undo attempt re-runs. Fix: `finally { setUndoData(null); setShowUndoToast(false) }`. [active.tsx]
- [x] [Review][Patch] UndoToast rapid toggle dep array may exclude `onDismiss` — Two dismiss timeouts race on rapid visible toggle. Fix: ensure useEffect dep array is `[visible, screenReaderEnabled, onDismiss]`. [UndoToast.tsx]
- [x] [Review][Patch] `formatWeight` lb→kg→lb round-trip floating-point noise in pre-fill — Verify `.toFixed(1)` is applied to the lb result; strip and re-format in SetEntrySheet pre-fill strip logic. [set.mapper.ts + SetEntrySheet.tsx]

- [x] [Review][Defer] `useLiveSetsByExercise` still subscribes with empty-string when sessionId=null [useSets.ts] — deferred; empty-string query returns no rows, functionally correct; performance non-issue at this scale
- [x] [Review][Defer] ExerciseSetList brief flash of empty before first live query result [active.tsx] — deferred; minor UX, adding a loading state is a future improvement
- [x] [Review][Defer] `getExerciseSummary` not memoized in summary.tsx [summary.tsx] — deferred; single-render summary screen, perf optimization not needed now
- [x] [Review][Defer] `convertToKg` no lower-bound guard for negative values [set.mapper.ts] — deferred; defense-in-depth; UI layer validates weight > 0 before calling
- [x] [Review][Defer] `summary.tsx` `useLiveSetsForSession(null)` post-reset concern [summary.tsx] — deferred; impossible in normal flow; summary renders before handleDone() calls reset()

---

## Dev Notes

### CRITICAL: No Gesture Library Installed

`react-native-gesture-handler` and `react-native-reanimated` are NOT in package.json. Swipe-to-delete must use React Native's built-in `Animated` + `PanResponder`:

```typescript
import { Animated, PanResponder } from 'react-native'

const SWIPE_THRESHOLD = -80  // px left to trigger delete

const pan = useRef(new Animated.Value(0)).current
const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > Math.abs(g.dy) && g.dx < -10,
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) pan.setValue(g.dx)
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < SWIPE_THRESHOLD) {
        Animated.timing(pan, { toValue: -400, duration: 200, useNativeDriver: true }).start(onDelete)
      } else {
        Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start()
      }
    },
  })
).current

return (
  <Animated.View
    style={{ transform: [{ translateX: pan }] }}
    {...panResponder.panHandlers}
  >
    {/* row content */}
  </Animated.View>
)
```

### Architecture Boundary — MUST Follow

```
sets.queries.ts → useSets.ts → SetEntrySheet.tsx / SetRow.tsx / active.tsx
ghost.queries.ts → (used via SetEntrySheet pre-fill logic, accessed through hook or direct query in the sheet)
```

`Components NEVER import from /src/db/queries/ directly.` All DB calls go through hooks.

**Exception nuance:** `SetEntrySheet` calls `getLastSetForExerciseInSession` + `getGhostForExercise` directly in a `useEffect` on open for pre-fill. This is a one-time async fetch (not reactive display), so it goes in the hook (`useSetActions`) rather than the component directly. Expose as `getPrefillForExercise(exerciseId, sessionId)` from `useSets`.

### PR Detection Stub Pattern (ARCH requirement)

`logStrengthSet` in `sets.queries.ts` MUST use the transaction pattern with inner PR try/catch, even though PR detection is a no-op today (Epic 3 / Story 3.3 wires `detectPr()`):

```typescript
import { db } from '../client'
import { sets } from '../schema'

export async function logStrengthSet(data: {
  id: string; sessionId: string; exerciseId: string
  weightKg: number; reps: number; loggedAt: number
}) {
  await db.transaction(async (tx) => {
    await tx.insert(sets).values({
      id: data.id,
      session_id: data.sessionId,
      exercise_id: data.exerciseId,
      weight_kg: data.weightKg,
      reps: data.reps,
      duration_s: null,  // strength sets have no duration
      distance_m: null,  // strength sets have no distance
      logged_at: data.loggedAt,
    })
    // PR detection stub — Story 3.3 inserts detectPr(tx, data) here
    try {
      // await detectPr(tx, data.exerciseId, data)  // Epic 3
    } catch (prError) {
      console.error('[PR Detection] Failed — set write preserved:', prError)
    }
  })
}
```

### Ghost NULL Session_id Handling

The ghosts table has `session_id` as nullable. The ghost candidate query rule is "WHERE session_id != :active_session_id" — but SQL `!=` does NOT match NULL rows. Use:

```typescript
import { ne, isNull, or, and, eq } from 'drizzle-orm'

export async function getGhostForExercise(exerciseId: string, activeSessionId: string) {
  const result = await db.select().from(ghosts)
    .where(and(
      eq(ghosts.exercise_id, exerciseId),
      or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId))
    ))
    .limit(1)
  return result[0] ?? null
}
```

### Unit Conversion — MUST store kg

```typescript
// In set.mapper.ts
export function convertToKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * 0.453592 : value
}

export function formatWeight(weightKg: number | null, unit: 'kg' | 'lb'): string {
  if (weightKg === null) return '–'
  if (unit === 'lb') return `${(weightKg / 0.453592).toFixed(1)} lb`
  // kg: show whole numbers when clean, 1 decimal otherwise
  return `${Number.isInteger(weightKg) ? weightKg : weightKg.toFixed(1)} kg`
}
```

`convertToKg` called in `useSetActions.logStrengthSet()` — the component passes the raw typed value + unit; the hook converts before writing to DB. Component never does unit math.

### Drizzle useLiveQuery Import Path

**Always use this path** (confirmed in Story 1.3 debug log, drizzle-orm 0.45.2):

```typescript
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query'  // ✅
// NOT: import { useLiveQuery } from 'drizzle-orm'           // ❌ wrong path
```

```typescript
export function useLiveSetsByExercise(sessionId: string | null, exerciseId: string) {
  const { data } = useLiveQuery(
    db.select().from(sets)
      .where(and(eq(sets.session_id, sessionId ?? ''), eq(sets.exercise_id, exerciseId)))
      .orderBy(asc(sets.logged_at)),
    [sessionId, exerciseId]  // dependency array — second param to useLiveQuery
  )
  if (!sessionId) return []
  return data ?? []
}
```

### Testing Pattern — Mocked (expo-sqlite Can't Run in Jest)

Architecture doc says "run against actual SQLite" — **this is wrong for Jest** (confirmed Story 1.2 + 1.3). expo-sqlite is a native module; Jest cannot run it. Use mocked pattern from existing query tests:

```typescript
jest.mock('../../client', () => ({ db: { insert: jest.fn(), ... } }))
jest.mock('../../schema', () => ({ sets: {} }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn(), and: jest.fn(), asc: jest.fn(), ... }))
```

### 30s Lock Window Implementation

SetRow internal timer (DO NOT do this in the parent — would cause 50+ re-renders):

```typescript
const LOCK_WINDOW_S = 30
const SR_LOCK_WINDOW_S = 90

const [isLocked, setIsLocked] = useState(() =>
  Math.floor(Date.now() / 1000) - props.set.logged_at >= LOCK_WINDOW_S
)

useEffect(() => {
  if (isLocked) return
  const elapsed = Math.floor(Date.now() / 1000) - props.set.logged_at
  const windowS = screenReaderEnabled ? SR_LOCK_WINDOW_S : LOCK_WINDOW_S
  const remainingMs = (windowS - elapsed) * 1000
  if (remainingMs <= 0) { setIsLocked(true); return }
  const t = setTimeout(() => setIsLocked(true), remainingMs)
  return () => clearTimeout(t)
}, [isLocked, props.set.logged_at, screenReaderEnabled])
```

### Expo SDK Version Mismatch

Architecture doc says "Expo SDK 55" but `package.json` shows `"expo": "~54.0.0"`. Always read versioned docs at **https://docs.expo.dev/versions/v54.0.0/** (not v56 as AGENTS.md suggests v56, but actual installed is 54). Applies to: `AccessibilityInfo`, `Animated`, `PanResponder`, `Modal`, `TextInput`, keyboard types.

### SetEntrySheet Pre-fill Load Order

```
1. getLastSetForExerciseInSession(sessionId, exerciseId) → non-null → use it, label "Same as last set"
2. (only if step 1 returns null) getGhostForExercise(exerciseId, sessionId) → non-null → use it, label "From your ghost"
3. (both null) → blank, no label
```

Expose as single hook function to avoid race conditions:

```typescript
// In useSets.ts
const getPrefillForExercise = useCallback(async (exerciseId: string, sessionId: string) => {
  const lastSet = await SetsQueries.getLastSetForExerciseInSession(sessionId, exerciseId)
  if (lastSet) return { weightKg: lastSet.weight_kg, reps: lastSet.reps, label: 'Same as last set' as const }
  const ghost = await GhostQueries.getGhostForExercise(exerciseId, sessionId)
  if (ghost) return { weightKg: ghost.weight_kg, reps: ghost.reps, label: 'From your ghost' as const }
  return null
}, [])
```

### Undo Pattern — In-Memory, No Soft Delete

Schema has no `deleted_at` on `sets`. Undo is implemented as:
1. Physical DELETE from DB on swipe
2. Store `DbSet` data in `active.tsx` component state (`undoData`)
3. If user taps Undo → re-INSERT via `restoreSet(undoData)` (same id + original logged_at)
4. If toast auto-dismisses → clear `undoData` (delete was already permanent)

`restoreSet` in sets.queries.ts uses a plain `db.insert()` (no transaction needed — it's a restore, no PR risk):

```typescript
export async function restoreSet(data: DbSet) {
  await db.insert(sets).values({
    id: data.id, session_id: data.session_id, exercise_id: data.exercise_id,
    weight_kg: data.weight_kg, reps: data.reps,
    duration_s: data.duration_s, distance_m: data.distance_m,
    logged_at: data.logged_at,
  })
}
```

**Concurrent undo edge case:** if user logs another set with the same exercise between delete and undo, `restoreSet` may reinsert out of order. The sets display is `ORDER BY logged_at ASC` so the restored set will appear at its original position. This is acceptable — the original `logged_at` is preserved.

### DbSet Type to Add to types/index.ts

```typescript
export interface DbSet {
  id: string
  session_id: string
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  duration_s: number | null
  distance_m: number | null
  logged_at: number  // Unix epoch seconds
}
```

### Summary Screen — Volume Calculation

```typescript
// volume_kg = Σ (weight_kg * reps) across all sets for the exercise
const volumeKg = sets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
const volumeDisplay = formatWeight(volumeKg, unit) + ' total volume'
```

### Files That Must NOT Be Recreated

Already exist from Stories 1.1–1.3:
- `/src/db/schema.ts` ✅ (sets table already defined)
- `/src/db/client.ts` ✅
- `/src/constants/index.ts` ✅ (FEEDBACK_ERROR, all color tokens)
- `/src/stores/useSessionStore.ts` ✅ (has sessionExerciseIds, activeSessionId, sessionStartedAt, restTimerSeconds)
- `/src/stores/useSettingsStore.ts` ✅ (has `unit: 'kg' | 'lb'`)
- `/src/hooks/useSessions.ts` ✅
- `/src/hooks/useSessionExercises.ts` ✅
- `/src/hooks/useExercises.ts` ✅
- `/src/components/session/ExerciseCreator.tsx` ✅
- `/src/components/session/ExercisePicker.tsx` ✅
- `/src/components/session/SessionEndConfirmation.tsx` ✅
- `/src/lib/toast.ts` ✅
- `/src/db/mappers/exercise.mapper.ts` ✅
- `/src/db/queries/exercises.queries.ts` ✅ (has getExercisesByIds)
- `/src/db/queries/sessions.queries.ts` ✅

### Design Tokens — Set Logging UI

From DESIGN.md:
- Set Row: `surface-raised` (#141418), `rounded.sm` (8px), padding `spacing.2 × spacing.4` (8px × 16px)
- Set number: `mono-data` style — DMSans 600, 16sp, `ink-secondary` (#8888a0)
- Weight × Reps: `display` style — DMSans 800, 40sp, `ink-primary` (#ffffff)
- Ghost delta (stub, Epic 3): `body` style, `ghost-dim` (rgba(0,229,255,0.40))
- Undo Toast: `surface-overlay` (#1a1a22), `rounded.md` (12px), padding 8×16, `spacing.3` margin from bottom edge
- Feedback error: `FEEDBACK_ERROR` (#ff4444), `body` style
- Log Set CTA: ghost-accent border, ink-primary text, rounded-pill (999px)

### Summary of New/Updated Files

```
src/
  db/
    queries/
      sets.queries.ts          NEW — logStrengthSet (with tx+PR stub), getLastSet, getSets, getSetsForSession, deleteSet, restoreSet
      sets.queries.test.ts     NEW — mocked tests
      ghost.queries.ts         NEW — getGhostForExercise (session exclusion, NULL-safe)
    mappers/
      set.mapper.ts            NEW — DbSet type, formatWeight, convertToKg
  hooks/
    useSets.ts                 NEW — useLiveSetsByExercise, useLiveSetsForSession, useSetActions (logStrengthSet, deleteSetForUndo, restoreSet, getPrefillForExercise)
  components/
    session/
      SetRow.tsx               NEW — Animated+PanResponder swipe-delete, 30s lock timer, a11y
      UndoToast.tsx            NEW — 4s/8s auto-dismiss, accessibilityLiveRegion
      SetEntrySheet.tsx        NEW — bottom sheet, pre-fill, weight/reps fields, validation
  app/
    session/
      active.tsx               UPDATE — exercise cards tappable, ExerciseSetList inline component, SetEntrySheet, UndoToast
      summary.tsx              UPDATE — replace "0 sets" stub with real set count + volume per exercise
  types/
    index.ts                   UPDATE — add DbSet interface
```

### References

- [Source: epics.md#Story 1.4] — All 9 acceptance criteria
- [Source: architecture.md#Data Architecture] — canonical kg storage, sets schema, `useLiveQuery` for reactive display
- [Source: architecture.md#PR Detection Pattern] — transaction pattern, inner try/catch
- [Source: architecture.md#DB→Display Mapper Pattern] — formatWeight in mappers, never in components
- [Source: architecture.md#State Management Patterns] — "Active sets in session → Drizzle useLiveQuery" (not Zustand)
- [Source: architecture.md#Naming Patterns] — SetRow.tsx PascalCase, sets.queries.ts snake_case
- [Source: architecture.md#Enforcement Guidelines] — weight in canonical kg, components never import from /db/queries/
- [Source: DESIGN.md#Set Row] — UX-DR4 base component spec (set number, weight×reps, ghost delta)
- [Source: DESIGN.md#Undo Toast] — UX-DR20 position, content, dismiss timing
- [Source: EXPERIENCE.md#Component Inventory] — swipe-to-delete 30s/90s window, accessibility custom actions UX-DR25
- [Source: EXPERIENCE.md#Set entry pre-fill] — pre-fill hierarchy rules
- [Source: EXPERIENCE.md#PR rollback after swipe-to-delete] — delete within window retracts Hall of Fame (stub for Epic 3)
- [Source: story 1.3 Dev Notes#Critical: Drizzle useLiveQuery Import Path] — `drizzle-orm/expo-sqlite/query`
- [Source: story 1.3 Dev Notes#Architecture Boundary] — components NEVER import from /src/db/queries/
- [Source: NFR-11] — 44dp minimum touch targets

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented all 9 tasks in Story 1.4 (Strength Set Logging) in a single session.
- Added `DbSet` to `types/index.ts` before Task 1 as a prerequisite for type-safe queries.
- Used `db.transaction()` with inner PR detection stub in `logStrengthSet` per architecture requirement.
- `ghost.queries.ts` uses `or(isNull(...), ne(...))` for NULL-safe session exclusion.
- `set.mapper.ts` exports `formatWeight` (null-safe, unit-aware) and `convertToKg`; components never do unit math.
- `useSets.ts` exports `useLiveSetsByExercise`, `useLiveSetsForSession`, and `useSetActions`; added `getPrefillForExercise` per dev notes exception pattern.
- `SetRow.tsx` uses `Animated` + `PanResponder` (no gesture library); lock window respects `AccessibilityInfo.isScreenReaderEnabled()` (30s vs 90s).
- `UndoToast.tsx` implements 4s/8s auto-dismiss with `accessibilityLiveRegion="polite"`.
- `SetEntrySheet.tsx` calls `getPrefillForExercise` via hook on open; live validation on every keystroke; inflight guard prevents double-submit.
- `active.tsx` uses `ExerciseSetList` inline component wrapping `useLiveSetsByExercise`; handles delete/undo state in parent.
- `summary.tsx` uses `useLiveSetsForSession` to compute per-exercise set count + volume.
- All 59 tests pass (7 suites), no regressions.

### File List

- `src/types/index.ts` — updated (added DbSet interface)
- `src/db/queries/sets.queries.ts` — new
- `src/db/queries/sets.queries.test.ts` — new
- `src/db/queries/ghost.queries.ts` — new
- `src/db/mappers/set.mapper.ts` — new
- `src/hooks/useSets.ts` — new
- `src/components/session/SetRow.tsx` — new
- `src/components/session/UndoToast.tsx` — new
- `src/components/session/SetEntrySheet.tsx` — new
- `src/app/session/active.tsx` — updated
- `src/app/session/summary.tsx` — updated

## Change Log

- 2026-06-20: Story 1.4 implementation complete — Strength Set Logging with CRUD, swipe-to-delete+undo, 30s lock window, accessibility, pre-fill hierarchy, and summary volume display.
