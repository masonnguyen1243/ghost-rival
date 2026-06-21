import { useEffect, useRef } from 'react'
import { Platform, AppState, AppStateStatus } from 'react-native'
import { LiveActivityModule } from '../modules/live-activity/LiveActivityModule'
import { useSessionStore } from '../stores/useSessionStore'
import { useSettingsStore } from '../stores/useSettingsStore'

export function useLiveActivity(options: {
  exerciseName: string
  sessionId: string | null
}) {
  const phase = useSessionStore((s) => s.phase)
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds)
  const restTimerRunning = useSessionStore((s) => s.restTimerRunning)
  const liveActivityEnabled = useSettingsStore((s) => s.liveActivityEnabled)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const sessionStartRef = useRef<number | null>(null)
  // Guards update() and end() against firing before start() resolves or on mount
  const hasStartedRef = useRef(false)

  // Track session start time for 8h auto-end detection (AC6)
  useEffect(() => {
    if (phase === 'active' && sessionStartRef.current === null) {
      sessionStartRef.current = Date.now()
    } else if (phase !== 'active') {
      sessionStartRef.current = null
    }
  }, [phase])

  // Start activity when session goes active (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    if (phase !== 'active' || !liveActivityEnabled || !options.sessionId) return
    const exerciseName = options.exerciseName || 'Workout'
    LiveActivityModule.start({
      exerciseName,
      timerSeconds: useSessionStore.getState().restTimerSeconds,
      timerRunning: useSessionStore.getState().restTimerRunning,
      sessionId: options.sessionId,
    })
      .then(() => { hasStartedRef.current = true })
      .catch(() => {})
  }, [phase, liveActivityEnabled, options.sessionId])

  // Update activity when timer or exercise name changes (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    if (phase !== 'active' || !liveActivityEnabled || !hasStartedRef.current) return
    LiveActivityModule.update({
      exerciseName: options.exerciseName || 'Workout',
      timerSeconds: restTimerSeconds,
      timerRunning: restTimerRunning,
    }).catch(() => {})
  }, [restTimerSeconds, restTimerRunning, options.exerciseName, phase, liveActivityEnabled])

  // End activity when session ends (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    if (phase === 'active' || !hasStartedRef.current) return
    hasStartedRef.current = false
    LiveActivityModule.end().catch(() => {})
  }, [phase])

  // 8-hour auto-end detection on app resume (AC6 belt-and-suspenders, iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current
      appStateRef.current = nextState

      if (prev !== 'background' || nextState !== 'active') return
      const started = sessionStartRef.current
      if (!started || !hasStartedRef.current) return
      const elapsedHours = (Date.now() - started) / (1000 * 3600)
      if (elapsedHours >= 8) {
        // ActivityKit staleDate has already ended the Live Activity on iOS side.
        // We end it from JS too for state consistency.
        hasStartedRef.current = false
        LiveActivityModule.end().catch(() => {})
      }
    })
    return () => sub.remove()
  }, [])
}
