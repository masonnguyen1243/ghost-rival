---
baseline_commit: NO_VCS
---

# Story 1.5: Cardio Set Logging

Status: done

## Story

As Mason,
I want to log a Cardio Set by entering duration and optional distance,
So that cardio sessions are tracked with the same zero-friction experience as strength training.

## Acceptance Criteria

**AC1** — **Given** I have a Cardio exercise in my active session and tap it **When** the set entry form opens **Then** a duration field (mm:ss format — implemented as two TextInput fields: minutes + seconds) and an optional distance field are shown; pre-fill follows the same hierarchy as Strength: (1) previous Set's `duration_s`/`distance_m` + label "Same as last set" if Sets 2+; (2) Ghost `duration_s`/`distance_m` + label "From your ghost" if Set 1 and Ghost exists with cardio data; (3) blank fields if Set 1 and no Ghost.

**AC2** — **Given** I enter both duration and distance then tap "Log Set" **When** the Set is confirmed **Then** pace is calculated and displayed automatically in the Set Row: `pace_sec_per_km = duration_s / (distance_m / 1000)`; displayed as "mm:ss /km" when unit is 'kg', or "mm:ss /mi" when unit is 'lb' (unit setting doubles as metric/imperial selector).

**AC3** — **Given** duration is 0:00 (both minutes and seconds are 0 or empty) **When** I attempt to tap "Log Set" **Then** "Log Set" is disabled; inline `feedback-error` appears below the duration field: "Enter a duration greater than 0:00."; error clears immediately on correction.

**AC4** — **Given** I confirm a Cardio Set **When** the Set is written to the DB **Then** `duration_s` is stored as canonical integer seconds; `distance_m` is stored as canonical float meters (null if no distance entered); `weight_kg` is null; `reps` is null; no conversion losses regardless of display unit. Distance display unit maps to weight unit: 'kg' → km (divide by 1000), 'lb' → miles (divide by 1609.344).

**AC5** — **Given** VoiceOver or TalkBack is active and I navigate to a Cardio Set Row **When** focus lands on the row **Then** accessibility label includes duration and distance: e.g., "Set 2. 25 minutes, 5 kilometres." (or "5 miles" when unit is 'lb'); if no distance: "Set 2. 25 minutes."

---

## Tasks / Subtasks

