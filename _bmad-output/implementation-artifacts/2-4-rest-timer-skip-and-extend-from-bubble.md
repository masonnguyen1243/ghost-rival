---
baseline_commit: 63098cb
---

# Story 2.4: Rest Timer Skip & Extend from Bubble

Status: done

## Story

As Mason,
I want to skip or extend the Rest Timer from the Floating Bubble without opening the app,
So that I can adjust my rest period with zero interruption to my phone flow.

## Acceptance Criteria

**AC1** — **Given** the Rest Timer is running and the Floating Bubble is visible (Android) **When** I long-press the Bubble to open the edit sheet **Then** the edit sheet includes "Skip Rest" and "+30s" controls alongside the weight/reps fields.

**AC2** — **Given** I tap "Skip Rest" from the Bubble edit sheet **When** the action fires **Then** the Rest Timer stops immediately; no haptic fires for the skip; the Bubble sub-label returns to "Active".

**AC3** — **Given** I tap "+30s" from the Bubble edit sheet **When** the action fires **Then** 30 seconds are added to the current remaining Rest Timer time; the Bubble countdown updates immediately; the in-app Rest Timer Bar and numeric countdown also update reactively.

**AC4** — **Given** I am on iOS and want to skip or extend **When** I interact with the Live Activity **Then** tapping the Live Activity routes to the app (foreground required for timer control on iOS — platform constraint); skip and extend controls are available in-app.

**AC5** — **And** all Rest Timer state (countdown, running/paused) lives in `useSessionStore` (ephemeral Zustand); no timer state is persisted to the DB.

---

## Tasks / Subtasks

- [x] Task 1: `src/hooks/useRestTimer.ts` — Add `extendTimer` function (AC3, AC4, AC5)
  - [x] Add `extendTimer(seconds: number)` alongside `startTimer` and `skipTimer`
  - [x] Guard: if `restTimerRunning` is false (timer already at 0), return early — no-op
  - [x] Implementation: read live value via `useSessionStore.getState().restTimerSeconds`, then call `setRestTimerSeconds(current + seconds)`
  - [x] Do NOT restart the interval — the running interval already reads `restTimerSeconds` live from the store on each tick; just updating the store is sufficient
  - [x] Return `extendTimer` from the hook alongside `startTimer` and `skipTimer`

- [x] Task 2: `src/modules/floating-bubble/FloatingBubbleModule.ts` — Extend `IFloatingBubbleModule` interface (AC1, AC2, AC3)
  - [x] Add `onSkipRest(callback: () => void): () => void` — returns an unsubscribe function (same pattern as `onTap`)
  - [x] Add `onExtendRest(callback: (seconds: number) => void): () => void` — callback receives the number of seconds to extend
  - [x] Keep all existing methods unchanged; only append new methods

- [x] Task 3: `src/modules/floating-bubble/FloatingBubbleModule.android.ts` — Bridge new events (AC1, AC2, AC3)
  - [x] Implement `onSkipRest`: subscribe to `'FloatingBubbleSkipRest'` event via existing `emitter`
    ```typescript
    onSkipRest: (callback: () => void): (() => void) => {
      if (!emitter) return () => {}
      const sub = emitter.addListener('FloatingBubbleSkipRest', callback)
      return () => sub.remove()
    },
    ```
  - [x] Implement `onExtendRest`: subscribe to `'FloatingBubbleExtendRest'` event — native fires it with `{ seconds: number }` payload
    ```typescript
    onExtendRest: (callback: (seconds: number) => void): (() => void) => {
      if (!emitter) return () => {}
      const sub = emitter.addListener('FloatingBubbleExtendRest', (data: { seconds: number }) => callback(data.seconds))
      return () => sub.remove()
    },
    ```
  - [x] Do NOT touch any existing methods (`onTap`, `onLongPressConfirm`, `onPermissionRevoked`, etc.)

- [x] Task 4: `src/modules/floating-bubble/FloatingBubbleModule.ios.ts` — Add throwing stubs (ARCH-11) (AC1, AC2, AC3)
  - [x] Add `onSkipRest: () => { throw new UnsupportedPlatformError('onSkipRest') }` 
  - [x] Add `onExtendRest: () => { throw new UnsupportedPlatformError('onExtendRest') }`
  - [x] Pattern is identical to existing stubs — MUST throw, never silent no-op (ARCH-11)

