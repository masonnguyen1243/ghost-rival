import type { BubbleOptions, BubblePermissionStatus, SetPrefill } from '../../types'

export interface IFloatingBubbleModule {
  /** Check SYSTEM_ALERT_WINDOW permission status */
  checkPermission(): Promise<BubblePermissionStatus>
  /** Open Android system settings for Draw Over Other Apps */
  openPermissionSettings(): Promise<void>
  /** Show or update the floating bubble. Idempotent if already visible. */
  show(options: BubbleOptions): Promise<void>
  /** Hide the floating bubble. Idempotent if already hidden. */
  hide(): Promise<void>
  /** Update bubble state without recreating the view (≤200ms SLA path) */
  updateState(options: Partial<BubbleOptions>): Promise<void>
  /** Register callback for tap events. Returns unsubscribe function. */
  onTap(callback: (prefill: SetPrefill) => void): () => void
  /** Register callback for long-press → confirm from edit sheet. Returns unsubscribe. */
  onLongPressConfirm(callback: (prefill: SetPrefill) => void): () => void
  /** Register callback for permission revocation detected mid-session. Returns unsubscribe. */
  onPermissionRevoked(callback: () => void): () => void
}

// Platform-specific implementations are imported by the module resolution:
// FloatingBubbleModule.android.ts — Android WindowManager + ForegroundService
// FloatingBubbleModule.ios.ts     — throws UnsupportedPlatformError

// Metro resolves .android.ts / .ios.ts before this barrel at bundle time.
// The re-export below satisfies TypeScript; Metro replaces it with the platform file at runtime.
export { FloatingBubbleModule } from './FloatingBubbleModule.android'