- [x] Task 1: cardio.mapper.ts — Cardio display utilities (AC: #1, #2, #4, #5)
  - [x] Create `/src/db/mappers/cardio.mapper.ts`
  - [x] `parseDurationToSeconds(minutes: string, seconds: string): number` — parses two separate fields; returns total seconds; returns 0 if either field is empty or non-numeric
  - [x] `formatDuration(durationS: number): string` — formats seconds to display "mm:ss" (e.g., 1500 → "25:00", 90 → "1:30"); always two-digit seconds
  - [x] `formatDistanceDisplay(distanceM: number | null, unit: 'kg' | 'lb'): string | null` — null if no distance; 'kg' → km (`(distanceM / 1000).toFixed(2) + ' km'`); 'lb' → mi (`(distanceM / 1609.344).toFixed(2) + ' mi'`); returns null when distanceM is null
  - [x] `convertDistanceToMeters(value: number, unit: 'kg' | 'lb'): number` — 'kg' → value × 1000 (km to m); 'lb' → value × 1609.344 (mi to m)
  - [x] `calculatePaceSecPerKm(durationS: number, distanceM: number): number` — returns `durationS / (distanceM / 1000)`; caller guards against distanceM === 0
  - [x] `formatPace(paceSecPerKm: number, unit: 'kg' | 'lb'): string` — 'kg' → "mm:ss /km"; 'lb' → convert to sec/mi first: `(paceSecPerKm * 1.60934)`, then format as "mm:ss /mi"
  - [x] `formatDurationAccessibility(durationS: number): string` — verbose form for screen readers: "25 minutes" or "25 minutes 30 seconds" or "45 seconds"
  - [x] `formatDistanceAccessibility(distanceM: number | null, unit: 'kg' | 'lb'): string | null` — verbose: "5 kilometres" / "3.1 miles" / null

- [x] Task 2: sets.queries.ts — Add logCardioSet (AC: #4)
  - [x] Add `logCardioSet(data: { id, sessionId, exerciseId, durationS, distanceM, loggedAt })` to `/src/db/queries/sets.queries.ts`
  - [x] Uses same `db.transaction(async (tx) => {...})` + inner PR try/catch stub as `logStrengthSet`
  - [x] Writes `weight_kg: null`, `reps: null`, `duration_s: data.durationS`, `distance_m: data.distanceM` (can be null)
  - [x] Add test coverage in `/src/db/queries/sets.queries.test.ts` (mocked pattern — same as existing tests)

- [x] Task 3: useSets.ts — Add logCardioSet + extend getPrefillForExercise (AC: #1, #4)
  - [x] Extend `getPrefillForExercise` return type to include `durationS: number | null` and `distanceM: number | null`:
    ```typescript
    Promise<{
      weightKg: number | null
      reps: number | null
      durationS: number | null
      distanceM: number | null
      label: 'Same as last set' | 'From your ghost'
    } | null>
    ```
  - [x] Update `getPrefillForExercise` implementation: the existing `SetsQueries.getLastSetForExerciseInSession` already returns `DbSet` which has `duration_s` and `distance_m` — just add them to the return object
  - [x] `GhostQueries.getGhostForExercise` already returns all columns including `duration_s` and `distance_m` (confirmed in ghost.queries.ts) — add them to the ghost prefill path as well
  - [x] Add `logCardioSet(exerciseId, durationS, distanceM | null)` action:
    - Reads `unit` from `useSettingsStore` (used only if distance is provided, not strictly needed since distanceM is already in meters)
    - `id = crypto.randomUUID()`, `loggedAt = Math.floor(Date.now() / 1000)`
    - Guard: `const sessionId = useSessionStore.getState().activeSessionId; if (!sessionId) return null`
    - Calls `SetsQueries.logCardioSet({ id, sessionId, exerciseId, durationS, distanceM, loggedAt })`
    - Returns `{ id, loggedAt }` on success, null on error (with `showToast`)
  - [x] Export `logCardioSet` from `useSetActions()`

- [x] Task 4: CardioSetEntrySheet.tsx — New component (AC: #1, #2, #3, #4)
  - [x] Create `/src/components/session/CardioSetEntrySheet.tsx`
  - [x] Props: identical shape to SetEntrySheet — `{ visible, exerciseId, exerciseName, sessionId, unit, onDismiss, onLogged }`
  - [x] Bottom sheet: same Modal pattern as `SetEntrySheet.tsx` — `animationType="slide"`, `surface-overlay` background, `rounded.lg` (16px) top corners, Pressable backdrop dismisses
  - [x] Duration input: TWO TextInput fields side by side — "Min" (minutes, `keyboardType="number-pad"`) and "Sec" (seconds, `keyboardType="number-pad"`); display style (DMSans 800, 40sp, ink-primary); separator ":" between them in ink-secondary; min-max: minutes 0–999, seconds 0–59
  - [x] Distance input: single TextInput — `keyboardType="decimal-pad"`, optional; label shows "km" or "mi" based on `unit` ('kg' → km, 'lb' → mi); display style
  - [x] Pre-fill on open: call `getPrefillForExercise(exerciseId, sessionId)` via `useSetActions()`; populate minutes/seconds from `prefill.durationS` using `Math.floor(durationS / 60)` and `durationS % 60`; populate distance from `prefill.distanceM` converted to display unit; show label
  - [x] Live pace preview (when both duration and distance are entered and valid): show calculated pace below distance field in `body / ghost-dim`: "≈ mm:ss /km" (or /mi) — purely informational, no validation
  - [x] Validation (live, every keystroke):
    - Duration invalid: total seconds = 0 (both fields empty or both "0") → disable Log Set CTA
    - Duration error text: "Enter a duration greater than 0:00." (shown after first tap attempt or if user clears after typing)
    - Seconds must be 0–59: if seconds field > 59, clamp to 59 on blur or ignore extra input
    - Distance: optional; if entered, must parse to > 0; if 0 or non-numeric: disable Log Set + show "Enter a valid distance." below distance field
  - [x] `hasAttempted` flag: same pattern as `SetEntrySheet` — only show error text after first "Log Set" tap attempt
  - [x] On "Log Set" tap: call `logCardioSet(exerciseId, totalDurationS, distanceM | null)` where `distanceM = convertDistanceToMeters(distanceValue, unit)` if distance is entered; `totalDurationS = parseDurationToSeconds(minutesText, secondsText)`; on success → `onLogged()` + `onDismiss()`
  - [x] InFlight guard: disable button during request; `finally { setInFlight(false) }`
  - [x] Cleanup on dismiss: reset all state fields + `hasAttempted`
  - [x] 44dp minimum touch targets on all fields and CTA (NFR-11)
  - [x] NEVER import from `/src/db/queries/` directly — all calls through hooks

- [x] Task 5: SetRow.tsx — Handle cardio set display (AC: #2, #5)
  - [x] Add imports: `formatDuration`, `formatDistanceDisplay`, `calculatePaceSecPerKm`, `formatPace`, `formatDurationAccessibility`, `formatDistanceAccessibility` from `../../db/mappers/cardio.mapper`
  - [x] Detect cardio set: `const isCardio = set.duration_s !== null && set.weight_kg === null`
  - [x] Update `RowContent` props: add `set: DbSet` and `unit: 'kg' | 'lb'` (instead of just `formattedWeight` + `reps`)
  - [x] Cardio `RowContent` display:
    - Left: Set number (`mono-data / ink-secondary`) — unchanged
    - Center (when isCardio): `formatDuration(duration_s)` + (if distance) `" / " + formatDistanceDisplay(distance_m, unit)` in `display / ink-primary`; pace on second line below in `body / ink-secondary`: `formatPace(pace, unit)` (only when distance is present)
    - Center (when strength): existing `formattedWeight × reps` unchanged
    - Right: ghost delta stub (Epic 3) — unchanged
  - [x] Update accessibility label: when isCardio → `"Set ${setNumber}. ${formatDurationAccessibility(duration_s)}${distance_m ? ', ' + formatDistanceAccessibility(distance_m, unit) : ''}."` — matches AC5 format
  - [x] Strength path MUST remain unchanged — do not touch the existing weight × reps rendering logic

- [x] Task 6: active.tsx — Route to correct entry sheet (AC: #1)
  - [x] Import `CardioSetEntrySheet` from `../../components/session/CardioSetEntrySheet`
  - [x] Update the `SetEntrySheet` render block: check `activeExerciseForEntry.type`:
    ```typescript
    {activeExerciseForEntry && activeSessionId && (
      activeExerciseForEntry.type === 'cardio'
        ? <CardioSetEntrySheet
            visible={true}
            exerciseId={activeExerciseForEntry.id}
            exerciseName={activeExerciseForEntry.name}
            sessionId={activeSessionId}
            unit={unit}
            onDismiss={() => setActiveExerciseForEntry(null)}
            onLogged={() => {}}
          />
        : <SetEntrySheet
            visible={true}
            exerciseId={activeExerciseForEntry.id}
            exerciseName={activeExerciseForEntry.name}
            sessionId={activeSessionId}
            unit={unit}
            onDismiss={() => setActiveExerciseForEntry(null)}
            onLogged={() => {}}
          />
    )}
    ```
  - [x] No other changes to active.tsx — handleDeleteSet, UndoToast, ExercisePicker, ExerciseCreator all unchanged

- [x] Task 7: summary.tsx — Handle cardio in exercise summary (AC: #4)
  - [x] Import `formatDuration`, `formatDistanceDisplay` from `../../db/mappers/cardio.mapper`
  - [x] Update `getExerciseSummary(exerciseId)`: detect if any sets for exercise have `duration_s !== null` → cardio exercise
  - [x] Cardio summary: total duration = `Σ duration_s` across all sets for exercise; show as `formatDuration(totalDurationS)` + (if any sets have distance) total distance as `formatDistanceDisplay(totalDistanceM, unit)`
    - Format: `"${setCount} ${setCount === 1 ? 'set' : 'sets'} · ${formatDuration(totalDurationS)} total"` — or with distance: `"${setCount} sets · ${formatDuration(totalDurationS)} · ${distanceDisplay}"`
  - [x] Strength summary unchanged — volume calculation only applies when `weight_kg !== null`

- [x] Task 8: sets.queries.test.ts — Add cardio test coverage (AC: #4)
  - [x] Add test: `logCardioSet` writes `weight_kg: null`, `reps: null`, correct `duration_s` and `distance_m`
  - [x] Add test: `logCardioSet` with null `distanceM` stores null in DB
  - [x] Use same mock pattern as existing tests (`jest.mock('../../client', ...)`)

---

## Dev Notes

### CRITICAL: No Gesture Library, No Masked Input Library

`react-native-masked-text` and `react-native-gesture-handler` are NOT installed. Duration must use TWO separate TextInput fields (minutes + seconds), not a single masked `mm:ss` input.

```
[  Min  ] : [  Sec  ]
[  25   ] : [  00   ]
```

Both fields use `keyboardType="number-pad"`. This avoids the need for any colon-insertion logic.

### Unit Mapping: Weight Unit → Distance Unit

| `unit` setting | Weight display | Distance display | Pace display |
|---|---|---|---|
| `'kg'` | kilograms | km | mm:ss /km |
| `'lb'` | pounds | miles | mm:ss /mi |

No additional setting needed — metric users use kg+km, imperial users use lb+mi. The `useSettingsStore` `unit` field drives both weight AND distance display.

### Cardio Set Detection in SetRow

A set is cardio if `set.duration_s !== null && set.weight_kg === null`. This is always true for cardio sets written by `logCardioSet` (which sets `weight_kg: null`). Never use `exercise.type` inside SetRow — SetRow only receives the `DbSet` row.

```typescript
const isCardio = set.duration_s !== null && set.weight_kg === null
```

### parseDurationToSeconds Edge Cases

```typescript
export function parseDurationToSeconds(minutes: string, seconds: string): number {
  const m = parseInt(minutes, 10)
  const s = parseInt(seconds, 10)
  const mins = Number.isFinite(m) && m >= 0 ? m : 0
  const secs = Number.isFinite(s) && s >= 0 && s <= 59 ? s : 0
  return mins * 60 + secs
}
```

Validation in CardioSetEntrySheet: total seconds must be > 0. Duration = 0 when both fields are "0" or empty.

### formatDuration Implementation

```typescript
export function formatDuration(durationS: number): string {
  const totalSecs = Math.max(0, Math.round(durationS))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}
```

For accessibility verbose form:
```typescript
export function formatDurationAccessibility(durationS: number): string {
  const totalSecs = Math.max(0, Math.round(durationS))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins === 0) return `${secs} second${secs !== 1 ? 's' : ''}`
  if (secs === 0) return `${mins} minute${mins !== 1 ? 's' : ''}`
  return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`
}
```

### Pace Calculation — Guard Against Zero Distance

Only calculate pace when `distanceM > 0`:

```typescript
// Only show pace when both duration > 0 AND distance > 0
const paceSecPerKm = (durationS > 0 && distanceM > 0)
  ? calculatePaceSecPerKm(durationS, distanceM)
  : null
```

`formatPace` for min/mi: multiply sec/km by 1.60934 (km per mile factor).

### getPrefillForExercise — Return Type Change is Non-Breaking

The existing `SetEntrySheet.tsx` calls `getPrefillForExercise` and only reads `prefill.weightKg`, `prefill.reps`, `prefill.label`. Adding `durationS` and `distanceM` to the return type is purely additive — `SetEntrySheet` ignores the new fields. No changes needed to `SetEntrySheet.tsx`.

### Architecture Boundary — MUST Follow

```
sets.queries.ts → useSets.ts → CardioSetEntrySheet.tsx
ghost.queries.ts → (accessed through useSets.ts getPrefillForExercise)
```

`CardioSetEntrySheet` NEVER imports from `/src/db/queries/` directly. All DB calls go through `useSetActions()`.

### DB Storage — No Conversions at Storage Layer

`logCardioSet` receives duration in seconds and distance in meters — these are the canonical units. The `CardioSetEntrySheet` is responsible for:
1. Converting the user's displayed distance (km or mi) to meters using `convertDistanceToMeters(value, unit)` before calling `logCardioSet`
2. Passing total seconds from `parseDurationToSeconds(minutesText, secondsText)`

The hook never reads `unit` for cardio (unlike strength where it reads unit to convert lb→kg). The component handles the conversion before calling the hook.

### Expo SDK Version

AGENTS.md says "read v56 docs" but `package.json` shows `"expo": "~54.0.0"`. Read actual versioned docs at **https://docs.expo.dev/versions/v54.0.0/**. This was confirmed in Story 1.4 dev notes. Modal, TextInput, AccessibilityInfo APIs are stable across 54→56.

### SetRow.tsx RowContent Props Update

Current `RowContent` interface:
```typescript
interface RowContentProps {
  setNumber: number
  formattedWeight: string
  reps: number | null
}
```

New `RowContent` interface (extend, don't replace):
```typescript
interface RowContentProps {
  setNumber: number
  set: DbSet
  unit: 'kg' | 'lb'
}
```

Update the two `<RowContent>` call sites in `SetRow` (locked and unlocked branches) to pass `set` and `unit` instead of pre-formatted strings. Compute formatting inside `RowContent`.

### Summary Screen — Cardio Exercise Detection

```typescript
const getExerciseSummary = (exerciseId: string): string => {
  const exerciseSets = allSets.filter((s) => s.exercise_id === exerciseId)
  if (exerciseSets.length === 0) return '0 sets'
  
  const isCardio = exerciseSets.some((s) => s.duration_s !== null && s.weight_kg === null)
  
  if (isCardio) {
    const totalS = exerciseSets.reduce((sum, s) => sum + (s.duration_s ?? 0), 0)
    const totalM = exerciseSets.reduce((sum, s) => sum + (s.distance_m ?? 0), 0)
    const durationStr = formatDuration(totalS)
    const hasDistance = exerciseSets.some((s) => s.distance_m !== null)
    const distanceStr = hasDistance ? formatDistanceDisplay(totalM, unit) : null
    const label = `${exerciseSets.length} ${exerciseSets.length === 1 ? 'set' : 'sets'} · ${durationStr} total${distanceStr ? ' · ' + distanceStr : ''}`
    return label
  }
  
  // Strength path — unchanged
  const volumeKg = exerciseSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
  const volumeDisplay = formatWeight(volumeKg, unit)
  return `${exerciseSets.length} ${exerciseSets.length === 1 ? 'set' : 'sets'} · ${volumeDisplay} total volume`
}
```

### Drizzle useLiveQuery Import Path

Always use:
```typescript
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query'  // ✅
```

No live query needed for `CardioSetEntrySheet` — pre-fill is a one-shot async call on open.

### Testing Pattern — Mocked (expo-sqlite Cannot Run in Jest)

Follow existing mock pattern from `sets.queries.test.ts`:
```typescript
jest.mock('../../client', () => ({ db: { transaction: jest.fn(), insert: jest.fn(), ... } }))
jest.mock('../../schema', () => ({ sets: {} }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn(), and: jest.fn(), asc: jest.fn(), ... }))
```

### Project Structure Notes

All files follow established patterns:
- Component: `CardioSetEntrySheet.tsx` in `/src/components/session/` — PascalCase ✅
- Mapper: `cardio.mapper.ts` in `/src/db/mappers/` — follows `set.mapper.ts` pattern ✅
- No new hooks, stores, or query files needed beyond what's listed above

### Files That Must NOT Be Recreated

Already exist (do NOT overwrite):
- `/src/db/schema.ts` ✅ (sets table already has `duration_s` and `distance_m` columns)
- `/src/db/client.ts` ✅
- `/src/db/queries/ghost.queries.ts` ✅ (already returns `duration_s` and `distance_m`)
- `/src/constants/index.ts` ✅ (all color tokens present)
- `/src/stores/useSessionStore.ts` ✅
- `/src/stores/useSettingsStore.ts` ✅ (has `unit: 'kg' | 'lb'`)
- `/src/lib/toast.ts` ✅
- `/src/db/mappers/set.mapper.ts` ✅ (formatWeight, convertToKg — do NOT add cardio functions here; use new cardio.mapper.ts)
- `/src/components/session/SetEntrySheet.tsx` ✅ — strength-only, DO NOT modify
- All other files from Stories 1.1–1.4 ✅

### Design Tokens — Cardio Set Logging UI

Same tokens as strength, plus:
- Duration display: `display` style — DMSans 800, 40sp, `ink-primary`
- Separator ":": `display` style, `ink-secondary` (#8888a0), smaller (24sp)
- Distance display: `display` style, `ink-primary` (same as duration)
- Pace preview (live, in form): `body` style, `ghost-dim` (rgba(0,229,255,0.40)) — faint cyan
- Pace in Set Row: `body` style, `ink-secondary` — secondary line below duration/distance
- Field labels "Min", "Sec", distance unit: `fieldLabel` style — DMSans 500, 13sp, `ink-secondary`

### Summary of New/Updated Files

```
src/
  db/
    mappers/
      cardio.mapper.ts           NEW — parseDurationToSeconds, formatDuration, formatDistanceDisplay,
                                        convertDistanceToMeters, calculatePaceSecPerKm, formatPace,
                                        formatDurationAccessibility, formatDistanceAccessibility
    queries/
      sets.queries.ts            UPDATE — add logCardioSet()
      sets.queries.test.ts       UPDATE — add cardio test coverage
  hooks/
    useSets.ts                   UPDATE — add logCardioSet action; extend getPrefillForExercise return type
  components/
    session/
      CardioSetEntrySheet.tsx    NEW — bottom sheet for cardio sets
      SetRow.tsx                 UPDATE — cardio display branch + updated RowContent props
  app/
    session/
      active.tsx                 UPDATE — route to CardioSetEntrySheet for cardio exercises
      summary.tsx                UPDATE — cardio exercise summary (duration + distance instead of volume)
```

### References

- [Source: epics.md#Story 1.5] — All 5 acceptance criteria, FR-6 coverage
- [Source: epics.md#FR-6] — "duration + optional distance, pace auto-calculation, Ghost comparison uses duration and/or distance"
- [Source: architecture.md#Data Architecture] — sets schema: `duration_s: integer`, `distance_m: real`, `weight_kg` null for cardio
- [Source: architecture.md#Enforcement Guidelines] — canonical storage (seconds, meters), mappers handle conversion, components never do unit math
- [Source: architecture.md#DB→Display Mapper Pattern] — cardio.mapper.ts follows same pattern as set.mapper.ts
- [Source: architecture.md#Naming Patterns] — PascalCase components, kebab-case mapper files
- [Source: EXPERIENCE.md#Cardio Ghost comparison] — "target pace as read-only reference at form top (Epic 3); post-Set delta as 'X seconds per km faster/slower'"
- [Source: story 1.4 Dev Notes#CRITICAL: No Gesture Library Installed] — `react-native-gesture-handler` NOT installed
- [Source: story 1.4 Dev Notes#Architecture Boundary] — components NEVER import from `/src/db/queries/`
- [Source: story 1.4 Dev Notes#Expo SDK Version Mismatch] — actual package is v54, read docs at v54
- [Source: story 1.4 Dev Notes#Drizzle useLiveQuery Import Path] — `drizzle-orm/expo-sqlite/query`
- [Source: story 1.4 Dev Notes#Testing Pattern] — mocked Jest, expo-sqlite cannot run in Jest
- [Source: NFR-11] — 44dp minimum touch targets

---

### Review Findings

- [x] [Review][Decision] `formatDistanceAccessibility` uses `.toFixed(2)` — dismissed; spec example is illustrative ("e.g."), decimal format is more precise for non-round distances. [cardio.mapper.ts:53-56]

- [x] [Review][Patch] `formatDuration` import shadowed by local function in `summary.tsx` — renamed local to `formatSessionDuration`; `getExerciseSummary` now correctly calls the mapper [summary.tsx:48]
- [x] [Review][Patch] Pre-fill `setSecondsText` missing `padStart(2,'0')` — fixed: seconds now pre-fills as "05" not "5" [CardioSetEntrySheet.tsx:94]
- [x] [Review][Patch] `paceText` style missing `fontFamily` — false positive; `fontFamily: 'DMSans_400Regular'` was already present in SetRow.tsx [SetRow.tsx]
- [x] [Review][Patch] `handleDismiss` does not reset `inFlight` — fixed: added `setInFlight(false)` to handleDismiss [CardioSetEntrySheet.tsx:128]

- [x] [Review][Defer] `'kg' | 'lb'` unit type used for distance functions — semantic mismatch, works at runtime, pre-existing SettingsStore design [cardio.mapper.ts] — deferred, pre-existing type convention
- [x] [Review][Defer] `getPrefillForExercise` returns `durationS: null` for strength sets, skipping ghost path — cannot occur due to type routing in active.tsx [useSets.ts:120] — deferred, unreachable in normal flow
- [x] [Review][Defer] Dead try/catch stub in `logCardioSet` — pre-existing pattern from `logStrengthSet`, Epic 3 wires detectPr here [sets.queries.ts:53] — deferred, pre-existing
- [x] [Review][Defer] `formatDurationAccessibility` has no hour handling — 3600s renders "60 minutes" not "1 hour" [cardio.mapper.ts:41] — deferred, not specified in AC5
- [x] [Review][Defer] `distanceM` guard logic duplicated in CardioSetEntrySheet (preview and handleLogSet) — latent divergence risk if one updated without the other [CardioSetEntrySheet.tsx:70,114] — deferred, minor

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — no blocking errors encountered during implementation.

### Completion Notes List

- Duration input implemented as two separate TextInput fields (Min + Sec) because `react-native-masked-text` is not installed in this project.
- Unit setting ('kg'/'lb') drives both weight and distance display: 'kg' → km, 'lb' → miles. No separate distance-unit setting was needed.
- Cardio set detection in SetRow uses `set.duration_s !== null && set.weight_kg === null` instead of `exercise.type` because SetRow only receives `DbSet`.
- `getPrefillForExercise` return type extension (adding `durationS`/`distanceM`) is non-breaking — `SetEntrySheet` ignores the new fields.
- Pre-existing TypeScript errors in `sets.queries.test.ts` (mock type casting) were present before this story and are not regressions.
- All 82 tests pass across 8 test suites with 0 regressions.

### File List

**New files:**
- `GhostRival/src/db/mappers/cardio.mapper.ts`
- `GhostRival/src/db/mappers/cardio.mapper.test.ts`
- `GhostRival/src/components/session/CardioSetEntrySheet.tsx`

**Updated files:**
- `GhostRival/src/db/queries/sets.queries.ts` — added `logCardioSet()`
- `GhostRival/src/db/queries/sets.queries.test.ts` — added 2 cardio test cases
- `GhostRival/src/hooks/useSets.ts` — added `logCardioSet` action; extended `getPrefillForExercise` return type
- `GhostRival/src/components/session/SetRow.tsx` — cardio display branch; updated `RowContent` props
- `GhostRival/src/app/session/active.tsx` — routes to `CardioSetEntrySheet` for cardio exercises
- `GhostRival/src/app/session/summary.tsx` — cardio exercise summary (duration + distance instead of volume)

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-06-20 | Created cardio display utilities mapper with 8 pure functions and 21 unit tests | `cardio.mapper.ts`, `cardio.mapper.test.ts` |
| 2026-06-20 | Added `logCardioSet` to sets.queries with DB transaction + PR stub; added 2 test cases | `sets.queries.ts`, `sets.queries.test.ts` |
| 2026-06-20 | Added `logCardioSet` hook action; extended `getPrefillForExercise` with `durationS`/`distanceM` | `useSets.ts` |
| 2026-06-20 | Created `CardioSetEntrySheet` bottom sheet component (Min+Sec duration fields, optional distance, live pace preview, pre-fill, validation) | `CardioSetEntrySheet.tsx` |
| 2026-06-20 | Updated `SetRow` to render cardio sets (duration/distance/pace) with updated accessibility labels | `SetRow.tsx` |
| 2026-06-20 | Updated `active.tsx` to route cardio exercises to `CardioSetEntrySheet` | `active.tsx` |
| 2026-06-20 | Updated `summary.tsx` to show cardio summary (total duration + optional total distance) | `summary.tsx` |
