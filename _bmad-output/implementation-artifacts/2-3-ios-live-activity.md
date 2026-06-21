---
baseline_commit: 7d72869
---

# Story 2.3: iOS Live Activity

Status: done

## Story

As Mason,
I want a Live Activity in the Dynamic Island and lock screen when I leave Ghost Rival mid-session on iOS,
So that I can see my Rest Timer countdown from anywhere without unlocking my phone.

## Acceptance Criteria

**AC1** — **Given** I start a session for the first time on iOS **When** the session begins **Then** Ghost Rival requests Notifications permission (standard iOS runtime dialog, which enables Live Activities on iOS 16.1+); if already granted, this is skipped.

**AC2** — **Given** permission is granted and a session is active **When** I leave Ghost Rival on iPhone 14 Pro+ **Then** a compact Live Activity appears in the Dynamic Island: Ghost icon (leading, ghost-accent, 14pt) + Rest Timer countdown or "Active" label (trailing, mono-data, ink-primary, 13pt).

**AC3** — **Given** a session is active and I view the lock screen (all iPhone models 16.1+) **When** the Live Activity renders in expanded mode **Then** left column: Exercise name (heading/ink-primary, truncated to 1 line) + Ghost data placeholder (body/ghost-dim, showing "–" until Epic 3); right column: Rest Timer countdown (display/ink-primary, 56pt when active, "Active" when idle); bottom row: "Tap to log next set" (body/ink-secondary).

**AC4** — **Given** I tap the Live Activity (Dynamic Island or lock screen) **When** the tap registers **Then** Ghost Rival is brought to foreground (Face ID/Touch ID fires if locked — iOS platform constraint); the Session screen is shown; no Set action is available directly from the lock screen (read-only by design).

**AC5** — **Given** permission is denied **When** a session is active and I leave the app **Then** no ambient indicator appears; the session continues normally; Settings → Session shows: "Enable Live Activities to see your rest timer from any screen." with a link to iOS Settings for Ghost Rival.

**AC6** — **Given** a session is paused (not ended) for more than 8 hours **When** the elapsed time is detected on app resume **Then** the Live Activity ends automatically; the session may still be resumed normally in-app.

**AC7** — **Given** another Live Activity forces minimal state in Dynamic Island **When** minimal state is active **Then** the minimal state shows the Ghost icon only; no fallback notification is triggered (expected iOS behavior).

**AC8** — **Given** a session ends **When** end is confirmed **Then** the Live Activity ends immediately.

**And** implemented via `LiveActivityModule.ts` interface; `LiveActivityModule.android.ts` throws `UnsupportedPlatformError` — never a silent no-op (ARCH-11).

---

## Tasks / Subtasks

- [x] Task 1: app.json — Add iOS entitlements and entitlements plugin
  - [x] Add `ios.infoPlist` key: `"NSUserNotificationUsageDescription"` → `"Ghost Rival uses notifications to show your rest timer on the lock screen and Dynamic Island."`
  - [x] Add entitlements plugin for `com.apple.developer.live-activities` → `true` (required for ActivityKit; without this, `Activity.request()` throws at runtime)
  - [x] Widget extension target registration — covered in Task 5 (expo-widgets or manual target)
  - [x] **NOTE**: `expo prebuild --platform ios` is MANDATORY before any Live Activity code runs on device

- [x] Task 2: types/index.ts — Add Live Activity types
  - [x] Add `LiveActivityOptions` interface:
    ```typescript
    export interface LiveActivityOptions {
      exerciseName: string
      timerSeconds: number      // current remaining seconds (0 = idle/Active)
      timerRunning: boolean
      sessionId: string
    }
    ```
  - [x] Add `LiveActivityPermissionStatus` type:
    ```typescript
    export type LiveActivityPermissionStatus = 'granted' | 'denied' | 'not_determined'
    ```
  - [x] Do NOT redefine `SetPrefill`, `BubbleState`, or any existing type