- [x] Task 5: `src/modules/floating-bubble/FloatingBubbleModule.ios.test.ts` — Update test coverage
  - [x] Add `'onSkipRest'` and `'onExtendRest'` to the existing `it.each` array
  - [x] No other changes; existing test pattern covers the new methods automatically

- [x] Task 6: `src/hooks/useFloatingBubble.ts` — Subscribe to skip/extend events (AC2, AC3)
  - [x] Add `onSkipRest: () => void` and `onExtendRest: (seconds: number) => void` to the `options` parameter interface
  - [x] Add refs to keep callbacks current (same pattern as `onTapRef` and `onLongPressRef`):
    ```typescript
    const onSkipRestRef = useRef(options.onSkipRest)
    const onExtendRestRef = useRef(options.onExtendRest)
    useEffect(() => { onSkipRestRef.current = options.onSkipRest }, [options.onSkipRest])
    useEffect(() => { onExtendRestRef.current = options.onExtendRest }, [options.onExtendRest])
    ```
  - [x] In the mount-only `useEffect` where `onTap` and `onLongPressConfirm` are registered, add:
    ```typescript
    const unsubSkip = FloatingBubbleModule.onSkipRest(() => onSkipRestRef.current())
    const unsubExtend = FloatingBubbleModule.onExtendRest((secs) => onExtendRestRef.current(secs))
    ```
  - [x] Return both in the cleanup: `unsubSkip()` and `unsubExtend()`
  - [x] Do NOT change the AppState-based show/hide logic, `updateState` effect, or session-end effect

- [x] Task 7: `src/components/session/RestTimerBar.tsx` — Add "+30s" button for in-app extend (AC3, AC4)
  - [x] Import `useRestTimer` from `'../../hooks/useRestTimer'`
  - [x] Call `const { extendTimer } = useRestTimer()` inside the component
  - [x] Add "+30s" `TouchableOpacity` button alongside the existing "SKIP" button in the `row`
  - [x] Button should only be enabled when `restTimerRunning === true`; use opacity 0.4 when disabled
  - [x] On press: call `extendTimer(30)`
  - [x] Accessibility: `accessibilityRole="button"`, `accessibilityLabel="Add 30 seconds to rest timer"`, `accessibilityState={{ disabled: !restTimerRunning }}`
  - [x] Touch target: `minWidth: 44, minHeight: 44` (NFR-11)
  - [x] Style the button text identically to the SKIP button (INK_SECONDARY, DMSans_500Medium, 11pt uppercase)

- [x] Task 8: `src/app/session/active.tsx` — Wire skip/extend to `useFloatingBubble` (AC2, AC3)
  - [x] `useRestTimer` is already called somewhere in `active.tsx` (for `startTimer`); destructure `skipTimer` and `extendTimer` from it
  - [x] If `useRestTimer` is not yet called in `active.tsx`, add the call
  - [x] Pass `onSkipRest: skipTimer` and `onExtendRest: (secs) => extendTimer(secs)` to `useFloatingBubble`
  - [x] Confirm the existing `startTimer` call pattern is preserved — do NOT move or duplicate it

- [x] Task 9: Native Android stub documentation (informational — not JS code)
  - [x] Add a note in `android/.../FloatingBubbleService.kt` (if editable) that Story 2.4 requires:
    - "Skip Rest" button in the long-press edit sheet → fires `FloatingBubbleSkipRest` event
    - "+30s" button in the long-press edit sheet → fires `FloatingBubbleExtendRest` event with `{ seconds: 30 }` payload
  - [x] The JS-layer event subscriptions are wired (Tasks 3 and 6); native Kotlin stubs to be completed in the native dev pass (same pattern as deferred AC4/AC5/AC6/AC7/AC10 from Story 2.2)

- [x] Task 10: Confirm test suite passes
  - [x] Run: `npx jest --passWithNoTests 2>&1 | tail -5`
  - [x] Expected: 110 tests passing (108 baseline + 2 new iOS stub tests for onSkipRest and onExtendRest)

---

## Dev Notes

