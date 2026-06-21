# Deferred Work

## Deferred from: code review of 2-2-android-floating-bubble (2026-06-21)

- **Native FloatingBubbleService.kt scaffold stubs** — `updateBubbleDisplay()`, `triggerAtZeroPulse()`, `sendTapEvent()`, `sendLongPressEvent()`, and permission revocation event are stub implementations. AC4 visual spec, AC5 pulse animation, AC6 tap event, AC7 long-press edit sheet, AC10 revocation event must be completed in native iteration. [`android/.../FloatingBubbleService.kt`]
- **dismissAllNotificationsAsync() too broad** — Cancels all app notifications, not just the session one. No second notification type exists yet. Add per-ID cancellation (`cancelScheduledNotificationAsync(id)`) when a second notification type is introduced. [`src/lib/bubbleNotification.ts`]
- **com.anonymous.GhostRival Android package name** — Pre-existing dev placeholder; already in deferred-work from story 1-1. Requires new app install after rename; address before store submission. [`GhostRival/app.json`]

## Deferred from: code review of 2-1-rest-timer-bar-and-in-app-timer-ux (2026-06-21)

- **`maxLength={4}` allows "9999" with no save feedback** — Spec says "no inline error UI required"; silent reject on Save is specified behavior. Add feedback in a future UX polish pass. [GhostRival/src/app/(tabs)/settings.tsx]
- **Timer store state not reset on back-navigation without ending session** — `reset()` handles the normal session-end flow; abnormal back-navigation is an edge case outside this story's scope. Revisit in Epic 2/3 when session lifecycle is more complex. [GhostRival/src/hooks/useRestTimer.ts]
- **Stale `sessionExercises` race on AC3 first set logged** — The `??` fallback to `defaultRestTimerSeconds` is correct behavior when the exercise isn't found; this race is extremely unlikely during normal use. [GhostRival/src/app/session/active.tsx]

## Deferred from: code review of 1-6-draft-session-recovery-resume-and-discard (2026-06-21)

- **Dead hook exports in useSessions.ts** — `checkAndGetDraftSession`, `resumeDraftSession`, `saveSessionAsComplete` are exported but never called from the recovery flow (design decision per dev notes, but creates maintenance confusion). [src/hooks/useSessions.ts]
- **`saveSessionAsComplete` allows zero-set sessions** — No guard prevents an empty draft from being marked complete and appearing in session history. No spec constraint against this; revisit if data quality issues surface. [src/db/queries/sessions.queries.ts]

## Deferred from: code review of 1-5-cardio-set-logging (2026-06-20)

- **`'kg' | 'lb'` unit type used as distance unit in cardio mapper functions** — Semantic mismatch; works at runtime by convention ('lb'→miles, else→km). Pre-existing SettingsStore design. Revisit if unit system is ever expanded. [src/db/mappers/cardio.mapper.ts]
- **`getPrefillForExercise` returns `durationS: null` for strength sets, silently skipping ghost prefill** — Unreachable in normal flow because type routing in `active.tsx` only opens CardioSetEntrySheet for cardio exercises. Revisit if exercise types become mutable. [src/hooks/useSets.ts]
- **Dead try/catch stub in `logCardioSet` wraps commented-out `detectPr` call** — Pre-existing pattern from `logStrengthSet`; Epic 3 wires the PR detection call here. [src/db/queries/sets.queries.ts]
- **`formatDurationAccessibility` has no hour handling** — Sessions over 60 min render "60 minutes" not "1 hour". AC5 does not specify hour form; improve when accessibility review is done. [src/db/mappers/cardio.mapper.ts]
- **`distanceM` guard logic duplicated in two places in CardioSetEntrySheet** — Pace preview guard and `handleLogSet` finalDistanceM guard use the same condition independently. Low risk currently; extract to helper if logic evolves. [src/components/session/CardioSetEntrySheet.tsx]

## Deferred from: code review of 1-4-strength-set-logging (2026-06-20)

- **`useLiveSetsByExercise` subscribes with empty-string session_id when sessionId=null** — Functionally correct (returns no rows); empty-string query is a cosmetic inefficiency. Revisit if drizzle live query subscription overhead becomes measurable. [src/hooks/useSets.ts]
- **ExerciseSetList brief flash of empty before first live query result** — Minor UX; adding a loading state or skeleton is a future improvement. [src/app/session/active.tsx]
- **`getExerciseSummary` not memoized in summary.tsx** — Single-render summary screen; `useMemo` is an unnecessary optimization at current exercise count. Add if summary renders become measurably slow. [src/app/session/summary.tsx]
- **`convertToKg` no lower-bound guard for negative values** — Defense-in-depth only; SetEntrySheet validates weight > 0 before calling the function. Add server-side guard if `convertToKg` is ever called from non-UI paths. [src/db/mappers/set.mapper.ts]
- **`summary.tsx` `useLiveSetsForSession(null)` post-reset concern** — Impossible in normal app flow: summary screen renders before `handleDone()` calls `reset()`, so `activeSessionId` is always non-null here. Revisit if navigation flow changes in later epics. [src/app/session/summary.tsx]

