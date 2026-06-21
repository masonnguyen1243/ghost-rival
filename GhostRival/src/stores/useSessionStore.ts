import { create } from 'zustand'
import type { SessionPhase } from '../types'

interface SessionStore {
  phase: SessionPhase
  activeSessionId: string | null
  sessionStartedAt: number | null
  currentExerciseId: string | null
  sessionExerciseIds: string[]
  restTimerSeconds: number
  restTimerRunning: boolean
  restTimerTotalSeconds: number
  restTimerFlashing: boolean
  prExplosionPending: { exerciseId: string; prData: unknown } | null
  bubbleMode: 'bubble' | 'notification' | 'none'
  setPhase: (phase: SessionPhase) => void
  setActiveSessionId: (id: string | null) => void
  setCurrentExerciseId: (id: string | null) => void
  addExerciseToSession: (id: string) => void
  setRestTimerSeconds: (seconds: number) => void
  setRestTimerRunning: (running: boolean) => void
  setRestTimerTotalSeconds: (seconds: number) => void
  setRestTimerFlashing: (flashing: boolean) => void
  setPrExplosionPending: (data: { exerciseId: string; prData: unknown } | null) => void
  setBubbleMode: (mode: 'bubble' | 'notification' | 'none') => void
  reset: () => void
}

const initialState = {
  phase: 'idle' as SessionPhase,
  activeSessionId: null,
  sessionStartedAt: null,
  currentExerciseId: null,
  sessionExerciseIds: [] as string[],
  restTimerSeconds: 0,
  restTimerRunning: false,
  restTimerTotalSeconds: 0,
  restTimerFlashing: false,
  prExplosionPending: null,
  bubbleMode: 'none' as 'bubble' | 'notification' | 'none',
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setCurrentExerciseId: (id) => set({ currentExerciseId: id }),
  addExerciseToSession: (id) =>
    set((state) => ({
      sessionExerciseIds: state.sessionExerciseIds.includes(id)
        ? state.sessionExerciseIds
        : [...state.sessionExerciseIds, id],
    })),
  setRestTimerSeconds: (seconds) => set({ restTimerSeconds: seconds }),
  setRestTimerRunning: (running) => set({ restTimerRunning: running }),
  setRestTimerTotalSeconds: (seconds) => set({ restTimerTotalSeconds: seconds }),
  setRestTimerFlashing: (flashing) => set({ restTimerFlashing: flashing }),
  setPrExplosionPending: (data) => set({ prExplosionPending: data }),
  setBubbleMode: (mode) => set({ bubbleMode: mode }),
  reset: () => set(initialState),
}))
