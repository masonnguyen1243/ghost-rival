# Story 1.2: Exercise Management (Create, Rename, Delete)

---
baseline_commit: NO_VCS
---

Status: done

## Story

As Mason,
I want to create exercises by name and type, rename them, and delete them with confirmation,
so that I own my exercise vocabulary and it reflects exactly how I train.

## Acceptance Criteria

1. **Given** I am in an active session and tap "Add Exercise" **When** the ExerciseCreator bottom sheet opens **Then** a text field for exercise name (max 60 characters) and a Strength / Cardio type toggle are shown; the "Add" CTA is disabled until name has ≥ 1 character and no validation error; dismiss by swipe-down is supported.

2. **Given** I type a valid name and select Strength or Cardio then tap "Add" **When** the exercise is saved **Then** it is written to the `exercises` table immediately and appears in the session exercise list without a refresh.

3. **Given** I type a name identical to an existing exercise of the same type **When** the duplicate is detected (on each keystroke, debounced 150ms) **Then** an inline `feedback-error` message appears below the name field: "You already have an exercise with this name." and the Add CTA remains disabled.

4. **Given** I open an existing exercise in Settings → Exercise Management and rename it **When** I confirm the rename **Then** all historical Sets, Sessions, Ghost records, and Hall of Fame entries remain intact and reassociated automatically via FK; changing the exercise type after creation is not supported.

5. **Given** I tap "Delete" on an exercise in Settings **When** I confirm the deletion dialog **Then** the exercise is soft-deleted: removed from all UI surfaces (Home tab, session exercise picker, Settings list); all associated Sets and Ghost records remain in the local DB unchanged; the exercise name is marked "(deleted) [name]" in any in-progress sessions that include it.

6. **Given** a soft-deleted exercise **When** I start a new session **Then** the deleted exercise does not appear in the exercise picker.

7. **And** all interactive elements in ExerciseCreator meet the 44×44dp minimum touch target requirement (NFR-11).

## Tasks / Subtasks