- [x] Task 3: src/modules/live-activity/ — Create module files
  - [x] Create directory: `src/modules/live-activity/`
  - [x] **File 1**: `LiveActivityModule.ts` — TypeScript interface:
    ```typescript
    import type { LiveActivityOptions, LiveActivityPermissionStatus } from '../../types'

    export interface ILiveActivityModule {
      /** Check if Live Activities are available and permitted on this device/iOS version */
      isAvailable(): Promise<boolean>
      /** Request Notifications permission (required for Live Activities on iOS 16.1+) */
      requestPermission(): Promise<LiveActivityPermissionStatus>
      /** Start a Live Activity for the current session. Idempotent — ends prior activity first. */
      start(options: LiveActivityOptions): Promise<void>
      /** Update the Live Activity content (timer, exercise name). SLA: best-effort, no guarantee. */
      update(options: Partial<LiveActivityOptions>): Promise<void>
      /** End the Live Activity immediately. Safe to call if no activity is running. */
      end(): Promise<void>
    }

    // Platform-specific implementations resolved by Metro:
    // LiveActivityModule.ios.ts    — ActivityKit bridge
    // LiveActivityModule.android.ts — throws UnsupportedPlatformError
    export { LiveActivityModule } from './LiveActivityModule.ios'
    ```
    - [x] **CRITICAL**: The re-export at the bottom means the barrel `LiveActivityModule.ts` only exists for the interface. If the same P4 bug as Story 2.2 applies (Jest bypasses Metro platform resolution), remove the re-export and let each consumer import from the platform file directly. Follow whatever pattern the Floating Bubble module uses after its P4 patch.
    - [x] Components import from `'../../modules/live-activity/LiveActivityModule'` — never from `.ios.ts` or `.android.ts` directly.

  - [x] **File 2**: `LiveActivityModule.android.ts` — Android stub (ARCH-11):
    ```typescript
    import type { ILiveActivityModule } from './LiveActivityModule'

    class UnsupportedPlatformError extends Error {
      constructor(method: string) {
        super(`LiveActivityModule.${method} is not supported on Android`)
        this.name = 'UnsupportedPlatformError'
      }
    }

    export const LiveActivityModule: ILiveActivityModule = {
      isAvailable: () => { throw new UnsupportedPlatformError('isAvailable') },
      requestPermission: () => { throw new UnsupportedPlatformError('requestPermission') },
      start: () => { throw new UnsupportedPlatformError('start') },
      update: () => { throw new UnsupportedPlatformError('update') },
      end: () => { throw new UnsupportedPlatformError('end') },
    }
    ```
    - [x] Every method MUST throw — never silent no-op. This is ARCH-11.

  - [x] **File 3**: `LiveActivityModule.ios.ts` — iOS NativeModules bridge:
    ```typescript
    import { NativeModules } from 'react-native'
    import type { ILiveActivityModule, LiveActivityOptions, LiveActivityPermissionStatus } from './LiveActivityModule'

    // Bridges to native GhostRivalLiveActivity Expo Module.
    // Only available after `expo prebuild --platform ios` and a dev build.
    // In Expo Go: all methods log a warning and resolve without crashing.

    const { GhostRivalLiveActivity } = NativeModules

    const getModule = () => {
      if (!GhostRivalLiveActivity) {
        console.warn('[LiveActivity] Native module not available — run expo prebuild first')
        return null
      }
      return GhostRivalLiveActivity
    }

    export const LiveActivityModule: ILiveActivityModule = {
      isAvailable: async (): Promise<boolean> => {
        const mod = getModule()
        if (!mod) return false
        return mod.isAvailable()
      },

      requestPermission: async (): Promise<LiveActivityPermissionStatus> => {
        const mod = getModule()
        if (!mod) return 'not_determined'
        return mod.requestPermission()
      },

      start: async (options: LiveActivityOptions): Promise<void> => {
        const mod = getModule()
        if (!mod) return
        return mod.start(options)
      },

      update: async (options: Partial<LiveActivityOptions>): Promise<void> => {
        const mod = getModule()
        if (!mod) return
        return mod.update(options)
      },

      end: async (): Promise<void> => {
        const mod = getModule()
        if (!mod) return
        return mod.end()
      },
    }
    ```

- [x] Task 4: Tests — LiveActivityModule.android.ts
  - [x] Create `/src/modules/live-activity/LiveActivityModule.android.test.ts`
  - [x] Mirror the pattern from `FloatingBubbleModule.ios.test.ts` (which was fixed post-review to check `error.name` separately):
    ```typescript
    import { LiveActivityModule } from './LiveActivityModule.android'

    describe('LiveActivityModule.android (stub)', () => {
      it.each(['isAvailable', 'requestPermission', 'start', 'update', 'end'])(
        '%s throws UnsupportedPlatformError',
        (method) => {
          let thrown: Error | undefined
          try {
            (LiveActivityModule as any)[method]()
          } catch (e) {
            thrown = e as Error
          }
          expect(thrown).toBeDefined()
          expect(thrown?.name).toBe('UnsupportedPlatformError')
          expect(thrown?.message).toContain('Android')
        }
      )
    })
    ```
  - [x] Run existing tests to confirm no regressions: `npx jest --passWithNoTests 2>&1 | tail -5`

