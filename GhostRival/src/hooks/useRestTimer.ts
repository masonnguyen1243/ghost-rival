import { useEffect, useRef } from 'react'
import { Vibration } from 'react-native'
import { useSessionStore } from '../stores/useSessionStore'

export function useRestTimer() {
  const restTimerRunning = useSessionStore((s) => s.restTimerRunning)
  const setRestTimerSeconds = useSessionStore((s) => s.setRestTimerSeconds)
  const setRestTimerRunning = useSessionStore((s) => s.setRestTimerRunning)
  const setRestTimerTotalSeconds = useSessionStore((s) => s.setRestTimerTotalSeconds)
  const setRestTimerFlashing = useSessionStore((s) => s.setRestTimerFlashing)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup interval when timer is stopped externally (session end, store reset)
  useEffect(() => {
    if (!restTimerRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [restTimerRunning])

  const startTimer = (seconds: number) => {
    // P6: guard against zero/invalid duration
    if (!seconds || seconds <= 0) return

    // Clear any existing interval and in-progress flash
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = null
    }
    setRestTimerFlashing(false)
    setRestTimerTotalSeconds(seconds)
    setRestTimerSeconds(seconds)
    setRestTimerRunning(true)

    // P1: spawn interval directly — useEffect won't re-fire if restTimerRunning was already true
    intervalRef.current = setInterval(() => {
      const current = useSessionStore.getState().restTimerSeconds
      if (current <= 1) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setRestTimerSeconds(0)
        setRestTimerRunning(false)
        // P2: set flash in store so RestTimerBar stays visible across batched renders
        setRestTimerFlashing(true)
        Vibration.vibrate(40)
        flashTimeoutRef.current = setTimeout(() => {
          setRestTimerFlashing(false)
          flashTimeoutRef.current = null
        }, 600)
      } else {
        setRestTimerSeconds(current - 1)
      }
    }, 1000)
  }

  const skipTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = null
    }
    setRestTimerRunning(false)
    setRestTimerSeconds(0)
    setRestTimerTotalSeconds(0)
    setRestTimerFlashing(false)
    // No haptic on skip (per AC2)
  }

  const extendTimer = (seconds: number) => {
    if (!useSessionStore.getState().restTimerRunning) return
    if (!seconds || seconds <= 0) return
    const current = useSessionStore.getState().restTimerSeconds
    const next = Math.min(current + seconds, 3600)
    setRestTimerSeconds(next)
    setRestTimerTotalSeconds(next)
  }

  return { startTimer, skipTimer, extendTimer }
}
