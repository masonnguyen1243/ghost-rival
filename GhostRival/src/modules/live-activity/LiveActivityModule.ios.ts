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
