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

// Metro resolves .android.ts / .ios.ts before this barrel at bundle time.
// The re-export below satisfies TypeScript; Metro replaces it with the platform file at runtime.
export { LiveActivityModule } from './LiveActivityModule.android'
