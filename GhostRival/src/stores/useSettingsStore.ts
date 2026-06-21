import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_REST_TIMER_SECONDS } from '../constants'

type WeightUnit = 'kg' | 'lb'
type AccountState = 'anonymous' | 'registered' | 'syncing'

interface SettingsStore {
  unit: WeightUnit
  defaultRestTimerSeconds: number
  accountState: AccountState
  hasShownBubblePrompt: boolean
  bubbleEnabled: boolean
  hasShownLiveActivityPrompt: boolean
  liveActivityEnabled: boolean
  setUnit: (unit: WeightUnit) => void
  setDefaultRestTimerSeconds: (seconds: number) => void
  setAccountState: (state: AccountState) => void
  setHasShownBubblePrompt: (shown: boolean) => void
  setBubbleEnabled: (enabled: boolean) => void
  setHasShownLiveActivityPrompt: (shown: boolean) => void
  setLiveActivityEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      unit: 'kg',
      defaultRestTimerSeconds: DEFAULT_REST_TIMER_SECONDS,
      accountState: 'anonymous',
      hasShownBubblePrompt: false,
      bubbleEnabled: false,
      hasShownLiveActivityPrompt: false,
      liveActivityEnabled: false,
      setUnit: (unit) => set({ unit }),
      setDefaultRestTimerSeconds: (seconds) => set({ defaultRestTimerSeconds: seconds }),
      setAccountState: (state) => set({ accountState: state }),
      setHasShownBubblePrompt: (shown) => set({ hasShownBubblePrompt: shown }),
      setBubbleEnabled: (enabled) => set({ bubbleEnabled: enabled }),
      setHasShownLiveActivityPrompt: (shown) => set({ hasShownLiveActivityPrompt: shown }),
      setLiveActivityEnabled: (enabled) => set({ liveActivityEnabled: enabled }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unit: state.unit,
        defaultRestTimerSeconds: state.defaultRestTimerSeconds,
        hasShownBubblePrompt: state.hasShownBubblePrompt,
        bubbleEnabled: state.bubbleEnabled,
        hasShownLiveActivityPrompt: state.hasShownLiveActivityPrompt,
        liveActivityEnabled: state.liveActivityEnabled,
      }),
    }
  )
)
