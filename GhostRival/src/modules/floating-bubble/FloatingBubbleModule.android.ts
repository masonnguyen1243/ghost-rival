import { NativeModules, NativeEventEmitter, Linking } from 'react-native'
import { BUBBLE_SLA_MS } from '../../constants'
import type { IFloatingBubbleModule } from './FloatingBubbleModule'
import type { BubbleOptions, BubblePermissionStatus, SetPrefill } from '../../types'

// Bridges to the native GhostRivalFloatingBubble Expo Module.
// The native module only exists after `npx expo prebuild --platform android`.
// In Expo Go or before prebuild, all methods log a warning and resolve without crashing.

const { GhostRivalFloatingBubble } = NativeModules

const getModule = () => {
  if (!GhostRivalFloatingBubble) {
    console.warn('[FloatingBubble] Native module not available — run expo prebuild first')
    return null
  }
  return GhostRivalFloatingBubble
}

const emitter = GhostRivalFloatingBubble
  ? new NativeEventEmitter(GhostRivalFloatingBubble)
  : null

export const FloatingBubbleModule: IFloatingBubbleModule = {
  checkPermission: async (): Promise<BubblePermissionStatus> => {
    const mod = getModule()
    if (!mod) return 'not_determined'
    return mod.checkPermission()
  },

  openPermissionSettings: async (): Promise<void> => {
    const mod = getModule()
    if (!mod) {
      Linking.openSettings()
      return
    }
    return mod.openPermissionSettings()
  },

  show: async (options: BubbleOptions): Promise<void> => {
    const mod = getModule()
    if (!mod) return
    return mod.show(options)
  },

  hide: async (): Promise<void> => {
    const mod = getModule()
    if (!mod) return
    return mod.hide()
  },

  updateState: async (options: Partial<BubbleOptions>): Promise<void> => {
    const mod = getModule()
    if (!mod) return
    const start = Date.now()
    const result = await mod.updateState(options)
    const elapsed = Date.now() - start
    if (elapsed > BUBBLE_SLA_MS) {
      console.warn(`[FloatingBubble] updateState SLA exceeded: ${elapsed}ms (limit: ${BUBBLE_SLA_MS}ms)`)
    }
    return result
  },

  onTap: (callback: (prefill: SetPrefill) => void): (() => void) => {
    if (!emitter) return () => {}
    const sub = emitter.addListener('FloatingBubbleTap', callback)
    return () => sub.remove()
  },

  onLongPressConfirm: (callback: (prefill: SetPrefill) => void): (() => void) => {
    if (!emitter) return () => {}
    const sub = emitter.addListener('FloatingBubbleLongPressConfirm', callback)
    return () => sub.remove()
  },

  onPermissionRevoked: (callback: () => void): (() => void) => {
    if (!emitter) return () => {}
    const sub = emitter.addListener('FloatingBubblePermissionRevoked', callback)
    return () => sub.remove()
  },

  onSkipRest: (callback: () => void): (() => void) => {
    if (!emitter) return () => {}
    const sub = emitter.addListener('FloatingBubbleSkipRest', callback)
    return () => sub.remove()
  },

  onExtendRest: (callback: (seconds: number) => void): (() => void) => {
    if (!emitter) return () => {}
    const sub = emitter.addListener('FloatingBubbleExtendRest', (data: { seconds: number }) => {
      if (typeof data?.seconds === 'number') callback(data.seconds)
    })
    return () => sub.remove()
  },
}