### Critical: What Already Exists — Do NOT Recreate

| What you might reinvent | What already exists | Location |
|---|---|---|
| Skip timer logic | `skipTimer()` — clears intervalRef + flashTimeoutRef + resets store | `src/hooks/useRestTimer.ts:62-76` |
| In-app SKIP button | `handleSkip` in RestTimerBar, stores-only approach | `src/components/session/RestTimerBar.tsx:35-39` |
| Timer interval cleanup pattern | `useEffect` watches `restTimerRunning` to clear interval on stop | `src/hooks/useRestTimer.ts:16-21` |
| Live store reads in interval | `useSessionStore.getState().restTimerSeconds` pattern already used | `useRestTimer.ts:43` |
| Event subscription pattern | `emitter.addListener('FloatingBubble*', cb)` returning `sub.remove` | `FloatingBubbleModule.android.ts:64-80` |
| Ref-based callback freshness | `onTapRef`, `onLongPressRef` with `useEffect` sync | `useFloatingBubble.ts:26-31` |
| iOS stub throwing pattern | `class UnsupportedPlatformError extends Error` + method list | `FloatingBubbleModule.ios.ts` |

### Why `extendTimer` Does Not Restart the Interval

The existing interval in `useRestTimer` reads the store live on every tick:
```typescript
intervalRef.current = setInterval(() => {
  const current = useSessionStore.getState().restTimerSeconds  // live read
  if (current <= 1) { ... } else { setRestTimerSeconds(current - 1) }
}, 1000)
```
Calling `setRestTimerSeconds(current + 30)` is immediately visible to the next interval tick. No restart needed. The interval just "sees" 30 more seconds and keeps counting.

### Why `skipTimer()` Must Be Used (Not Direct Store Reset) for Bubble Events

`skipTimer()` in `useRestTimer` clears both `intervalRef.current` AND `flashTimeoutRef.current`. The `RestTimerBar` handleSkip uses direct store mutation, which triggers the cleanup `useEffect` in `useRestTimer` — that's fine for in-app. But for Bubble events (fired from native → JS event handler in `useFloatingBubble`), we must call the actual `skipTimer()` from the same `useRestTimer` instance used in `active.tsx` to ensure `flashTimeoutRef` is cleared. This is why `skipTimer` is passed as a callback into `useFloatingBubble`.

### Bubble Sub-Label "Active" After Skip — How It Works

1. Native Bubble fires `FloatingBubbleSkipRest` event
2. `onSkipRest` handler in `useFloatingBubble` calls `skipTimerRef.current()` → `skipTimer()`
3. `skipTimer()` sets `restTimerSeconds = 0` and `restTimerRunning = false` in store
4. Existing `useEffect` in `useFloatingBubble` watches `restTimerSeconds`:
   ```typescript
   // Already exists in useFloatingBubble.ts:54-61
   useEffect(() => {
     if (Platform.OS !== 'android' || bubbleMode !== 'bubble') return
     if (appStateRef.current !== 'background') return
     FloatingBubbleModule.updateState({ timerSeconds: restTimerSeconds, prefill: prefillRef.current })
   }, [restTimerSeconds, bubbleMode])
   ```
5. This fires with `timerSeconds: 0` → native Bubble receives the update and shows "Active" sub-label

**No additional native callback needed** — the existing reactive `updateState` path handles it.

### "+30s" In-App: `useRestTimer` in Multiple Components Is Safe

`useRestTimer` is called in `active.tsx` (owns the interval) and now also in `RestTimerBar` (only needs `extendTimer`). Each call gets its own `intervalRef` and `flashTimeoutRef`, but the refs in the `RestTimerBar` instance are never populated (it never calls `startTimer`). The two instances share the same Zustand store — state changes in one are immediately visible to the other. No duplication risk.

### Expo SDK Version — CRITICAL

Per Stories 2.2 and 2.3 dev notes: **actual installed SDK is Expo 54** (`package.json` shows `"expo": "~54.0.0"`, React Native 0.81.5, Expo Router v6). The `AGENTS.md` / `CLAUDE.md` says v56 but this is wrong — both confirmed multiple times. Refer to Expo v54 docs when needed.

### iOS Path — No New iOS Code Required

