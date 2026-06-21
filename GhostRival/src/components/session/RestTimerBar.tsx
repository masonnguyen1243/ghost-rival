import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSessionStore } from '../../stores/useSessionStore'
import { useRestTimer } from '../../hooks/useRestTimer'
import {
  BORDER_SUBTLE,
  GHOST_ACCENT,
  PR_BURST,
  INK_PRIMARY,
  INK_SECONDARY,
} from '../../constants'

export function RestTimerBar() {
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds)
  const restTimerTotalSeconds = useSessionStore((s) => s.restTimerTotalSeconds)
  const restTimerRunning = useSessionStore((s) => s.restTimerRunning)
  const restTimerFlashing = useSessionStore((s) => s.restTimerFlashing)
  const setRestTimerRunning = useSessionStore((s) => s.setRestTimerRunning)
  const setRestTimerSeconds = useSessionStore((s) => s.setRestTimerSeconds)
  const setRestTimerTotalSeconds = useSessionStore((s) => s.setRestTimerTotalSeconds)
  const { extendTimer } = useRestTimer()

  // P2: flash state lives in store — visible even when seconds=0 and running=false
  const isVisible = restTimerRunning || restTimerSeconds > 0 || restTimerFlashing
  if (!isVisible) return null

  const minutes = Math.floor(restTimerSeconds / 60)
  const secs = String(restTimerSeconds % 60).padStart(2, '0')
  const countdown = `${minutes}:${secs}`

  // P7: clamp to 100% to prevent overshoot during rapid restarts
  const fillPercent = restTimerTotalSeconds === 0
    ? 0
    : Math.min(100, (restTimerSeconds / restTimerTotalSeconds) * 100)

  const barColor = restTimerFlashing ? PR_BURST : GHOST_ACCENT

  const handleSkip = () => {
    setRestTimerRunning(false)
    setRestTimerSeconds(0)
    setRestTimerTotalSeconds(0)
    // No haptic on skip (per AC4)
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.countdown}>{countdown}</Text>
        <TouchableOpacity
          style={[styles.extendBtn, !restTimerRunning && styles.btnDisabled]}
          onPress={() => extendTimer(30)}
          disabled={!restTimerRunning}
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds to rest timer"
          accessibilityState={{ disabled: !restTimerRunning }}
        >
          <Text style={styles.skipText}>+30S</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip rest timer"
        >
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  countdown: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
  },
  skipBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extendBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  skipText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  barBackground: {
    width: '100%',
    height: 3,
    backgroundColor: BORDER_SUBTLE,
  },
  barFill: {
    height: 3,
  },
})