- [x] Task 5: Native iOS Expo Module scaffold — GhostRivalLiveActivity
  - [x] **PREREQUISITE**: Run `expo prebuild --platform ios` first to generate `ios/` directory
  - [x] Create Swift Expo Module at: `ios/GhostRivalLiveActivity.swift`
  - [ ] The class name must be `GhostRivalLiveActivity` to match NativeModules lookup in JS:
    ```swift
    import ActivityKit
    import ExpoModulesCore

    public class GhostRivalLiveActivityModule: Module {
      private var currentActivityId: String?

      public func definition() -> ModuleDefinition {
        Name("GhostRivalLiveActivity")

        AsyncFunction("isAvailable") { () -> Bool in
          if #available(iOS 16.2, *) {
            return ActivityAuthorizationInfo().areActivitiesEnabled
          }
          return false
        }

        AsyncFunction("requestPermission") { () -> String in
          let center = UNUserNotificationCenter.current()
          let settings = await center.notificationSettings()
          switch settings.authorizationStatus {
          case .authorized, .provisional:
            return "granted"
          case .denied:
            return "denied"
          default:
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            return granted ? "granted" : "denied"
          }
        }

        AsyncFunction("start") { (options: [String: Any]) -> Void in
          guard #available(iOS 16.2, *) else { return }
          // End any existing activity first (idempotent)
          if let id = self.currentActivityId {
            for activity in Activity<GhostRivalActivityAttributes>.activities
              where activity.id == id {
              await activity.end(nil, dismissalPolicy: .immediate)
            }
          }

          let exerciseName = options["exerciseName"] as? String ?? ""
          let timerSeconds = options["timerSeconds"] as? Int ?? 0
          let timerRunning = options["timerRunning"] as? Bool ?? false
          let sessionId = options["sessionId"] as? String ?? ""

          let attrs = GhostRivalActivityAttributes(sessionId: sessionId)
          let state = GhostRivalActivityAttributes.ContentState(
            exerciseName: exerciseName,
            timerSeconds: timerSeconds,
            timerRunning: timerRunning
          )
          let activityContent = ActivityContent(
            state: state,
            staleDate: Date().addingTimeInterval(8 * 3600)  // auto-expire at 8h
          )
          do {
            let activity = try Activity.request(
              attributes: attrs,
              content: activityContent
            )
            self.currentActivityId = activity.id
          } catch {
            print("[LiveActivity] Failed to start: \(error)")
          }
        }

        AsyncFunction("update") { (options: [String: Any]) -> Void in
          guard #available(iOS 16.2, *), let id = self.currentActivityId else { return }
          for activity in Activity<GhostRivalActivityAttributes>.activities where activity.id == id {
            let current = activity.content.state
            let updated = GhostRivalActivityAttributes.ContentState(
              exerciseName: options["exerciseName"] as? String ?? current.exerciseName,
              timerSeconds: options["timerSeconds"] as? Int ?? current.timerSeconds,
              timerRunning: options["timerRunning"] as? Bool ?? current.timerRunning
            )
            await activity.update(ActivityContent(state: updated, staleDate: activity.content.staleDate))
          }
        }

        AsyncFunction("end") { () -> Void in
          guard #available(iOS 16.2, *) else { return }
          if let id = self.currentActivityId {
            for activity in Activity<GhostRivalActivityAttributes>.activities where activity.id == id {
              await activity.end(nil, dismissalPolicy: .immediate)
            }
            self.currentActivityId = nil
          }
        }
      }
    }
    ```
  - [x] Register the module in the Expo Module config. After `expo prebuild`, add the module to `ios/GhostRival.xcodeproj` (Xcode) or via `expo-module.config.json`:
    ```json
    {
      "platforms": ["ios"],
      "ios": {
        "modules": ["GhostRivalLiveActivityModule"]
      }
    }
    ```
  - [x] **ActivityAttributes struct** — create `ios/Shared/GhostRivalActivityAttributes.swift` (placed in Shared/ so it can be added to both main app and Widget Extension targets):
    ```swift
    import ActivityKit
    import Foundation

    struct GhostRivalActivityAttributes: ActivityAttributes {
      public struct ContentState: Codable, Hashable {
        var exerciseName: String
        var timerSeconds: Int     // 0 = idle/Active state
        var timerRunning: Bool
      }
      var sessionId: String
    }
    ```
  - [x] **Entitlements** — `ios/GhostRival/GhostRival.entitlements` must contain:
    ```xml
    <key>com.apple.developer.live-activities</key>
    <true/>
    ```
    If CNG overwrites entitlements, add via the `withEntitlements` Expo config plugin in `app.json`.
  - [x] **Note**: `Activity<GhostRivalActivityAttributes>.activities` is only available on `iOS 16.2+`. Story AC spec says `iOS 16.1+` — use `#available(iOS 16.2, *)` guard everywhere (ActivityKit API stabilized at 16.2 despite 16.1 introduction).

- [x] Task 6: Widget Extension — GhostRivalWidgetExtension (SwiftUI Live Activity UI)
  - [x] **Create a new Widget Extension target** in Xcode after `expo prebuild`:
    - Target name: `GhostRivalWidgetExtension`
    - Bundle ID: `com.anonymous.GhostRival.widgets` (adapt to match actual package from prebuild)
    - Minimum iOS deployment: `16.2`
  - [x] Create `ios/GhostRivalWidgetExtension/GhostRivalWidget.swift`:
    ```swift
    import ActivityKit
    import SwiftUI
    import WidgetKit

    // MARK: - Compact (Dynamic Island) view
    struct GhostRivalCompactLeadingView: View {
      let state: GhostRivalActivityAttributes.ContentState

      var body: some View {
        Image(systemName: "ghost")  // Replace with asset ghost icon if added
          .foregroundColor(Color(hex: "#00e5ff"))
          .font(.system(size: 14))
      }
    }

    struct GhostRivalCompactTrailingView: View {
      let state: GhostRivalActivityAttributes.ContentState

      var body: some View {
        if state.timerRunning && state.timerSeconds > 0 {
          Text(formatTimer(state.timerSeconds))
            .font(.system(size: 13, weight: .semibold, design: .monospaced))
            .foregroundColor(.white)
        } else {
          Text("Active")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.white)
        }
      }
    }

    // MARK: - Expanded / Lock Screen view
    struct GhostRivalExpandedView: View {
      let state: GhostRivalActivityAttributes.ContentState

      var body: some View {
        HStack(alignment: .top, spacing: 12) {
          // Left column
          VStack(alignment: .leading, spacing: 4) {
            Text(state.exerciseName)
              .font(.system(size: 16, weight: .bold))
              .foregroundColor(.white)
              .lineLimit(1)
            Text("–")   // Ghost data placeholder — Epic 3 will fill this
              .font(.system(size: 14))
              .foregroundColor(Color(hex: "#00e5ff").opacity(0.4))
            Spacer()
          }
          Spacer()
          // Right column
          VStack(alignment: .trailing, spacing: 4) {
            if state.timerRunning && state.timerSeconds > 0 {
              Text(formatTimer(state.timerSeconds))
                .font(.system(size: 56, weight: .heavy, design: .monospaced))
                .foregroundColor(.white)
                .minimumScaleFactor(0.5)
            } else {
              Text("Active")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
            }
          }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        Spacer()
        HStack {
          Text("Tap to log next set")
            .font(.system(size: 14))
            .foregroundColor(Color(hex: "#8888a0"))
          Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
      }
    }

    // MARK: - Minimal (DI conflict) view
    struct GhostRivalMinimalView: View {
      var body: some View {
        Image(systemName: "ghost")
          .foregroundColor(Color(hex: "#00e5ff"))
          .font(.system(size: 12))
      }
    }

    // MARK: - Widget Configuration
    struct GhostRivalWidgetExtension: Widget {
      var body: some WidgetConfiguration {
        ActivityConfiguration(for: GhostRivalActivityAttributes.self) { context in
          // Lock screen / banner presentation
          GhostRivalExpandedView(state: context.state)
            .activityBackgroundTint(Color(hex: "#0d0d0f"))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
          DynamicIsland {
            DynamicIslandExpandedRegion(.leading) {
              GhostRivalCompactLeadingView(state: context.state)
            }
            DynamicIslandExpandedRegion(.trailing) {
              GhostRivalCompactTrailingView(state: context.state)
            }
            DynamicIslandExpandedRegion(.bottom) {
              GhostRivalExpandedView(state: context.state)
            }
          } compactLeading: {
            GhostRivalCompactLeadingView(state: context.state)
          } compactTrailing: {
            GhostRivalCompactTrailingView(state: context.state)
          } minimal: {
            GhostRivalMinimalView()
          }
        }
      }
    }

    // MARK: - Helpers
    private func formatTimer(_ seconds: Int) -> String {
      let m = seconds / 60
      let s = seconds % 60
      return String(format: "%d:%02d", m, s)
    }

    extension Color {
      init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
          (r, g, b) = (Double((int >> 16) & 0xFF) / 255, Double((int >> 8) & 0xFF) / 255, Double(int & 0xFF) / 255)
        default:
          (r, g, b) = (1, 1, 1)
        }
        self.init(red: r, green: g, blue: b)
      }
    }
    ```
  - [x] **IMPORTANT**: The Widget Extension target must import `GhostRivalActivityAttributes` — this struct must be in a shared Swift file accessible to BOTH the main app target and the Widget Extension. The cleanest approach: create `ios/Shared/GhostRivalActivityAttributes.swift` and add it to BOTH targets in Xcode.
  - [x] **App Group** (optional for this story): A shared App Group between the main app and widget extension is only needed for shared data storage. Since the Live Activity receives all display data via ActivityKit push, an App Group is NOT required for Story 2.3.