## Deferred from: code review of 1-3-session-lifecycle-start-add-exercises-end (2026-06-20)

- **AC #4 Sets/Volume per exercise hardcoded "0 sets" with no Volume in Summary screen** — Explicit stub per Story 1.3 Dev Notes: "Stub for Stories 1.4/1.5 set data: if no sets logged yet, show minimal summary." Will be replaced when set logging lands in Stories 1.4 (strength) and 1.5 (cardio). [src/app/session/summary.tsx]
- **`crypto.randomUUID()` React Native runtime availability not independently verified** — Pre-existing pattern from Stories 1.1/1.2 ("Hermes V1, no package needed" per Dev Notes). If runtime fails at first session creation, will need `expo-crypto` polyfill registered globally. Verify on first device build. [src/db/queries/sessions.queries.ts, src/db/queries/exercises.queries.ts]
- **`SplashScreen.hideAsync()` callable twice in error-then-success race in _layout.tsx** — Pre-existing pattern from Story 1.1. Idempotent so no functional bug; revisit if logs become noisy. [src/app/_layout.tsx]

## Deferred from: code review of 1-2-exercise-management-create-rename-delete (2026-06-19)

- **`showToast` uses blocking `Alert.alert` for errors** — Intentional MVP decision; no toast library installed to avoid new dep. Upgrade when a proper toast library is added in a future story.
- **`showToast` ignores `'info'` type (no-op)** — Future library upgrade planned; code comment acknowledges. Wire up when toast library is added.
- **`createExercise` hook returns slightly different `DisplayExercise` than DB record** — `createdAt: new Date()` vs stored epoch seconds. Low impact; `useLiveQuery` reconciles on next render. Clean up if precise consistency becomes needed.
- **Unicode case normalization: SQLite `lower()` only covers ASCII A-Z** — Non-ASCII exercise names (accented chars, CJK) not case-collapsed for duplicate detection. Accept or add ICU extension when internationalization is required.
- **Test mock chain doesn't mirror Drizzle's actual query builder resolution** — `orderBy` resolves the chain in mock but not in production. Accept given expo-sqlite native constraint; replace with Detox/EAS integration tests when available.
- **`createExercise` query layer has no server-side empty name validation** — UI guards against empty names; data layer has no defense-in-depth. Add validation if the query is ever called from non-UI paths.
- **AC5: "(deleted) [name]" display in active session not implemented** — Explicitly delegated to Story 1.3 per dev notes. Story 1.3 session lifecycle must check `deleted_at IS NOT NULL` for exercises in an active session and display `"(deleted) [name]"` accordingly.
- **No DB-level uniqueness constraint on (name, type)** — Advisory-only duplicate check accepted for single-user MVP. Add `UNIQUE INDEX ON exercises (lower(name), type) WHERE deleted_at IS NULL` when multi-user or concurrency requirements arise.

## Deferred from: code review of 1-1-project-foundation-and-navigation-shell (2026-06-19)

- **drizzle.config.ts `driver: 'expo'` deprecated** — Option removed in newer drizzle-kit versions. Migration already generated successfully; update config when upgrading drizzle-kit.
- **app.json missing `bundleIdentifier` and `package`** — Required for App Store / Play Store submissions. Not needed during development.
- **`prExplosionPending.prData` typed as `unknown`** — PR data shape will be defined in Epic 3 when PR detection is implemented.
- **Timestamp epoch unit (ms vs seconds) not documented or enforced** — Add comment convention to `src/db/schema.ts` when implementing the first DB write path (Story 1.3 or 1.4).
- **`sync_queue` has no retry count field** — Retry/circuit-breaker logic is an Epic 5 concern when cloud sync is implemented.
- **`sessions.ended_at` and `is_draft` are logically coupled but have no co-constraint** — Enforce correct state transitions in Story 1.3 session lifecycle implementation.
- **`exercises.deleted_at` has no index** — Performance optimization; add index when table size warrants it.
- **`setDefaultRestTimerSeconds` accepts any number including 0, NaN, negative** — Enforce bounds at the UI input validation layer in the Settings screen (future story).
- **`reset()` leaves active session DB rows orphaned and doesn't stop timer callbacks** — Story 1.3 must implement proper cleanup logic before calling `reset()`.
