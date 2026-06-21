import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { FloatingBubbleModule } from '../modules/floating-bubble/FloatingBubbleModule'
import { useSessionStore } from '../stores/useSessionStore'
import { showToast } from '../lib/toast'
import { showSessionNotification, dismissSessionNotification } from '../lib/bubbleNotification'
import type { SetPrefill } from '../types'

export function useFloatingBubble(options: {
  onTapPrefill: (prefill: SetPrefill) => void
  onLongPressConfirm: (prefill: SetPrefill) => void
  exerciseName: string
  currentPrefill: SetPrefill
}) {
  const phase = useSessionStore((s) => s.phase)
  const bubbleMode = useSessionStore((s) => s.bubbleMode)
  const setBubbleMode = useSessionStore((s) => s.setBubbleMode)
  // P3: extract restTimerSeconds at top level, not inside dep array
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Keep refs current so stale-closure callbacks read live values
  const prefillRef = useRef(options.currentPrefill)
  const exerciseNameRef = useRef(options.exerciseName)
  // Keep callback refs current so listeners registered at mount always call latest handler
  const onTapRef = useRef(options.onTapPrefill)
  const onLongPressRef = useRef(options.onLongPressConfirm)
  useEffect(() => { prefillRef.current = options.currentPrefill }, [options.currentPrefill])
  useEffect(() => { exerciseNameRef.current = options.exerciseName }, [options.exerciseName])
  useEffect(() => { onTapRef.current = options.onTapPrefill }, [options.onTapPrefill])
  useEffect(() => { onLongPressRef.current = options.onLongPressConfirm }, [options.onLongPressConfirm])

  // Register event listeners on mount
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const unsubTap = FloatingBubbleModule.onTap((prefill) => onTapRef.current(prefill))
    const unsubConfirm = FloatingBubbleModule.onLongPressConfirm((prefill) => onLongPressRef.current(prefill))
    const unsubRevoked = FloatingBubbleModule.onPermissionRevoked(() => {
      setBubbleMode('notification')
      showToast('Overlay permission removed — logging via notification instead.', 'info')
      // P16: only show notification when app is in background
      if (appStateRef.current === 'background') {
        showSessionNotification(exerciseNameRef.current, useSessionStore.getState().restTimerSeconds)
      }
    })
    return () => {
      unsubTap()
      unsubConfirm()
      unsubRevoked()
    }
  }, []) // mount/unmount only — stable wrappers via refs above

  // Update bubble state when timer changes (only while in background)
  useEffect(() => {
    if (Platform.OS !== 'android' || bubbleMode !== 'bubble') return
    if (appStateRef.current !== 'background') return
    FloatingBubbleModule.updateState({
      timerSeconds: restTimerSeconds, // P3: use top-level selector, not hook-in-dep-array
      prefill: prefillRef.current,
    }).catch(() => {})
  }, [restTimerSeconds, bubbleMode]) // P3 fix

  // Show/hide based on AppState transitions
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current
      appStateRef.current = nextState
      if (phase !== 'active') return

      // P15: treat inactive→background the same as active→background (Android transitioning through inactive)
      if ((prev === 'active' || prev === 'inactive') && nextState === 'background') {
        const liveRestSeconds = useSessionStore.getState().restTimerSeconds
        if (bubbleMode === 'bubble') {
          FloatingBubbleModule.show({
            timerSeconds: liveRestSeconds,
            exerciseName: exerciseNameRef.current,
            prefill: prefillRef.current,
          }).catch(() => {}) // P17
        } else if (bubbleMode === 'notification') {
          showSessionNotification(exerciseNameRef.current, liveRestSeconds).catch(() => {}) // P17
        }
      } else if (prev === 'background' && nextState === 'active') {
        if (bubbleMode === 'bubble') {
          FloatingBubbleModule.hide().catch(() => {}) // P17
        } else if (bubbleMode === 'notification') {
          dismissSessionNotification().catch(() => {}) // P17
        }
      }
    })
    return () => sub.remove()
  }, [phase, bubbleMode])

  // Hide bubble / dismiss notification when session ends
  useEffect(() => {
    if (Platform.OS !== 'android') return // P13: guard iOS
    if (phase !== 'active') {
      if (bubbleMode === 'bubble') {
        FloatingBubbleModule.hide().catch(() => {})
      } else if (bubbleMode === 'notification') {
        dismissSessionNotification().catch(() => {})
      }
    }
  }, [phase, bubbleMode])
}