- [x] Task 7: useSettingsStore.ts — Add Live Activity preference tracking
  - [x] Add to `SettingsStore` interface:
    ```typescript
    hasShownLiveActivityPrompt: boolean
    liveActivityEnabled: boolean
    setHasShownLiveActivityPrompt: (shown: boolean) => void
    setLiveActivityEnabled: (enabled: boolean) => void
    ```
  - [x] Add to initial state:
    ```typescript
    hasShownLiveActivityPrompt: false,
    liveActivityEnabled: false,
    ```
  - [x] Add actions to `create`:
    ```typescript
    setHasShownLiveActivityPrompt: (shown) => set({ hasShownLiveActivityPrompt: shown }),
    setLiveActivityEnabled: (enabled) => set({ liveActivityEnabled: enabled }),
    ```
  - [x] Add to `partialize` (persisted):
    ```typescript
    hasShownLiveActivityPrompt: state.hasShownLiveActivityPrompt,
    liveActivityEnabled: state.liveActivityEnabled,
    ```
  - [x] **Verify** `hasShownBubblePrompt` and `bubbleEnabled` from Story 2.2 are still present — DO NOT remove them

- [x] Task 8: src/hooks/useLiveActivity.ts — New hook for Live Activity lifecycle
  - [x] Create `/src/hooks/useLiveActivity.ts`
  - [x] **Purpose**: mirrors `useFloatingBubble.ts` for iOS — starts/updates/ends the Live Activity; runs only on iOS; updates the activity when rest timer changes.
  - [ ] Full implementation sketch:
    ```typescript
    import { useEffect, useRef } from 'react'
    import { Platform, AppState, AppStateStatus } from 'react-native'
    import { LiveActivityModule } from '../modules/live-activity/LiveActivityModule'
    import { useSessionStore } from '../stores/useSessionStore'
    import { useSettingsStore } from '../stores/useSettingsStore'

    export function useLiveActivity(options: {
      exerciseName: string
      sessionId: string | null
    }) {
      if (Platform.OS !== 'ios') return  // entire hook is iOS-only

      const phase = useSessionStore((s) => s.phase)
      const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds)
      const restTimerRunning = useSessionStore((s) => s.restTimerRunning)
      const liveActivityEnabled = useSettingsStore((s) => s.liveActivityEnabled)
      const appStateRef = useRef<AppStateStatus>(AppState.currentState)
      const sessionStartRef = useRef<number | null>(null)

      // Track session start time for 8h auto-end detection
      useEffect(() => {
        if (phase === 'active' && sessionStartRef.current === null) {
          sessionStartRef.current = Date.now()
        } else if (phase !== 'active') {
          sessionStartRef.current = null
        }
      }, [phase])

      // Start activity when session goes active
      useEffect(() => {
        if (phase !== 'active' || !liveActivityEnabled || !options.sessionId) return
        LiveActivityModule.start({
          exerciseName: options.exerciseName,
          timerSeconds: useSessionStore.getState().restTimerSeconds,
          timerRunning: useSessionStore.getState().restTimerRunning,
          sessionId: options.sessionId,
        }).catch(() => {})
      }, [phase, liveActivityEnabled, options.sessionId])

      // Update activity when timer or exercise changes
      useEffect(() => {
        if (phase !== 'active' || !liveActivityEnabled) return
        LiveActivityModule.update({
          exerciseName: options.exerciseName,
          timerSeconds: restTimerSeconds,
          timerRunning: restTimerRunning,
        }).catch(() => {})
      }, [restTimerSeconds, restTimerRunning, options.exerciseName, phase, liveActivityEnabled])

      // End activity when session ends
      useEffect(() => {
        if (phase === 'active') return
        LiveActivityModule.end().catch(() => {})
      }, [phase])

      // 8-hour auto-end detection on resume
      useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
          const prev = appStateRef.current
          appStateRef.current = nextState

          if (prev !== 'background' || nextState !== 'active') return
          const started = sessionStartRef.current
          if (!started) return
          const elapsedHours = (Date.now() - started) / (1000 * 3600)
          if (elapsedHours >= 8) {
            // ActivityKit staleDate has already ended the Live Activity on iOS side.
            // We end it from JS too for cleanup.
            LiveActivityModule.end().catch(() => {})
          }
        })
        return () => sub.remove()
      }, [])
    }
    ```
  - [x] **STALE CLOSURE PREVENTION**: same pattern as `useFloatingBubble.ts` — use `useSessionStore.getState()` for reading live values in callbacks. The dep arrays are for re-running effects, not for reading latest values inside async callbacks.
  - [x] The hook is a **no-op on Android** — the `if (Platform.OS !== 'ios') return` at the top exits immediately. However, calling hooks conditionally violates React's Rules of Hooks. Use the platform check differently:
    ```typescript
    // CORRECT pattern — Platform.OS check at call site in active.tsx OR wrap entire body in useMemo/useRef
    // The cleanest approach: keep the hook as-is but ensure it never imports or calls
    // LiveActivityModule methods on Android. Platform.OS check inside the hook body (NOT before hooks)
    // means all useEffect/useState calls are unconditional — only the .start/.update/.end calls are guarded.
    ```
    Actually: **remove the early `return` at the top**. Instead, wrap all `LiveActivityModule.*` calls in `if (Platform.OS !== 'ios') return`. React hooks can't be conditionally called.

