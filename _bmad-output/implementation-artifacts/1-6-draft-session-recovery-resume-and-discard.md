---
baseline_commit: 1ec9852
---

# Story 1.6: Draft Session Recovery (Resume & Discard)

Status: done

## Story

As Mason,
I want my session saved automatically on every Set confirmation so I never lose logged data if the app crashes,
So that a force-close is a minor inconvenience, not a data loss event.

## Acceptance Criteria

**AC1** — **Given** I am mid-session and the app is force-closed **When** I reopen the app **Then** the Draft Resume Prompt modal appears before the Home tab is interactable; it reads the `sessions` table for rows where `ended_at IS NULL AND is_draft = true`; Zustand state (useSessionStore) is NOT consulted for recovery — it is gone after app kill and must be treated as blank.

**AC2** — **Given** the draft session's `started_at` is less than 2 hours ago **When** the Draft Resume Prompt appears **Then** "Resume" is the primary CTA (ghost-accent border, outlined pill style); "Start Fresh" is a secondary text button (ink-secondary); "Start Fresh" requires a second confirmation modal: "Discard this session?" with "Discard" (feedback-error label) and "Keep Draft" (ink-secondary) options.

**AC3** — **Given** I tap "Resume" **When** the session reopens **Then** all previously logged Sets are present and displayed in the session screen (`useLiveSetsByExercise` queries DB by sessionId); exercise list is rebuilt from distinct exercise IDs in the draft's sets; Rest Timer does NOT restore to previous countdown — it is reset to the configured default (ephemeral state, not persisted).

**AC4** — **Given** I tap "Start Fresh" and confirm "Discard" in the second dialog **When** the draft is discarded **Then** the draft session row AND all its associated sets are deleted from the DB in a single transaction; useSessionStore is already reset (app kill); a new session can begin normally.

**AC5** — **Given** the draft session's `started_at` is 2 or more hours ago **When** the Draft Resume Prompt appears **Then** "Save as Complete" is promoted to the primary CTA (ghost-accent fill); "Resume" and "Start Fresh" remain as secondary options; selecting "Save as Complete" updates the session: `ended_at = Math.floor(Date.now() / 1000)` and `is_draft = false`; the app returns to the Home tab (no session summary shown); Gym Streak logic in Epic 4 will credit the week using `started_at` (no action needed in this story); retroactive PR detection is DEFERRED to Epic 3.

**AC6** — **Given** the unit setting (kg/lb) changed between force-close and resume **When** the draft is resumed or finalized **Then** all Set weights automatically display in the new unit at render time — canonical kg values in the DB are unchanged; no special handling required (this is confirmed by existing formatWeight architecture).

---

## Tasks / Subtasks