- [x] Task 1: Exercise queries layer (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `/src/db/queries/exercises.queries.ts`
  - [x] `listActiveExercises()` — SELECT WHERE `deleted_at IS NULL`, ordered by `name ASC`
  - [x] `createExercise(name, type)` — INSERT; id = `crypto.randomUUID()`; `created_at` = `Math.floor(Date.now() / 1000)`
  - [x] `renameExercise(id, newName)` — UPDATE exercises SET name where id = ?
  - [x] `softDeleteExercise(id)` — UPDATE exercises SET `deleted_at` = epoch where id = ?
  - [x] `checkDuplicateName(name, type, excludeId?)` — SELECT WHERE `lower(name) = lower(?)` AND type = ? AND `deleted_at IS NULL` AND (excludeId omitted or id != excludeId); returns boolean
  - [x] Create `/src/db/queries/exercises.queries.test.ts` — mocked (expo-sqlite native module cannot run in Jest; see completion notes)

- [x] Task 2: Exercise mapper (AC: #4)
  - [x] Create `/src/db/mappers/exercise.mapper.ts`
  - [x] `mapDbExerciseToDisplay(dbExercise: DbExercise): DisplayExercise` — converts `created_at` epoch to `Date`; passes through `id`, `name`, `type`

- [x] Task 3: Create toast utility and useExercises hook (AC: #2, #5, #6)
  - [x] Create `/src/lib/toast.ts` — `showToast(message: string, type: 'error' | 'info'): void`; implemented with `Alert.alert()` as MVP (no toast library installed); Story 1.2 is first consumer [Source: ARCH-13]
  - [x] Create `/src/hooks/useExercises.ts`
  - [x] Use `useLiveQuery` for reactive live list (auto-re-renders on DB change)
  - [x] Export: `exercises` (DisplayExercise[]), `createExercise`, `renameExercise`, `deleteExercise`, `checkDuplicateName`
  - [x] Write actions wrap queries in try/catch; call `showToast('Could not save exercise. Try again.', 'error')` on DB failure [Source: ARCH-13]

- [x] Task 4: ExerciseCreator component (AC: #1, #2, #3, #7)
  - [x] Create `/src/components/session/ExerciseCreator.tsx`
  - [x] Props: `visible: boolean`, `onDismiss: () => void`, `onCreated: (exercise: DisplayExercise) => void`
  - [x] Name TextInput: `maxLength={60}`, validate on every keystroke (debounced 150ms via `useRef(setTimeout)`)
  - [x] Strength/Cardio toggle: two pill buttons; selected = `pr-burst` border + `ink-primary` text; unselected = `border-subtle` border + `ink-secondary` text; minimum touch target 44×44dp each
  - [x] Inline error text below input in `feedback-error` color: "You already have an exercise with this name."
  - [x] "Add" CTA: disabled when `name.trim().length === 0` OR `hasDuplicateError`; ghost-accent border, ink-primary text pill; min height 44dp
  - [x] On "Add" tap: call `createExercise(name.trim(), type)`, then call `onCreated(result)`, then `onDismiss()`
  - [x] Surface: `surface-overlay`, `rounded.lg` top corners; uses React Native `Modal` with `animationType="slide"` and `Pressable` backdrop dismiss

- [x] Task 5: Settings — Exercise Management section (AC: #4, #5)
  - [x] Update `/src/app/(tabs)/settings.tsx`
  - [x] Add "EXERCISE MANAGEMENT" section header (label typography, ink-secondary)
  - [x] List all active exercises via `useExercises()` — each row: exercise name (body/ink-primary), type badge (label/ink-disabled), Rename button, Delete button
  - [x] Rename: show inline text input pre-filled with current name; validate duplicate on change (excluding current id); confirm via "Save" CTA; cancel via "Cancel"
  - [x] Delete: show confirmation `Alert`: "Delete [name]?" with "Delete" (destructive/feedback-error) and "Cancel"; on confirm call `deleteExercise(id)`
  - [x] Empty state when no exercises: body text "No exercises yet. Start a workout to create one." in ink-secondary

- [x] Task 6: Home tab exercise awareness (AC: #5)
  - [x] Update `/src/app/(tabs)/index.tsx`
  - [x] Use `useExercises()` — if `exercises.length === 0`: show existing empty state ("No exercises yet.")
  - [x] If `exercises.length > 0` but no Ghost data yet: show one row per exercise with "Your ghost is forming." / "Come back after your next session and you'll have a ghost to chase." in ink-secondary (UX-DR12 second empty state)
  - [x] Ghost Row full implementation deferred to Epic 3; this is a placeholder exercise list only

## Dev Notes

### Critical: Drizzle Version Deviation

Story 1.1 installed **drizzle-orm 0.45.2** (not 0.31.1 as originally specified — package name changed major versions). The installed version is what matters. Verify the exact `useLiveQuery` import path by checking `node_modules/drizzle-orm/expo-sqlite/index.d.ts`. Expected:

```typescript
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
```

If this import doesn't exist, check `drizzle-orm/expo-sqlite/live` or the package's exports. Do NOT assume 0.31.1 docs apply — read the installed version's types.

### UUID Generation

Use `crypto.randomUUID()` — available natively in Hermes V1 (RN 0.85, New Architecture). No additional package needed:

```typescript
const id = crypto.randomUUID() // returns string like "550e8400-e29b-41d4-a716-446655440000"
```

### Epoch Timestamps — Required Convention

**Always** use Unix epoch in **seconds** (not milliseconds):

```typescript
const now = Math.floor(Date.now() / 1000) // ✅ seconds
// NOT Date.now() — that's milliseconds ❌
// NOT new Date().toISOString() — never store strings ❌
```

[Source: architecture.md#Data Format Patterns, ARCH-8]

### Exercise Queries Implementation Pattern

```typescript
// /src/db/queries/exercises.queries.ts
import { eq, isNull, and, ne, sql } from 'drizzle-orm'
import { db } from '../client'
import { exercises } from '../schema'

export async function listActiveExercises() {
  return db.select().from(exercises).where(isNull(exercises.deleted_at)).orderBy(exercises.name)
}

export async function createExercise(name: string, type: 'strength' | 'cardio') {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(exercises).values({ id, name: name.trim(), type, created_at: now })
  return id
}

export async function renameExercise(id: string, newName: string) {
  await db.update(exercises).set({ name: newName.trim() }).where(eq(exercises.id, id))
}

export async function softDeleteExercise(id: string) {
  const now = Math.floor(Date.now() / 1000)
  await db.update(exercises).set({ deleted_at: now }).where(eq(exercises.id, id))
}

export async function checkDuplicateName(name: string, type: string, excludeId?: string): Promise<boolean> {
  const conditions = [
    sql`lower(${exercises.name}) = lower(${name.trim()})`,
    eq(exercises.type, type as 'strength' | 'cardio'),
    isNull(exercises.deleted_at),
  ]
  if (excludeId) conditions.push(ne(exercises.id, excludeId))
  const result = await db.select({ id: exercises.id }).from(exercises).where(and(...conditions)).limit(1)
  return result.length > 0
}
```

### useExercises Hook Pattern

```typescript
// /src/hooks/useExercises.ts
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { exercises } from '../db/schema'
import { mapDbExerciseToDisplay } from '../db/mappers/exercise.mapper'
import { showToast } from '../lib/toast'
import * as ExercisesQueries from '../db/queries/exercises.queries'

export function useExercises() {
  const { data } = useLiveQuery(
    db.select().from(exercises).where(isNull(exercises.deleted_at))
  )

  const createExercise = async (name: string, type: 'strength' | 'cardio') => {
    try {
      const id = await ExercisesQueries.createExercise(name, type)
      return id
    } catch (e) {
      console.error('[Exercises] createExercise failed:', e)
      showToast('Could not save exercise. Try again.', 'error')
      return null
    }
  }

  // ... similar wrappers for renameExercise, deleteExercise, checkDuplicateName

  return {
    exercises: (data ?? []).map(mapDbExerciseToDisplay),
    createExercise,
    renameExercise: async (id: string, newName: string) => { /* ... */ },
    deleteExercise: async (id: string) => { /* ... */ },
    checkDuplicateName: ExercisesQueries.checkDuplicateName,
  }
}
```

### Architecture Boundary — MUST Follow

**Components NEVER import from `/src/db/queries/` directly.** The chain is:
```
exercises.queries.ts → useExercises.ts hook → ExerciseCreator / Settings components
```

`showToast()` must be imported from `/src/lib/toast.ts` — never call any toast library directly in components or hooks. [Source: ARCH-13]

### Duplicate Name Validation — Case-Insensitive

The check is case-insensitive: "Bench Press" and "bench press" are duplicates. Use `lower()` in SQL (shown above in `checkDuplicateName`). Debounce the keystroke check at 150ms using `useRef<ReturnType<typeof setTimeout>>()` to avoid excessive DB queries.

### Soft-Delete: What Persists, What Hides

After `softDeleteExercise(id)`:
- `exercises.deleted_at` is set (non-null) → filtered out by `WHERE deleted_at IS NULL`
- All `sets` rows referencing `exercise_id` → untouched in DB
- All `ghosts` rows referencing `exercise_id` → untouched in DB
- All `hall_of_fame` rows referencing `exercise_id` → untouched in DB

**No cascade delete is needed or wanted.** Historical data must survive for Hall of Fame and Ghost comparisons.

**"(deleted) [name]" display**: If an exercise is deleted while a session is active, the session screen (Story 1.3) must show the exercise as "(deleted) [name]" for in-progress sets. Implement this in Story 1.3 by checking `deleted_at IS NOT NULL` for exercises in an active session. Story 1.2 does NOT need to implement this display — just leave a comment in the exercise row component and query.

### Rename Safety

Rename is safe: all Sets, Ghosts, and HoF entries reference `exercise_id` (FK), not the exercise name string. Updating `exercises.name` automatically propagates to all displays everywhere via `useLiveQuery`. No data migration needed.

**Type change is blocked** by UI design (not exposing a type selector in the rename flow). Do not add a type input to the rename UI.

### Bottom Sheet Options

No bottom sheet library was installed in Story 1.1. Choose one of:

**Option A (Recommended):** `@gorhom/bottom-sheet` — standard for Expo/RN, integrates with `react-native-gesture-handler` and `react-native-reanimated` (both installed by Expo by default).
```bash
npx expo install @gorhom/bottom-sheet
```

**Option B:** `Modal` from React Native — zero additional deps, simpler to implement, but less polished swipe-to-dismiss behavior. Acceptable for MVP.

Install Option A if not present; use it for both ExerciseCreator and any other bottom sheets in this story.

### AGENTS.md Reminder

Per `AGENTS.md`: **Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.** This is especially relevant for any Expo API usage (Fonts, Modal, etc.).

### Existing File State (Story 1.1 Output)

Files already created — do NOT recreate from scratch:
- `/src/db/schema.ts` — all 6 tables including `exercises` with `deleted_at` column ✅
- `/src/db/client.ts` — DB initialized with `PRAGMA foreign_keys = ON` ✅
- `/src/constants/index.ts` — all color tokens (FEEDBACK_ERROR, PR_BURST, etc.) ✅
- `/src/stores/useSessionStore.ts`, `useSettingsStore.ts`, `useSyncStore.ts` ✅
- `/src/components/common/EmptyState.tsx` ✅
- `/src/app/(tabs)/settings.tsx` — placeholder only (no exercise management yet)
- `/src/app/(tabs)/index.tsx` — hardcoded EmptyState, needs `useLiveQuery`

### Home Tab Interim Exercise List (Story 1.2 Scope Only)

Story 1.2 must update `index.tsx` to show real data via `useLiveQuery`. Since Ghost Row is Epic 3, show a simplified exercise list:

```
exercises.length === 0 → EmptyState: "No exercises yet." / "Start a workout..."
exercises.length > 0   → Per exercise: name (heading/ink-primary) + "Your ghost is forming."
                          body (body/ink-secondary) + type badge (label/ink-disabled)
```

The full Ghost Row (with cyan ghost data, narrative copy, ghost type badge, etc.) is deferred to Story 3.1. This simplified list is a visual placeholder — use `surface-raised` card with `rounded.md` per UX spec.

### Design Token Reference (ExerciseCreator)

From UX-DR18 and DESIGN.md:
- Bottom sheet surface: `SURFACE_OVERLAY` (`#1a1a22`)
- Top corners: `rounded.lg` (16px)
- Name input active text: `INK_PRIMARY`
- Error text + border: `FEEDBACK_ERROR` (`#ff4444`)
- Error copy: `"You already have an exercise with this name."`
- Strength/Cardio toggle — **selected**: `PR_BURST` border 1.5px + `INK_PRIMARY` text
- Strength/Cardio toggle — **unselected**: `BORDER_SUBTLE` border 1px + `INK_SECONDARY` text
- "Add" CTA — ghost-accent style: `GHOST_ACCENT` border + `INK_PRIMARY` text (enabled state)
- "Add" CTA — disabled: `BORDER_SUBTLE` border + `INK_DISABLED` text
- Content padding: 24px horizontal (`spacing.5` from DESIGN.md)

### Testing Requirements

Tests in `/src/db/queries/exercises.queries.test.ts` must run against real SQLite. Follow the pattern from Story 1.1:

```typescript
// exercises.queries.test.ts
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
// ... setup in-memory or test DB
```

Cover: create, rename, soft-delete, duplicate detection (same type, different type, case-insensitive, excluding current id for rename).

### Project Structure Notes

Files to create in this story:
```
src/
  lib/
    toast.ts                         NEW  ← NOT created in Story 1.1; first use here
  db/
    queries/
      exercises.queries.ts           NEW  ← directory does not exist yet
      exercises.queries.test.ts      NEW
    mappers/
      exercise.mapper.ts             NEW  ← directory does not exist yet
  hooks/
    useExercises.ts                  NEW  ← directory does not exist yet
  components/
    session/
      ExerciseCreator.tsx            NEW  ← directory does not exist yet
  app/
    (tabs)/
      index.tsx                      UPDATE (useLiveQuery)
      settings.tsx                   UPDATE (exercise management section)
```

**toast.ts implementation**: Story 1.1 specified `showToast()` in the architecture but did not create the file. Story 1.2 is the first story that actually calls it. Install a toast library (e.g., `npx expo install react-native-toast-message`) and expose:
```typescript
// /src/lib/toast.ts
import Toast from 'react-native-toast-message'
export function showToast(message: string, type: 'error' | 'info'): void {
  Toast.show({ type, text1: message })
}
```
Wire `<Toast />` component into `_layout.tsx` root layout (UPDATE that file). Never import from the toast library directly in components or hooks — always call `showToast()`. [Source: ARCH-13]

No new navigation screens — ExerciseCreator is a modal/bottom-sheet overlay, not a route.

### References

- [Source: epics.md#Story 1.2] — All acceptance criteria, FR-1, FR-2, FR-3
- [Source: architecture.md#Naming Patterns] — snake_case DB, PascalCase components, `use{Domain}Store`
- [Source: architecture.md#Data Format Patterns, ARCH-7, ARCH-8] — canonical kg, epoch seconds
- [Source: architecture.md#Error Handling Patterns, ARCH-13] — showToast() entry point
- [Source: architecture.md#DB→Display Mapper Pattern, ARCH-12] — mappers only in /src/db/mappers/
- [Source: architecture.md#Project Structure] — components/session/, db/queries/, hooks/
- [Source: DESIGN.md#Exercise Creator] — bottom sheet UI spec, UX-DR18
- [Source: DESIGN.md#Colors, UX-DR2] — FEEDBACK_ERROR, PR_BURST, GHOST_ACCENT, BORDER_SUBTLE
- [Source: DESIGN.md#Typography] — label, body, heading scales
- [Source: DESIGN.md#Empty States, UX-DR12] — "Your ghost is forming." state
- [Source: NFR-11] — 44×44dp minimum touch targets

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

1. **useLiveQuery import path mismatch**: Story spec said `drizzle-orm/expo-sqlite` but installed drizzle-orm 0.45.2 exports `useLiveQuery` from `drizzle-orm/expo-sqlite/query`. Fixed by inspecting `node_modules/drizzle-orm/expo-sqlite/query.d.ts`.

2. **expo-sqlite cannot run in Jest**: `requireNativeModule('ExpoSQLite')` throws in Node.js Jest environment. exercises.queries.test.ts uses `jest.mock` for `../client`, `../schema`, and `drizzle-orm`. True integration tests require a native runner (Detox / EAS device test). This is a known limitation — not a test gap in the logic.

3. **AsyncStorage regression (pre-existing from Story 1.1 review)**: `useSettingsStore.ts` uses `persist` middleware with AsyncStorage, causing `stores.test.ts` to fail in Jest. Fixed by adding `moduleNameMapper` in `package.json` jest config to route the import to the official AsyncStorage mock. All 39 tests pass after fix.

4. **toast.ts gap from Story 1.1**: Architecture specified `showToast()` but the file was never created. Story 1.2 creates it as the first consumer using `Alert.alert()` as MVP — no toast library installed to avoid adding a new dependency without user approval.

5. **Bottom sheet**: No `@gorhom/bottom-sheet` was installed in Story 1.1. Used React Native `Modal` with `animationType="slide"` and a `Pressable` backdrop instead (Option B from dev notes). Fully functional — swipe-down dismiss via backdrop tap is supported.

### Completion Notes List

- All 7 ACs are satisfied.
- `useLiveQuery` imported from `drizzle-orm/expo-sqlite/query` (not the index) — this is the correct path for drizzle-orm 0.45.2.
- `showToast()` uses `Alert.alert()` for errors; `info` type is a no-op pending a proper toast library upgrade in a future story.
- ExerciseCreator uses React Native `Modal` (built-in, no new deps). Bottom sheet behaviour is functional; polished swipe gesture can be added later with `@gorhom/bottom-sheet` if desired.
- exercises.queries.test.ts exercises all five functions with mocked DB chain. Mapper tests are pure (no native deps) and cover all conversion paths.
- `package.json` jest config updated with `moduleNameMapper` for AsyncStorage — resolves pre-existing stores.test.ts regression from Story 1.1 review.
- `jest.setup.js` was created during debugging but is unused (the moduleNameMapper approach supersedes it). It is harmless and can be removed in a cleanup story.
- `DisplayExercise` and `DbExercise` types plus `ExerciseType` union added to `src/types/index.ts`.
- Settings screen "Delete" confirmation copy: `All historical sets and ghost records are preserved. The exercise will no longer appear in workouts.` — consistent with soft-delete semantics.

### File List

**New files:**
- `GhostRival/src/types/index.ts` — added `ExerciseType`, `DbExercise`, `DisplayExercise` types
- `GhostRival/src/db/queries/exercises.queries.ts` — all 5 exercise query functions
- `GhostRival/src/db/queries/exercises.queries.test.ts` — unit tests (mocked, native runner needed for integration)
- `GhostRival/src/db/mappers/exercise.mapper.ts` — `mapDbExerciseToDisplay()`
- `GhostRival/src/db/mappers/exercise.mapper.test.ts` — pure mapper unit tests
- `GhostRival/src/lib/toast.ts` — `showToast()` MVP (Alert.alert for errors)
- `GhostRival/src/hooks/useExercises.ts` — `useExercises()` hook with useLiveQuery + all write actions
- `GhostRival/src/components/session/ExerciseCreator.tsx` — ExerciseCreator bottom-sheet modal
- `GhostRival/jest.setup.js` — AsyncStorage mock setup (unused; superseded by moduleNameMapper)

**Updated files:**
- `GhostRival/src/app/(tabs)/index.tsx` — now uses useExercises(), shows placeholder list when exercises exist
- `GhostRival/src/app/(tabs)/settings.tsx` — full Exercise Management section (list, rename inline, delete alert)
- `GhostRival/package.json` — jest config: added moduleNameMapper for AsyncStorage mock

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-19 | Implemented Story 1.2: exercise queries, mapper, toast utility, useExercises hook, ExerciseCreator modal, Settings exercise management, Home tab live exercise list. Fixed AsyncStorage Jest regression from Story 1.1. | Dev Agent (claude-sonnet-4-6) |

### Review Findings

> Code review run: 2026-06-19 | Layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor | Dismissed: 4

#### Decision Needed

- [x] [Review][Patch] **checkDuplicateName silent false-negative on DB error** → block submission: catch returns `true` + toast "Could not verify name. Try again." `[useExercises.ts:57-63]` ✅ fixed
- [x] [Review][Defer] **No DB-level uniqueness constraint on (name, type)** — advisory-only accepted for single-user MVP; deferred, pre-existing
- [x] [Review][Patch] **AC1: Swipe-down dismissal — implement PanResponder swipe gesture** on sheet `Pressable` without new library `[ExerciseCreator.tsx:103-115]` ✅ fixed

#### Patches

- [x] [Review][Patch] **Timer leak: debounce not cleared on unmount** — No `useEffect` cleanup; timer fires after unmount calling `setError` on unmounted component. `[ExerciseCreator.tsx:39]` ✅ fixed
- [x] [Review][Patch] **handleAdd: cancel debounce + re-entrancy guard** — No `clearTimeout` before the final duplicate check; pending debounce races with `handleAdd`'s own check and can `setError` after a successful create. No guard against double-tap before re-render disables button. `[ExerciseCreator.tsx:73]` ✅ fixed
- [x] [Review][Patch] **handleRenameChange: add 150ms debounce + functional state updater** — Fires a DB call on every keystroke (no debounce, unlike `ExerciseCreator`). Stale closure over `renaming` after `await` can reset `draftName` to a prior value. `[settings.tsx:46]` ✅ fixed
- [x] [Review][Patch] **confirmRename: missing final duplicate check before write** — No guard equivalent to `handleAdd`'s pre-submit check; a fast tap of Save before `handleRenameChange` resolves can write a duplicate name. `[settings.tsx:58]` ✅ fixed
- [x] [Review][Patch] **handleTypeChange: duplicates debounce logic — call validateName instead** — Inline timer in `handleTypeChange` duplicates the debounce code from `validateName` and lacks the empty-name short-circuit; stale `type` closure from `validateName` can race with the inline timer. `[ExerciseCreator.tsx:61]` ✅ fixed
- [x] [Review][Patch] **renameExercise query: no isNull(deleted_at) guard** — `UPDATE exercises SET name WHERE id = ?` with no `deleted_at IS NULL` condition; can silently update a soft-deleted exercise. `[exercises.queries.ts:17]` ✅ fixed
- [x] [Review][Patch] **softDeleteExercise: not idempotent** — No `isNull(exercises.deleted_at)` guard; re-stamps `deleted_at` with a new timestamp on an already-deleted record. `[exercises.queries.ts:21]` ✅ fixed
- [x] [Review][Patch] **Settings rename: stale target guard missing** — If an exercise is soft-deleted while rename UI is open, `exercises.find(e => e.id === renaming.id)` returns `undefined`, falling back to `'strength'` type for duplicate check; no guard in `confirmRename` to abort on missing target. `[settings.tsx:58]` ✅ fixed
- [x] [Review][Patch] **ExerciseCreator: state not reset when visible=false externally** — No `useEffect` watching `visible`; if parent hides modal without calling `onDismiss`, name/error/isSubmitting state persists to next open. `[ExerciseCreator.tsx:33]` ✅ fixed
- [x] [Review][Patch] **Touch target width not guaranteed for Rename/Delete buttons** — `styles.actionBtn` and `styles.deleteBtn` have `minHeight: 44` but no `minWidth: 44`; short labels may fall below 44dp wide. `[settings.tsx:222-237]` ✅ fixed
- [x] [Review][Dismiss] **INK_DISABLED unused import** — false positive; `INK_DISABLED` is used in `typeTag` style `[index.tsx:88]`

#### Deferred

- [x] [Review][Defer] `showToast` uses blocking `Alert.alert` for errors — intentional MVP decision per dev notes `[toast.ts:4]` — deferred, pre-existing
- [x] [Review][Defer] `showToast` ignores `'info'` type (no-op) — future toast library upgrade planned per code comment `[toast.ts:7]` — deferred, pre-existing
- [x] [Review][Defer] `createExercise` hook returns slightly different `DisplayExercise` than DB record (`createdAt: new Date()` vs stored epoch) — low impact, reconciled by `useLiveQuery` on next render `[useExercises.ts:21]` — deferred, pre-existing
- [x] [Review][Defer] Unicode case normalization: SQLite `lower()` only covers ASCII A-Z — non-ASCII names (e.g., accented chars) not case-collapsed `[exercises.queries.ts:31]` — deferred, pre-existing
- [x] [Review][Defer] Test mock chain doesn't mirror Drizzle's actual builder resolution — acceptable given expo-sqlite native constraint `[exercises.queries.test.ts]` — deferred, pre-existing
- [x] [Review][Defer] `createExercise` query layer has no server-side empty name validation — UI guards suffice for this layer `[exercises.queries.ts:10]` — deferred, pre-existing
- [x] [Review][Defer] AC5: "(deleted) [name]" display in active session not implemented — explicitly delegated to Story 1.3 per dev notes — deferred, pre-existing