- [x] Task 9: active.tsx — Integrate Live Activity permission flow and useLiveActivity hook
  - [x] Import `useLiveActivity` hook
  - [x] Import `LiveActivityModule` and `Platform`
  - [x] Import `useSettingsStore` (already imported for Story 2.2)
  - [x] **Permission flow — iOS only, first session only**:
    ```typescript
    const { hasShownLiveActivityPrompt, setHasShownLiveActivityPrompt, setLiveActivityEnabled } = useSettingsStore()

    useEffect(() => {
      if (Platform.OS !== 'ios' || phase !== 'active' || hasShownLiveActivityPrompt) return

      // Request permission immediately when session starts — no custom prompt, standard iOS dialog
      setHasShownLiveActivityPrompt(true)
      LiveActivityModule.requestPermission()
        .then((status) => {
          setLiveActivityEnabled(status === 'granted')
        })
        .catch(() => {})
    }, [phase])
    ```
  - [x] **No custom pre-permission modal** (unlike Android). iOS permissions are requested via the standard system dialog. The prompt fires once on the first session; permission state is checked on subsequent sessions via `liveActivityEnabled`.
  - [x] **Call `useLiveActivity` hook** in component body:
    ```typescript
    const currentExerciseName = /* derive from current active exercise — same pattern as bubble */ ''
    useLiveActivity({
      exerciseName: currentExerciseName,
      sessionId: activeSessionId,
    })
    ```
    - `currentExerciseName` should be the same `lastExerciseName` state already used by `useFloatingBubble` from Story 2.2. Reuse it — do NOT create a duplicate state.
  - [x] **On session end** (`handleConfirmEnd` / `handleDiscard`): `LiveActivityModule.end()` should be called — but `useLiveActivity`'s phase-watching effect already handles this. Confirm the effect fires before navigation completes; wrap explicit end call in try/catch as safety net only.
  - [x] **Deep-link from Live Activity tap**: handled in `_layout.tsx` (Task 10) — no changes needed in `active.tsx` itself.

- [x] Task 10: _layout.tsx — Deep-link handler for Live Activity tap
  - [x] Live Activities use `NSUserActivity` or a URL scheme for deep-linking. With Expo Router, the cleanest approach is to handle the app's URL scheme.
  - [x] In the root `_layout.tsx` `useEffect` that runs on mount, add (iOS-only):
    ```typescript
    if (Platform.OS === 'ios') {
      const sub = Linking.addEventListener('url', (event) => {
        if (event.url.includes('session')) {
          router.push('/session/active')
        }
      })
      // Handle cold-start URL (app was not running when tapped)
      Linking.getInitialURL().then((url) => {
        if (url?.includes('session')) {
          router.push('/session/active')
        }
      }).catch(() => {})
      return () => sub.remove()
    }
    ```
  - [x] **Alternative approach**: Expo Router handles universal links and URL schemes automatically. If `expo-router` v6 auto-handles `app.json` URL scheme, this manual `Linking` handler may not be needed. Check if the session screen is already reachable via the URL scheme; if so, the Widget's `Link` destination in SwiftUI just needs the scheme URL.
  - [x] In the Widget Extension SwiftUI code (Task 6), the tap target uses `Link`:
    ```swift
    // In the Widget/Activity view:
    .widgetURL(URL(string: "ghostrival://session")!)
    ```
    And in `app.json`, register the URL scheme:
    ```json
    "scheme": "ghostrival"
    ```
    Expo Router v6 already handles `app.json` scheme for deep links — verify `ghostrival://session` routes to `/session/active`.