- [x] Task 1: constants/index.ts — Add draft stale threshold (AC: #2, #5)
  - [x] Add `export const DRAFT_STALE_THRESHOLD_S = 7200` (2 hours in seconds) to `/src/constants/index.ts`

- [x] Task 2: sessions.queries.ts — Add recovery queries + fix discardSession (AC: #1, #4, #5)
  - [x] Add `import { and, isNull, asc } from 'drizzle-orm'` to existing imports (`eq`, `sql` already present)
  - [x] Add `getDraftSession(): Promise<{ id: string; started_at: number } | null>`:
    ```typescript
    export async function getDraftSession(): Promise<{ id: string; started_at: number } | null> {
      const result = await db
        .select({ id: sessions.id, started_at: sessions.started_at })
        .from(sessions)
        .where(and(isNull(sessions.ended_at), eq(sessions.is_draft, true)))
        .limit(1)
      return result[0] ?? null
    }
    ```
  - [x] Add `getExerciseIdsForSession(sessionId: string): Promise<string[]>`:
    ```typescript
    export async function getExerciseIdsForSession(sessionId: string): Promise<string[]> {
      const rows = await db
        .select({ exerciseId: sets.exercise_id, loggedAt: sets.logged_at })
        .from(sets)
        .where(eq(sets.session_id, sessionId))
        .orderBy(asc(sets.logged_at))
      const seen = new Set<string>()
      const result: string[] = []
      for (const row of rows) {
        if (!seen.has(row.exerciseId)) {
          seen.add(row.exerciseId)
          result.push(row.exerciseId)
        }
      }
      return result
    }
    ```
  - [x] Add `saveSessionAsComplete(id: string): Promise<void>`:
    ```typescript
    export async function saveSessionAsComplete(id: string): Promise<void> {
      const now = Math.floor(Date.now() / 1000)
      await db.update(sessions).set({ ended_at: now, is_draft: false }).where(eq(sessions.id, id))
    }
    ```
  - [x] UPDATE `discardSession` to also delete sets in a transaction (backward-compatible — no-ops for 0-set sessions):
    ```typescript
    export async function discardSession(id: string): Promise<void> {
      await db.transaction(async (tx) => {
        await tx.delete(sets).where(eq(sets.session_id, id))
        await tx.delete(sessions).where(eq(sessions.id, id))
      })
    }
    ```
  - [x] `sets` is already imported from `'../schema'` in this file — confirm, do not add duplicate import

- [x] Task 3: useSessions.ts — Add recovery hook actions (AC: #1, #3, #4, #5)
  - [x] Add imports: `import * as SetsQueries from '../db/queries/sets.queries'` (already exists if needed)
  - [x] Add `checkAndGetDraftSession` action:
    ```typescript
    const checkAndGetDraftSession = useCallback(async (): Promise<{ id: string; started_at: number } | null> => {
      try {
        return await SessionsQueries.getDraftSession()
      } catch (e) {
        console.error('[Sessions] getDraftSession failed:', e)
        return null
      }
    }, [])
    ```
  - [x] Add `resumeDraftSession` action:
    ```typescript
    const resumeDraftSession = useCallback(async (draft: { id: string; started_at: number }): Promise<boolean> => {
      try {
        const exerciseIds = await SessionsQueries.getExerciseIdsForSession(draft.id)
        useSessionStore.setState({
          activeSessionId: draft.id,
          sessionStartedAt: draft.started_at,
          phase: 'active',
          sessionExerciseIds: exerciseIds,
          // restTimerSeconds and restTimerRunning intentionally NOT set — keep at default
        })
        return true
      } catch (e) {
        console.error('[Sessions] resumeDraftSession failed:', e)
        showToast('Could not resume session. Try again.', 'error')
        return false
      }
    }, [])
    ```
  - [x] Add `saveSessionAsComplete` action:
    ```typescript
    const saveSessionAsComplete = useCallback(async (sessionId: string): Promise<boolean> => {
      try {
        await SessionsQueries.saveSessionAsComplete(sessionId)
        // Store is already empty after app kill — no reset needed
        return true
      } catch (e) {
        console.error('[Sessions] saveSessionAsComplete failed:', e)
        showToast('Could not save session. Try again.', 'error')
        return false
      }
    }, [])
    ```
  - [x] Return all new actions from the hook: `{ ..., checkAndGetDraftSession, resumeDraftSession, saveSessionAsComplete }`
  - [x] NOTE: The existing `discardSession` in useSessions.ts reads `activeSessionId` from the store — this is WRONG for the draft recovery scenario where the store is empty. The modal will call `SessionsQueries.discardSession(draftId)` directly from `_layout.tsx`, bypassing the hook for the draft case. Do NOT modify the existing `discardSession` hook action.

- [x] Task 4: DraftResumeModal.tsx — New component (AC: #1, #2, #3, #4, #5)
  - [x] Create `/src/components/common/DraftResumeModal.tsx`
  - [ ] Props:
    ```typescript
    interface DraftResumeModalProps {
      draft: { id: string; started_at: number }
      onResume: () => void
      onStartFresh: () => void       // already confirmed by 2nd dialog inside this modal
      onSaveAsComplete: () => void
    }
    ```
  - [x] Compute `isStale` inside the component:
    ```typescript
    import { DRAFT_STALE_THRESHOLD_S } from '../../constants'
    const isStale = Math.floor(Date.now() / 1000) - draft.started_at >= DRAFT_STALE_THRESHOLD_S
    ```
  - [x] Use a native RN `Modal` with `animationType="slide"`, `transparent={true}` over `SURFACE_BASE` at 90% opacity backdrop
  - [x] Modal is always visible when rendered (parent controls mount/unmount); no `visible` prop needed
  - [x] Display heading: "Resume your session?" (ink-primary, DM Sans 700, 20sp)
  - [x] Display session duration info: format elapsed time from `started_at` to now in "X hours Y minutes ago" using `formatSessionAge(started_at)` (pure helper inside this file, no shared mapper needed — it's only used here)
  - [x] **When `!isStale`** (< 2h): "Resume" = primary CTA (ghost-accent border 1.5px, transparent fill, rounded-pill); "Start Fresh" = text button (ink-secondary, 16sp)
  - [x] **When `isStale`** (≥ 2h): "Save as Complete" = primary CTA (ghost-accent fill, ink-primary text, rounded-pill); "Resume" and "Start Fresh" = both secondary (ink-secondary text buttons, smaller)
  - [x] Second confirmation state for "Start Fresh" (`[showDiscard, setShowDiscard]` local state): when tapped, show an inline sub-modal or replace button row with: "Discard this session?" text (ink-primary), "Discard" (feedback-error text) and "Keep Draft" (ink-secondary text)
  - [x] All CTAs: minimum 44dp touch target (NFR-11)
  - [x] Accessibility: `accessibilityRole="button"` on all CTAs; modal container has `accessibilityViewIsModal={true}` on iOS
  - [x] No dismiss by tapping backdrop — user MUST make an explicit choice

- [x] Task 5: _layout.tsx — Integrate draft recovery (AC: #1, #2, #3, #4, #5)
  - [x] Add imports:
    ```typescript
    import { router } from 'expo-router'
    import { DraftResumeModal } from '../components/common/DraftResumeModal'
    import * as SessionsQueries from '../db/queries/sessions.queries'
    import { useSessionStore } from '../stores/useSessionStore'
    ```
  - [x] Add state for draft session detection:
    ```typescript
    const [draftSession, setDraftSession] = useState<{ id: string; started_at: number } | null | 'checking'>('checking')
    ```
  - [x] In the existing `useEffect` where `fontsLoaded && migrationsSuccess` — AFTER `SplashScreen.hideAsync()`, trigger the draft check:
    ```typescript
    useEffect(() => {
      if (fontsLoaded && migrationsSuccess) {
        SplashScreen.hideAsync()
        SessionsQueries.getDraftSession()
          .then(setDraftSession)
          .catch(() => setDraftSession(null))
      }
    }, [fontsLoaded, migrationsSuccess])
    ```
  - [x] Update null render guard to also block on `'checking'`:
    ```typescript
    if (!fontsLoaded || !migrationsSuccess || draftSession === 'checking') {
      return null
    }
    ```
  - [x] Add handlers:
    ```typescript
    const handleDraftResume = async () => {
      if (!draftSession || draftSession === 'checking') return
      const exerciseIds = await SessionsQueries.getExerciseIdsForSession(draftSession.id)
      useSessionStore.setState({
        activeSessionId: draftSession.id,
        sessionStartedAt: draftSession.started_at,
        phase: 'active',
        sessionExerciseIds: exerciseIds,
      })
      setDraftSession(null)
      router.push('/session/active')
    }

    const handleDraftStartFresh = async () => {
      if (!draftSession || draftSession === 'checking') return
      const id = draftSession.id
      setDraftSession(null) // Dismiss modal immediately
      await SessionsQueries.discardSession(id) // Deletes sets + session in transaction
    }

    const handleDraftSaveAsComplete = async () => {
      if (!draftSession || draftSession === 'checking') return
      const id = draftSession.id
      setDraftSession(null) // Dismiss modal immediately
      await SessionsQueries.saveSessionAsComplete(id)
      // Returns to Home tab (already there); Epic 3 handles retroactive PR detection
    }
    ```
  - [x] Update return to render DraftResumeModal alongside Stack:
    ```typescript
    return (
      <>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="session/active" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="session/summary" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        {draftSession && draftSession !== 'checking' && (
          <DraftResumeModal
            draft={draftSession}
            onResume={handleDraftResume}
            onStartFresh={handleDraftStartFresh}
            onSaveAsComplete={handleDraftSaveAsComplete}
          />
        )}
      </>
    )
    ```

- [x] Task 6: sessions.queries.test.ts — Update tests (AC: #1, #4, #5)
  - [x] Update the mock to add `transaction`, `limit`, `groupBy` and `isNull`/`and` from drizzle-orm:
    ```typescript
    // Add to jest.mock('../client', ...):
    transaction: jest.fn(async (fn: Function) => {
      const txMock = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      }
      return fn(txMock)
    }),
    limit: jest.fn().mockResolvedValue([]),
    ```
    ```typescript
    // Add to jest.mock('drizzle-orm', ...):
    and: jest.fn((...args) => ({ type: 'and', args })),
    isNull: jest.fn((col) => ({ type: 'isNull', col })),
    asc: jest.fn((col) => ({ type: 'asc', col })),
    ```
  - [x] Update `discardSession` test to verify transaction is used and both sets and session are deleted:
    ```typescript
    it('deletes sets then session in a transaction', async () => {
      await discardSession('session-id-1')
      expect(mockDb.transaction).toHaveBeenCalled()
      // Transaction callback deletes both sets and session
    })
    ```
  - [x] Add `getDraftSession` tests:
    - Returns null when no draft (empty result from DB)
    - Returns `{ id, started_at }` when a draft exists
  - [x] Add `saveSessionAsComplete` tests:
    - Calls update with `is_draft: false` and an epoch `ended_at` value
    - Uses epoch seconds (same pattern as `endSession` test)
  - [x] Add `getExerciseIdsForSession` tests:
    - Returns empty array when session has no sets
    - Returns exercise IDs in insertion order (by logged_at)
    - Deduplicates exercise IDs correctly

---

## Dev Notes

### CRITICAL: discardSession Now Uses a Transaction

The existing `discardSession` function only deleted the session row, which orphaned sets for draft sessions with logged data. This story UPDATES it to delete sets first, then the session, in a transaction. This is backward-compatible: for 0-set sessions (Story 1.3's "End Anyway" path), the sets delete is a no-op.

```typescript
// OLD (Story 1.3 pattern — DO NOT keep this):
await db.delete(sessions).where(eq(sessions.id, id))

// NEW (Story 1.6 — safe for both 0-set and N-set sessions):
await db.transaction(async (tx) => {
  await tx.delete(sets).where(eq(sets.session_id, id))
  await tx.delete(sessions).where(eq(sessions.id, id))
})
```

### CRITICAL: useSessions.discardSession Hook NOT Used for Draft Recovery

The existing `discardSession` in `useSessions.ts` reads `activeSessionId` from the Zustand store:
```typescript
const activeSessionId = useSessionStore.getState().activeSessionId
```

After a force-close, the Zustand store is EMPTY (gone after app kill). The draft recovery flow in `_layout.tsx` calls `SessionsQueries.discardSession(draftId)` DIRECTLY, not through the hook. Do NOT refactor this — the hook pattern is correct for the in-session discard use case (Story 1.3).

### CRITICAL: Store Already Reset After Force-Close

When the app force-closes and restarts:
- `useSessionStore` starts at `initialState` (phase: 'idle', activeSessionId: null, etc.)
- No store reset is needed after discarding or saving a draft
- `saveSessionAsComplete` does NOT need to call `reset()` — store is already empty

### Draft Detection: Only in Root Layout

The draft check happens in `_layout.tsx` AFTER migrations complete, blocking on a `'checking'` sentinel value so the splash screen stays up during the DB read. The Home tab never renders until the check completes:

```
App starts → splash screen
  ↓ (fontsLoaded && migrationsSuccess)
getDraftSession() call
  ↓ null → no modal → Home tab renders
  ↓ { id, started_at } → DraftResumeModal renders over Home tab
```

### Rendering Pattern: Fragment Wrapper

The `_layout.tsx` return changes from `<Stack>` to `<><Stack /><DraftResumeModal /></>`. The modal is rendered OUTSIDE the Stack navigator so it truly overlays everything. The `<>` React.Fragment is the correct wrapper here — do NOT add a `<View>` wrapper (it would break the layout).

### Resume: Rebuilding Exercise Order from Sets

When resuming, exercises must be displayed in the same order as the user added them. The order is preserved via `logged_at` on the first set per exercise:

```typescript
// getExerciseIdsForSession in sessions.queries.ts
// Returns IDs ordered by the earliest logged_at for each exercise
const rows = await db
  .select({ exerciseId: sets.exercise_id, loggedAt: sets.logged_at })
  .from(sets)
  .where(eq(sets.session_id, sessionId))
  .orderBy(asc(sets.logged_at))
// JS dedup loop preserves first-occurrence order
```

These IDs go directly into `useSessionStore.setState({ sessionExerciseIds: exerciseIds })`. The existing `useSessionExercises(ids)` hook in `active.tsx` then loads the full exercise rows in the same order.

### Resume: Rest Timer Behavior

The Rest Timer state (`restTimerSeconds`, `restTimerRunning`) is ephemeral — it is NOT restored on resume. After resume, `restTimerSeconds` starts at 0 and `restTimerRunning` is false. The rest timer will start fresh after the user logs the next set (Epic 2 implements auto-start). For now, the timer state is simply absent — this is correct per AC3.

### 2-Hour Stale Threshold

Computed in `DraftResumeModal.tsx` at render time (not at detection time):
```typescript
import { DRAFT_STALE_THRESHOLD_S } from '../../constants'  // = 7200
const isStale = Math.floor(Date.now() / 1000) - draft.started_at >= DRAFT_STALE_THRESHOLD_S
```

The constant lives in `/src/constants/index.ts` (ARCH-15 principle: operation thresholds as named constants).

### Save as Complete: No Session Summary

After "Save as Complete", the app returns to the Home tab. There is NO navigation to the session summary screen. This is intentional per UX-DR19 ("before returning to Home"). The summary flow is only for normal session endings.

### Unit Change Across App Kill: No Special Handling

AC6 is satisfied by the existing display architecture. All weights are stored as canonical kg. At render time, `useSettingsStore.unit` is read from Zustand (which is re-initialized from the settings store's persisted state on app start). `formatWeight(value_kg, unit)` picks up the current unit automatically. Zero code changes needed for AC6 — confirm this by reading the relevant component and document in notes.

### Drizzle Import: and + isNull

```typescript
// sessions.queries.ts — update import line:
import { eq, sql, and, isNull, asc } from 'drizzle-orm'
```

`isNull` from drizzle-orm generates `IS NULL` SQL condition (not `= NULL`).

### Architecture Boundary: Direct Query in _layout.tsx

`_layout.tsx` calls `SessionsQueries.getDraftSession()` and `SessionsQueries.discardSession()` directly — NOT through a hook. This is intentional: hooks cannot be called outside of React component render cycles, and the async handlers (`handleDraftResume`, etc.) are regular async functions, not hooks. The pattern follows the same direct-call approach used in `useSessions.ts` callback bodies.

### Test Mock Update: transaction

The `sessions.queries.test.ts` mock needs `transaction` added:
```typescript
jest.mock('../client', () => ({
  db: {
    // ... existing mocks ...
    transaction: jest.fn(async (fn: Function) => {
      const txMock = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      }
      return fn(txMock)
    }),
    limit: jest.fn().mockResolvedValue([]),
  },
}))
```

### Existing Code NOT to Modify

Do NOT touch:
- `/src/db/schema.ts` ✅ — `sessions` table already has `is_draft` boolean and `ended_at` nullable
- `/src/stores/useSessionStore.ts` ✅ — `sessionExerciseIds: string[]` already exists; `setState` can populate it directly
- `/src/hooks/useSessions.ts` existing `discardSession` action ✅ — keep for in-session use; the hook action is not used in draft recovery flow
- `/src/app/session/active.tsx` ✅ — no changes; the existing `useLiveSetsByExercise(sessionId, exerciseId)` hook correctly loads sets from DB by sessionId regardless of how the session was started
- `/src/app/(tabs)/index.tsx` ✅ — the `phase !== 'idle'` banner naturally appears after `resumeDraftSession` sets `phase: 'active'`; navigation to `/session/active` happens in `handleDraftResume`, not the Home screen

### Design Tokens Used in DraftResumeModal

| Element | Style |
|---|---|
| Backdrop | `SURFACE_BASE` at 90% opacity (rgba(13,13,15,0.90)) |
| Modal card | `SURFACE_RAISED` (#141418), rounded-lg (16px), padding 24 |
| Heading | DM Sans 700, 20sp, `INK_PRIMARY` |
| Session age | DM Sans 400, 14sp, `INK_SECONDARY` |
| "Resume" CTA (primary, non-stale) | ghost-accent border 1.5px, transparent fill, DM Sans 700, 16sp, INK_PRIMARY, rounded-pill, min 44dp height |
| "Save as Complete" CTA (primary, stale) | GHOST_ACCENT fill, #000000 text, DM Sans 700, 16sp, rounded-pill, min 44dp height |
| "Start Fresh" / "Resume" (secondary) | text button, DM Sans 500, 14sp, INK_SECONDARY, min 44dp touch target |
| "Discard" (second confirm) | DM Sans 500, 14sp, `FEEDBACK_ERROR` (#ff4444) |
| "Keep Draft" (second confirm) | DM Sans 500, 14sp, INK_SECONDARY |

### Summary of New/Updated Files

```
src/
  constants/
    index.ts                  UPDATE — add DRAFT_STALE_THRESHOLD_S = 7200
  db/
    queries/
      sessions.queries.ts     UPDATE — add getDraftSession(), getExerciseIdsForSession(),
                                        saveSessionAsComplete(); update discardSession() to tx
      sessions.queries.test.ts UPDATE — update discardSession test; add tests for 3 new functions;
                                        update mock to include transaction + limit + new drizzle fns
  components/
    common/
      DraftResumeModal.tsx    NEW — draft recovery modal with Resume / Start Fresh / Save as Complete
  app/
    _layout.tsx               UPDATE — draft check on startup; DraftResumeModal render
```

### References

- [Source: epics.md#Story 1.6] — All 6 acceptance criteria
- [Source: epics.md#FR-4] — "Session auto-saves to draft if app force-closed; user prompted to resume or discard on next open"
- [Source: epics.md#ARCH-14] — "on app restart, check sessions WHERE ended_at IS NULL AND is_draft = true → Draft Resume modal; Zustand state gone; recovery reads from Drizzle directly"
- [Source: epics.md#UX-DR19] — Modal copy, CTA promotion logic, second confirmation, Save as Complete path
- [Source: story 1.5 Dev Notes#Expo SDK Version] — actual package is v54, not v56; read docs at https://docs.expo.dev/versions/v54.0.0/
- [Source: story 1.5 Dev Notes#Architecture Boundary] — components NEVER import from `/src/db/queries/` directly
- [Source: story 1.5 Dev Notes#Testing Pattern] — mocked Jest, expo-sqlite cannot run in Jest
- [Source: architecture.md#ARCH-8] — timestamps as epoch integers; `Math.floor(Date.now() / 1000)` everywhere
- [Source: deferred-work.md] — "reset() leaves active session DB rows orphaned" — this story resolves by deleting sets in transaction during discard

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Test mock issue: `mockDb.where` needed to be `mockReturnThis()` (not `mockResolvedValue`) in `beforeEach` so that chainable calls `.limit()` and `.orderBy()` work after it. Tests that need `where` to be terminal (getSessionSetCount) override via `mockResolvedValue` in the test body itself.

### Completion Notes List

- Task 1: Added `DRAFT_STALE_THRESHOLD_S = 7200` to `src/constants/index.ts`
- Task 2: Updated `sessions.queries.ts` — added `getDraftSession`, `getExerciseIdsForSession`, `saveSessionAsComplete`; updated `discardSession` to use transaction deleting sets then session
- Task 3: Added `checkAndGetDraftSession`, `resumeDraftSession`, `saveSessionAsComplete` actions to `useSessions.ts`; existing `discardSession` hook unchanged (used for in-session discard)
- Task 4: Created `DraftResumeModal.tsx` with non-stale (Resume primary) and stale (Save as Complete primary) states, second-confirmation "Discard" flow, 44dp touch targets, accessibilityViewIsModal
- Task 5: Updated `_layout.tsx` with `draftSession` state ('checking' sentinel), draft check after migrations succeed, handlers calling queries directly, Fragment wrapper rendering modal outside Stack
- Task 6: Updated `sessions.queries.test.ts` — updated discardSession test to verify transaction, added tests for getDraftSession (null + found), saveSessionAsComplete (is_draft false, epoch seconds), getExerciseIdsForSession (empty, ordered, deduplicated); all 89 tests pass
- AC6 confirmed: no code changes needed — `formatWeight` already reads current unit from persisted settingsStore at render time

### File List

- `src/constants/index.ts` — added DRAFT_STALE_THRESHOLD_S
- `src/db/queries/sessions.queries.ts` — added 3 new queries, updated discardSession
- `src/db/queries/sessions.queries.test.ts` — updated mock, added tests for new queries
- `src/hooks/useSessions.ts` — added 3 new hook actions
- `src/components/common/DraftResumeModal.tsx` — NEW
- `src/app/_layout.tsx` — integrated draft recovery and modal

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-06-21 | Implement Story 1.6: Draft Session Recovery (Resume & Discard) | sessions.queries.ts, sessions.queries.test.ts, useSessions.ts, DraftResumeModal.tsx, _layout.tsx, constants/index.ts |

---

### Review Findings

- [x] [Review][Decision] Store field bleed on resume — resolved: added `useSessionStore.getState().reset()` before `setState` in `handleDraftResume`. [_layout.tsx]

- [x] [Review][Patch] Optimistic dismiss before DB write completes — fixed: moved `setDraftSession(null)` to after `await` in `handleDraftStartFresh` and `handleDraftSaveAsComplete`. [_layout.tsx]
- [x] [Review][Patch] No error handling in _layout.tsx handlers — fixed: wrapped all three handlers in try/catch with `showToast` on failure. [_layout.tsx]
- [x] [Review][Patch] `getDraftSession` missing ORDER BY — fixed: added `.orderBy(desc(sessions.started_at))` to surface most recent draft. [sessions.queries.ts]
- [x] [Review][Patch] `isStale` recomputed on every render — fixed: frozen at mount with `useRef(...).current`. [DraftResumeModal.tsx]
- [x] [Review][Patch] Double-tap fires async handlers twice — fixed: added `loading` state + `handleAction` wrapper + `disabled={loading}` on all buttons. [DraftResumeModal.tsx]
- [x] [Review][Patch] Transaction test doesn't verify delete ordering — fixed: added assertions for sets-before-sessions order in transaction. [sessions.queries.test.ts]
- [x] [Review][Patch] `onRequestClose` no-op undocumented — fixed: added explicit comment. [DraftResumeModal.tsx]
- [x] [Review][Patch] `formatSessionAge` shows "0 minutes ago" for sub-60s sessions — fixed: returns "just now" when elapsedSeconds < 60; added `Math.max(0, ...)` guard for clock skew. [DraftResumeModal.tsx]

- [x] [Review][Defer] Dead hook exports in useSessions.ts — `checkAndGetDraftSession`, `resumeDraftSession`, `saveSessionAsComplete` are exported but never called from the recovery flow (design decision per dev notes, but creates maintenance confusion). [useSessions.ts] — deferred, pre-existing architectural decision
- [x] [Review][Defer] `saveSessionAsComplete` allows zero-set sessions — no guard prevents an empty draft from being marked complete and appearing in session history. [sessions.queries.ts] — deferred, no spec constraint