iOS does not have a Floating Bubble. AC4 is informational: tapping the Live Activity brings the app to foreground (handled by deep-link wired in Story 2.3). Once in-app:
- Skip is already available via `RestTimerBar` SKIP button (Story 2.1)
- Extend will be available via the new "+30s" button added in Task 7

No changes to `LiveActivityModule.ts`, `useLiveActivity.ts`, or any iOS native code.

### Android Native Side — Current State

Per `deferred-work.md` from Story 2.2, `FloatingBubbleService.kt` is a native stub. The edit sheet (AC7 from Story 2.2: "minimal edit sheet with weight stepper + reps stepper + Log Set") is already deferred. Story 2.4's native Android requirements (Skip Rest + +30s buttons in the edit sheet) are additive on top of that stub. The JS-layer event subscriptions in Tasks 2–6 are wired and ready; native Kotlin implementation follows the existing `FloatingBubbleTap` / `FloatingBubbleLongPressConfirm` emitter patterns.

### File Structure After This Story

```
src/
  hooks/
    useRestTimer.ts         UPDATE — add extendTimer()
    useFloatingBubble.ts    UPDATE — add onSkipRest/onExtendRest props + event subscriptions
  modules/
    floating-bubble/
      FloatingBubbleModule.ts           UPDATE — add onSkipRest/onExtendRest to IFloatingBubbleModule
      FloatingBubbleModule.android.ts   UPDATE — implement onSkipRest/onExtendRest via emitter
      FloatingBubbleModule.ios.ts       UPDATE — add throwing stubs
      FloatingBubbleModule.ios.test.ts  UPDATE — add onSkipRest/onExtendRest to test list
  components/
    session/
      RestTimerBar.tsx      UPDATE — add "+30s" button
  app/
    session/
      active.tsx            UPDATE — pass skipTimer/extendTimer to useFloatingBubble
```

### Files NOT to Modify

- `src/stores/useSessionStore.ts` — all needed state already there (`restTimerSeconds`, `restTimerRunning`, `setRestTimerSeconds`, `setRestTimerRunning`, etc.)
- `src/hooks/useLiveActivity.ts` — iOS Live Activity unchanged
- `src/modules/live-activity/` — no Live Activity changes
- `src/db/` — no DB changes (AC5: ephemeral state only)
- `src/modules/floating-bubble/FloatingBubbleModule.android.test.ts` — doesn't exist; Android module tests are integration-only
- `src/modules/live-activity/LiveActivityModule.android.test.ts` — unrelated story

### Testing Standards

- Co-located tests (per ARCH from architecture.md)
- The only new test file: update `FloatingBubbleModule.ios.test.ts` to add 2 methods to the `it.each` array
- Do NOT mock Zustand store in tests — test state reactivity is verified by observing what functions are called
- Run `npx jest --passWithNoTests` to confirm baseline before and after changes; expect 110 passing

### References