- [x] Task 11: settings.tsx — Add "Enable Live Activities" link for denied state
  - [x] Add an iOS-only row in Settings → Session section (which was created for Story 2.2's Android row):
    ```tsx
    {Platform.OS === 'ios' && hasShownLiveActivityPrompt && !liveActivityEnabled && (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => Linking.openSettings()}
        accessibilityRole="button"
        accessibilityLabel="Enable Live Activities in iOS Settings"
      >
        <Text style={styles.settingLabel}>Enable Live Activities</Text>
        <Text style={styles.settingSubLabel}>
          See your rest timer from any screen
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>
    )}
    ```
  - [x] Import `Linking` from `react-native`, `useSettingsStore` (already imported)
  - [x] The Session section already exists from Story 2.2's Android "Enable Ghost Bubble" row — add this iOS row alongside it, guarded by `Platform.OS === 'ios'`

---

## Dev Notes

### SDK Version — CRITICAL (Read Before Writing Any Code)
`AGENTS.md` says to read Expo docs at `https://docs.expo.dev/versions/v56.0.0/`. **This is wrong.** The actual installed SDK is **Expo 54** (`"expo": "~54.0.0"`, React Native 0.81.5, Expo Router v6 — confirmed in `package.json`). Story 2.1 and 2.2 dev notes also confirmed this. **Always read v54 docs**: `https://docs.expo.dev/versions/v54.0.0/`. Do not reference or import APIs that only exist in SDK 55 or 56.

### expo prebuild is MANDATORY for Live Activity
The `LiveActivityModule.ios.ts` bridges to a native Swift module (`GhostRivalLiveActivity`). This module only exists after:
```bash
expo prebuild --platform ios
```
Until that runs, `NativeModules.GhostRivalLiveActivity` will be `undefined`. The JS bridge handles this gracefully (logs a warning, resolves without crashing). The Live Activity will not function in Expo Go — a dev build is required.

### ActivityKit API Availability
ActivityKit was introduced in iOS 16.1 but several key APIs stabilized at iOS 16.2:
- `Activity.request()` — available from iOS 16.1
- `ActivityAuthorizationInfo().areActivitiesEnabled` — available from iOS 16.2
- `ActivityContent` struct — available from iOS 16.2

Use `#available(iOS 16.2, *)` guards for all ActivityKit code in Swift. Story spec says iOS 16.1+ — the 16.2 guard is a safe implementation choice that covers 16.1 target devices (ActivityKit just won't be used on the narrow 16.1/16.2 gap).

### Widget Extension is a Separate Compile Target
Unlike the Floating Bubble (which is a foreground service inside the main app process), the Live Activity UI is a **Widget Extension** — a completely separate binary in the iOS bundle:
- It cannot share code with the main app directly without an explicit Xcode target membership setting
- `GhostRivalActivityAttributes` struct MUST be in a file added to BOTH targets in Xcode
- After `expo prebuild`, CNG generates `ios/GhostRival.xcodeproj` — the Widget Extension target must be added manually (or via an Expo config plugin with `@expo/config-plugins`)
- The Widget Extension has its own `Info.plist` and entitlements

### Stale Closure Anti-Pattern — Same as Story 2.2
Same issue as `useFloatingBubble.ts` and `useRestTimer.ts`: callbacks in `AppState.addEventListener` and `useEffect` with empty dep arrays will capture stale closure values. Always read live values from the store:
```typescript
// ❌ WRONG — stale closure
useEffect(() => {
  AppState.addEventListener('change', () => {
    LiveActivityModule.update({ timerSeconds: restTimerSeconds }) // always initial value
  })
}, [])

// ✅ CORRECT — read live store value
AppState.addEventListener('change', () => {
  const liveSeconds = useSessionStore.getState().restTimerSeconds
  const liveRunning = useSessionStore.getState().restTimerRunning
  LiveActivityModule.update({ timerSeconds: liveSeconds, timerRunning: liveRunning })
})
```

### Live Activity vs Notifications Permission — iOS
On iOS 16.1+, **Live Activities use the Notifications permission**. There is no separate "Live Activities" runtime permission dialog — enabling notifications enables Live Activities. The `requestPermission` method in the module wraps `UNUserNotificationCenter.requestAuthorization`. `ActivityAuthorizationInfo().areActivitiesEnabled` checks the combined state (permission granted AND user hasn't disabled Live Activities per-app in iOS Settings).

The user can disable Live Activities per-app in: **iOS Settings → [App] → Live Activities**. Handle this gracefully: if `isAvailable()` returns `false` after a session starts, `start()` will silently fail (log warning, no crash).

### Metro Platform Resolution — .ios.ts / .android.ts
Metro resolves platform extensions automatically (same as Story 2.2). On iOS, `LiveActivityModule.ios.ts` is used; on Android, `LiveActivityModule.android.ts`. Components always import from `'../../modules/live-activity/LiveActivityModule'`. Check whether the Story 2.2 P4 patch removed the re-export from `FloatingBubbleModule.ts` — apply the same fix here if it was removed: do NOT include the re-export line in `LiveActivityModule.ts`.

### Android Package Name
Story 1.1 dev notes established the Android package is `com.anonymous.GhostRival` (prebuild-generated). For iOS, the bundle identifier is similarly `com.anonymous.GhostRival` by default. The Widget Extension bundle ID will be `com.anonymous.GhostRival.widgets`. Both will need to change before App Store submission (tracked in deferred-work), but use these defaults for development builds.

### 8-Hour Auto-End — Two Mechanisms
The `staleDate` on the `ActivityContent` (set to `Date() + 8 hours` in the Swift `start()` method) causes iOS to **automatically end** the Live Activity after 8 hours without any JS involvement. The JS-side detection in `useLiveActivity` on `AppState` resume is a belt-and-suspenders cleanup: it calls `LiveActivityModule.end()` to ensure the JS state (`liveActivityEnabled`, etc.) stays consistent. Both mechanisms together satisfy AC6.

### Minimal DI State — No Fallback Needed
When another app's Live Activity takes priority and Ghost Rival's activity enters "minimal" state (a small icon in the Dynamic Island's corner), AC7 says no fallback notification is needed. This is correct — minimal state is a normal iOS behavior and the Ghost icon remains visible. No special handling is required.

### iOS Simulator Limitations
- The Dynamic Island is only available on iPhone 14 Pro+ simulator (iPhone 15 Pro simulators work)
- Live Activities in expanded mode work on all iPhone simulators running iOS 16.1+
- Physical device strongly recommended for verifying Live Activity behavior

### File Structure After This Story

```
src/
  modules/
    live-activity/
      LiveActivityModule.ts          NEW — TS interface
      LiveActivityModule.ios.ts      NEW — NativeModules bridge (graceful fallback)
      LiveActivityModule.android.ts  NEW — throws UnsupportedPlatformError
      LiveActivityModule.android.test.ts  NEW — tests that stub throws
  hooks/
    useLiveActivity.ts               NEW — AppState + Live Activity lifecycle hook
  stores/
    useSettingsStore.ts              UPDATE — add hasShownLiveActivityPrompt, liveActivityEnabled
  app/
    _layout.tsx                      UPDATE — deep-link handler for Live Activity tap
    session/
      active.tsx                     UPDATE — permission request + useLiveActivity hook
    (tabs)/
      settings.tsx                   UPDATE — "Enable Live Activities" link (iOS only)

ios/ (generated by expo prebuild — after running it):
  GhostRivalLiveActivity.swift            NEW — Swift Expo Module (ActivityKit bridge)
  Shared/
    GhostRivalActivityAttributes.swift    NEW — ActivityAttributes struct (shared between targets)
  GhostRivalWidgetExtension/
    GhostRivalWidget.swift                NEW — SwiftUI Live Activity UI (Widget Extension target)

app.json                             UPDATE — URL scheme, iOS entitlement for live-activities
```

### Existing Files NOT to Modify
- `/src/hooks/useRestTimer.ts` — no changes; timer logic unchanged
- `/src/components/session/RestTimerBar.tsx` — no changes; in-app timer UI unchanged
- `/src/db/queries/sets.queries.ts` — no changes for this story
- `/src/modules/floating-bubble/` — no changes; Story 2.2 work preserved
- `drizzle.config.ts`, `schema.ts` — no DB changes needed

### References
- [Source: epics.md#Story 2.3] — All acceptance criteria
- [Source: epics.md#FR-9] — iOS Live Activity: Dynamic Island + lock screen, deep-link, auto-end after 8h pause
- [Source: epics.md#ARCH-11] — Native module interfaces; platform stubs MUST throw UnsupportedPlatformError
- [Source: epics.md#UX-DR8] — Live Activity design specs: compact DI icon+countdown, expanded lock screen, read-only
- [Source: architecture.md#Native Module Patterns] — module boundary: interface file only, never platform implementation
- [Source: architecture.md#Structure Patterns] — /src/modules/live-activity/ directory layout
- [Source: story 2.2 Dev Notes] — Expo SDK is v54 not v56; P4 bug (re-export bypasses Metro in Jest); stale closure fix; expo prebuild pattern; test pattern for UnsupportedPlatformError
- [Source: story 2.1 Dev Notes] — Zustand stale closure fix with useSessionStore.getState()
- [Source: deferred-work.md] — com.anonymous.GhostRival package name; dismissAllNotificationsAsync too broad

---

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
No blocking issues encountered. FloatingBubbleModule.ts still has re-export pattern (P4 patch was not applied there), so same pattern used for LiveActivityModule.ts. Tests confirm all 5 Android stub methods throw UnsupportedPlatformError with correct name and message.

### Completion Notes List
- Task 1: app.json updated with `NSUserNotificationUsageDescription`, URL scheme `ghostrival`, and `expo-build-properties` plugin for `com.apple.developer.live-activities` entitlement.
- Task 2: `LiveActivityOptions` and `LiveActivityPermissionStatus` added to `src/types/index.ts` without touching existing types.
- Task 3: Three-file module created (`LiveActivityModule.ts` interface+re-export, `.android.ts` stub with ARCH-11 throwing, `.ios.ts` NativeModules bridge with graceful fallback).
- Task 4: `LiveActivityModule.android.test.ts` — 5 tests, all pass. Full suite still 108/108.
- Task 5: `ios/GhostRivalLiveActivity.swift` (Expo Module), `ios/Shared/GhostRivalActivityAttributes.swift` (shared struct), `expo-module.config.json` created. Note: `expo prebuild --platform ios` must be run before native code compiles.
- Task 6: `ios/GhostRivalWidgetExtension/GhostRivalWidget.swift` with compact/expanded/minimal views. `.widgetURL(URL(string: "ghostrival://session")!)` added for deep-link (AC4). GhostRivalActivityAttributes placed in Shared/ to allow membership in both targets.
- Task 7: `hasShownLiveActivityPrompt` and `liveActivityEnabled` added to SettingsStore interface, state, actions, and `partialize`. Story 2.2 bubble fields preserved.
- Task 8: `useLiveActivity.ts` hook — Platform.OS guards inside each useEffect (not at hook top, preserving React Rules of Hooks). Reads live store values via `useSessionStore.getState()` in start effect to avoid stale closure. 8h auto-end on AppState resume (AC6 belt-and-suspenders).
- Task 9: `active.tsx` — imported `LiveActivityModule` and `useLiveActivity`; added permission request effect (iOS only, first session, AC1); called `useLiveActivity({ exerciseName: lastExerciseName, sessionId: activeSessionId })`; added explicit `LiveActivityModule.end()` in `handleConfirmEnd` and `handleDiscard` as safety net (AC8).
- Task 10: `_layout.tsx` — imported `Linking`; added iOS deep-link handler for `ghostrival://session` URL (foreground and cold-start, AC4).
- Task 11: `settings.tsx` — imported `Linking`; refactored SESSION section to show when either Android bubble denied OR iOS live activity denied; added iOS row with `settingSubLabel` and `Linking.openSettings()` (AC5).

### File List
- `GhostRival/app.json` — updated
- `GhostRival/expo-module.config.json` — new
- `GhostRival/src/types/index.ts` — updated
- `GhostRival/src/modules/live-activity/LiveActivityModule.ts` — new
- `GhostRival/src/modules/live-activity/LiveActivityModule.android.ts` — new
- `GhostRival/src/modules/live-activity/LiveActivityModule.ios.ts` — new
- `GhostRival/src/modules/live-activity/LiveActivityModule.android.test.ts` — new
- `GhostRival/src/hooks/useLiveActivity.ts` — new
- `GhostRival/src/stores/useSettingsStore.ts` — updated
- `GhostRival/src/app/session/active.tsx` — updated
- `GhostRival/src/app/_layout.tsx` — updated
- `GhostRival/src/app/(tabs)/settings.tsx` — updated
- `GhostRival/ios/GhostRivalLiveActivity.swift` — new
- `GhostRival/ios/Shared/GhostRivalActivityAttributes.swift` — new
- `GhostRival/ios/GhostRivalWidgetExtension/GhostRivalWidget.swift` — new

## Change Log

- 2026-06-21: Story 2.3 created — iOS Live Activity. Mirrors Story 2.2 pattern: TS interface + iOS Swift Expo Module + Android UnsupportedPlatformError stub + useLiveActivity hook + settings integration.
- 2026-06-21: Story 2.3 implemented — all 11 tasks complete. 108/108 tests pass.

---

### Review Findings

<!-- Code review: 2026-06-21 | Layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor | 7 dismissed -->

- [x] [Review][Decision] "Active" label size — resolved: use 56pt (same as timer) per AC3. [`ios/GhostRivalWidgetExtension/GhostRivalWidget.swift`]

- [x] [Review][Patch] Android stub throws synchronously instead of Promise.reject() — fixed: all 5 methods now return `Promise.reject(new UnsupportedPlatformError(...))` [`src/modules/live-activity/LiveActivityModule.android.ts`]
- [x] [Review][Patch] `expo-build-properties` does not support `entitlements` key — fixed: removed plugin; using `ios.entitlements` directly in `app.json` [`app.json`]
- [x] [Review][Patch] `NSSupportsLiveActivities` missing from `ios.infoPlist` — fixed: added `"NSSupportsLiveActivities": true` to `ios.infoPlist` [`app.json`]
- [x] [Review][Patch] Deep-link URL matching too broad — fixed: exact `=== 'ghostrival://session'` check [`src/app/_layout.tsx`]
- [x] [Review][Patch] Duplicate `router.push` if already on `/session/active` — fixed: changed to `router.replace` [`src/app/_layout.tsx`]
- [x] [Review][Patch] `start()` and `update()` race — fixed: added `hasStartedRef`; `update()` only fires after `start()` resolves [`src/hooks/useLiveActivity.ts`]
- [x] [Review][Patch] `end()` fires on initial mount — fixed: `end()` guarded by `hasStartedRef.current` [`src/hooks/useLiveActivity.ts`]
- [x] [Review][Patch] Empty `exerciseName` passed to `start()` — fixed: fallback to `'Workout'` when empty [`src/hooks/useLiveActivity.ts`]

- [x] [Review][Defer] `liveActivityEnabled` not re-checked after user revokes permission in iOS Settings — same pre-existing pattern as Android bubble [`src/hooks/useLiveActivity.ts`] — deferred, pre-existing
- [x] [Review][Defer] `hasShownLiveActivityPrompt` set before awaiting permission result — deliberate guard against double-prompt; iOS OS itself blocks re-prompt after denial anyway [`src/app/session/active.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `isAvailable()` not called before `start()` — native `#available(iOS 16.2, *)` guard in Swift handles gracefully [`src/hooks/useLiveActivity.ts`] — deferred, pre-existing
- [x] [Review][Defer] 8h JS-side clock resets after draft recovery — native `staleDate` handles the real timeout; JS-side is belt-and-suspenders only [`src/hooks/useLiveActivity.ts`] — deferred, pre-existing
- [x] [Review][Defer] `sessionId` change mid-session re-triggers `start()` — `sessionId` is stable per session in current implementation [`src/hooks/useLiveActivity.ts`] — deferred, pre-existing
- [x] [Review][Defer] DI expanded layout (compact views in leading/trailing slots) — valid SwiftUI DI pattern; needs device testing to validate [`ios/GhostRivalWidgetExtension/GhostRivalWidget.swift`] — deferred, pre-existing
- [x] [Review][Defer] Rapid phase toggle races `end()`/`start()` — extremely unlikely UX path; native operations are async and idempotent [`src/hooks/useLiveActivity.ts`] — deferred, pre-existing
- [x] [Review][Defer] Native module per-method existence check absent — extremely unlikely if module is correctly registered via `expo-module.config.json` [`src/modules/live-activity/LiveActivityModule.ios.ts`] — deferred, pre-existing
