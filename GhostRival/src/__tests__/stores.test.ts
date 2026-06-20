import { useSessionStore } from '../stores/useSessionStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useSyncStore } from '../stores/useSyncStore'
import { DEFAULT_REST_TIMER_SECONDS } from '../constants'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('has correct initial state', () => {
    const state = useSessionStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.activeSessionId).toBeNull()
    expect(state.sessionStartedAt).toBeNull()
    expect(state.currentExerciseId).toBeNull()
    expect(state.sessionExerciseIds).toEqual([])
    expect(state.restTimerSeconds).toBe(0)
    expect(state.restTimerRunning).toBe(false)
    expect(state.prExplosionPending).toBeNull()
  })

  it('setPhase updates phase', () => {
    useSessionStore.getState().setPhase('active')
    expect(useSessionStore.getState().phase).toBe('active')
  })

  it('setActiveSessionId updates session id', () => {
    useSessionStore.getState().setActiveSessionId('session-123')
    expect(useSessionStore.getState().activeSessionId).toBe('session-123')
  })

  it('setPrExplosionPending updates pending PR data', () => {
    const prData = { exerciseId: 'ex-1', prData: { value: 100 } }
    useSessionStore.getState().setPrExplosionPending(prData)
    expect(useSessionStore.getState().prExplosionPending).toEqual(prData)
  })

  it('reset clears all state', () => {
    useSessionStore.getState().setPhase('active')
    useSessionStore.getState().setActiveSessionId('session-123')
    useSessionStore.getState().reset()
    expect(useSessionStore.getState().phase).toBe('idle')
    expect(useSessionStore.getState().activeSessionId).toBeNull()
  })

  it('does not store DB row objects in session store', () => {
    const state = useSessionStore.getState()
    // Only inspect non-function state fields. Arrays of objects would indicate DB rows
    // are being cached in the store (which violates ARCH-4: Zustand is for ephemeral
    // session state only — DB rows belong to useLiveQuery / DB hooks).
    const entries = Object.entries(state).filter(([, v]) => typeof v !== 'function')
    const objectArrayFields = entries
      .filter(([, v]) => Array.isArray(v) && v.some((item) => typeof item === 'object' && item !== null))
      .map(([k]) => k)
    expect(objectArrayFields).toHaveLength(0)
  })

  it('sessionExerciseIds starts empty and deduplicates on add', () => {
    useSessionStore.getState().addExerciseToSession('ex-1')
    useSessionStore.getState().addExerciseToSession('ex-2')
    useSessionStore.getState().addExerciseToSession('ex-1')
    expect(useSessionStore.getState().sessionExerciseIds).toEqual(['ex-1', 'ex-2'])
  })

  it('reset clears sessionExerciseIds', () => {
    useSessionStore.getState().addExerciseToSession('ex-1')
    useSessionStore.getState().reset()
    expect(useSessionStore.getState().sessionExerciseIds).toEqual([])
  })
})

describe('useSettingsStore', () => {
  it('has correct initial state', () => {
    const state = useSettingsStore.getState()
    expect(state.unit).toBe('kg')
    expect(state.defaultRestTimerSeconds).toBe(DEFAULT_REST_TIMER_SECONDS)
    expect(state.accountState).toBe('anonymous')
  })

  it('setUnit updates weight unit', () => {
    useSettingsStore.getState().setUnit('lb')
    expect(useSettingsStore.getState().unit).toBe('lb')
    useSettingsStore.getState().setUnit('kg')
  })
})

describe('useSyncStore', () => {
  it('has correct initial state', () => {
    const state = useSyncStore.getState()
    expect(state.syncStatus).toBe('idle')
    expect(state.lastSyncedAt).toBeNull()
    expect(state.isConnected).toBe(false)
  })

  it('setSyncStatus updates status', () => {
    useSyncStore.getState().setSyncStatus('syncing')
    expect(useSyncStore.getState().syncStatus).toBe('syncing')
    useSyncStore.getState().setSyncStatus('idle')
  })
})
