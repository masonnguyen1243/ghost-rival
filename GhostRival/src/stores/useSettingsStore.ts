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
  setUnit: (unit: WeightUnit) => void
  setDefaultRestTimerSeconds: (seconds: number) => void
  setAccountState: (state: AccountState) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      unit: 'kg',
      defaultRestTimerSeconds: DEFAULT_REST_TIMER_SECONDS,
      accountState: 'anonymous',
      setUnit: (unit) => set({ unit }),
      setDefaultRestTimerSeconds: (seconds) => set({ defaultRestTimerSeconds: seconds }),
      setAccountState: (state) => set({ accountState: state }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unit: state.unit,
        defaultRestTimerSeconds: state.defaultRestTimerSeconds,
      }),
    }
  )
)
