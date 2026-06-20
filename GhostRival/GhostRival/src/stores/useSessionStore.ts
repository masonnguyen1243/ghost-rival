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
  prExplosionPending: { exerciseId: string; prData: unknown } | null
  setPhase: (phase: SessionPhase) => void
  setActiveSessionId: (id: string | null) => void
  setCurrentExerciseId: (id: string | null) => void
  addExerciseToSession: (id: string) => void
  setRestTimerSeconds: (seconds: number) => void
  setRestTimerRunning: (running: boolean) => void
  setPrExplosionPending: (data: { exerciseId: string; prData: unknown } | null) => void
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
  prExplosionPending: null,
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
  setPrExplosionPending: (data) => set({ prExplosionPending: data }),
  reset: () => set(initialState),
}))