- [Source: epics.md#Story 2.4] — All acceptance criteria
- [Source: epics.md#FR-7] — Skip/extend timer from Bubble/Live Activity (platform context)
- [Source: epics.md#ARCH-11] — Platform stubs MUST throw UnsupportedPlatformError, never silent no-op
- [Source: architecture.md#Native Module Patterns] — ≤200ms async SLA, interface-only imports
- [Source: architecture.md#State Management Patterns] — Rest timer state is Zustand ephemeral only
- [Source: story 2.1 Dev Notes] — Zustand stale closure fix: `useSessionStore.getState()` in interval
- [Source: story 2.2 Dev Notes] — Expo SDK is v54 not v56; NativeEventEmitter pattern; P4 re-export; stale closure fix
- [Source: story 2.2 Dev Notes] — `FloatingBubbleService.kt` is a native stub; deferred-work.md tracks native completions
- [Source: story 2.3 Dev Notes] — Metro platform resolution; `FloatingBubbleModule.ts` still has re-export (keep pattern)
- [Source: deferred-work.md] — Native FloatingBubbleService.kt stubs: AC4 pulse, AC6 tap, AC7 edit sheet incomplete

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added `extendTimer(seconds)` to `useRestTimer` — reads live store value via `getState()` (no interval restart needed; interval already reads store on each tick). Guards against calling when timer is not running.
- Extended `IFloatingBubbleModule` interface with `onSkipRest` and `onExtendRest` methods.
- Android module bridges `FloatingBubbleSkipRest` and `FloatingBubbleExtendRest` native events using the existing `emitter.addListener` pattern.
- iOS module adds throwing stubs for both methods per ARCH-11 (never silent no-op).
- `FloatingBubbleModule.ios.test.ts` updated — `it.each` now covers 10 methods (was 8); 110 tests pass (was 108).
- `useFloatingBubble` options extended with `onSkipRest` and `onExtendRest`; ref-based callbacks registered in mount-only `useEffect` with cleanup.
- `RestTimerBar` adds "+30s" button: disabled when timer not running (opacity 0.4), accessibility attrs per NFR-11, styled identically to SKIP.
- `active.tsx` destructures `skipTimer` and `extendTimer` from `useRestTimer` and passes them to `useFloatingBubble`.
- iOS path: no new iOS code — tapping Live Activity opens app in foreground where SKIP and +30S buttons in RestTimerBar are available (AC4 satisfied).

### File List

- GhostRival/src/hooks/useRestTimer.ts
- GhostRival/src/modules/floating-bubble/FloatingBubbleModule.ts
- GhostRival/src/modules/floating-bubble/FloatingBubbleModule.android.ts
- GhostRival/src/modules/floating-bubble/FloatingBubbleModule.ios.ts
- GhostRival/src/modules/floating-bubble/FloatingBubbleModule.ios.test.ts
- GhostRival/src/hooks/useFloatingBubble.ts
- GhostRival/src/components/session/RestTimerBar.tsx
- GhostRival/src/app/session/active.tsx
- GhostRival/android/app/src/main/java/com/anonymous/GhostRival/FloatingBubbleService.kt

### Review Findings

#### Decision Needed
- [x] [Review][Decision] Should `extendTimer` also update `restTimerTotalSeconds`? — Resolved: (A) update `restTimerTotalSeconds` to keep fill-bar proportional. Applied.

#### Patches
- [x] [Review][Patch] `extendTimer` guard reads stale React subscription — use `useSessionStore.getState().restTimerRunning` [`useRestTimer.ts`]
- [x] [Review][Patch] No upper bound on accumulated seconds — cap at 3600s [`useRestTimer.ts`]
- [x] [Review][Patch] `onExtendRest` native payload not validated — malformed `data.seconds` produces NaN in store [`FloatingBubbleModule.android.ts`]
- [x] [Review][Patch] `onExtendRest: (secs) => extendTimer(secs)` unnecessary wrapper — pass `extendTimer` directly for referential stability [`active.tsx`]
- [x] [Review][Patch] No guard against `seconds <= 0` in `extendTimer` — negative values silently shrink timer [`useRestTimer.ts`]
- [x] [Review][Patch] Comment `// No haptic on skip (per AC4)` should reference AC2 [`useRestTimer.ts`]

#### Deferred
- [x] [Review][Defer] `useFloatingBubble` registers skip/extend listeners without platform guard on iOS [`useFloatingBubble.ts`] — deferred, pre-existing (onTap/onLongPress/onPermissionRevoked use same pattern; no crash reported across stories 2.1–2.3)
- [x] [Review][Defer] `RestTimerBar.handleSkip` directly resets store without calling `skipTimer()` [`RestTimerBar.tsx`] — deferred, pre-existing; dev notes explicitly justify this path (cleanup useEffect in useRestTimer handles the stop)
- [x] [Review][Defer] Callback refs may be one render stale if parent re-renders before first `useEffect` flush [`useFloatingBubble.ts`] — deferred, pre-existing React pattern; theoretical race only
- [x] [Review][Defer] AC1 native Android edit sheet (Skip Rest + +30s buttons) not in diff — deferred per dev notes, same pattern as Story 2.2 native stubs

## Change Log

- 2026-06-21: Story 2.4 implemented — added extendTimer to useRestTimer, onSkipRest/onExtendRest to FloatingBubble interface + Android bridge + iOS stubs + tests, +30s button in RestTimerBar, skip/extend wired to useFloatingBubble in active.tsx. 110 tests passing.
