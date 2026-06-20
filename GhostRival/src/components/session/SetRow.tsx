import { useRef, useState, useEffect } from 'react'
import {
  Alert,
  Animated,
  PanResponder,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native'
import { formatWeight } from '../../db/mappers/set.mapper'
import {
  formatDuration,
  formatDistanceDisplay,
  calculatePaceSecPerKm,
  formatPace,
  formatDurationAccessibility,
  formatDistanceAccessibility,
} from '../../db/mappers/cardio.mapper'
import {
  SURFACE_RAISED,
  INK_PRIMARY,
  INK_SECONDARY,
} from '../../constants'
import type { DbSet } from '../../types'

const LOCK_WINDOW_S = 30
const SR_LOCK_WINDOW_S = 90
const SWIPE_THRESHOLD = -80

interface SetRowProps {
  set: DbSet
  setNumber: number
  unit: 'kg' | 'lb'
  onDelete: (set: DbSet) => void
  deletionLocked?: boolean
}

interface RowContentProps {
  setNumber: number
  set: DbSet
  unit: 'kg' | 'lb'
}

export function SetRow({ set, setNumber, unit, onDelete, deletionLocked = false }: SetRowProps) {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const [isLocked, setIsLocked] = useState(
    () => Math.floor(Date.now() / 1000) - set.logged_at >= LOCK_WINDOW_S,
  )

  // Keep a ref in sync so PanResponder (created once) always reads current lock state
  const isLockedRef = useRef(isLocked)
  const deletionLockedRef = useRef(deletionLocked)
  useEffect(() => { isLockedRef.current = isLocked }, [isLocked])
  useEffect(() => { deletionLockedRef.current = deletionLocked }, [deletionLocked])

  useEffect(() => {
    let active = true
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (active) setScreenReaderEnabled(enabled)
    })
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled)
    return () => {
      active = false
      sub.remove()
    }
  }, [])

  useEffect(() => {
    if (isLocked) return
    const elapsed = Math.floor(Date.now() / 1000) - set.logged_at
    const windowS = screenReaderEnabled ? SR_LOCK_WINDOW_S : LOCK_WINDOW_S
    const remainingMs = (windowS - elapsed) * 1000
    if (remainingMs <= 0) {
      setIsLocked(true)
      return
    }
    const t = setTimeout(() => setIsLocked(true), remainingMs)
    return () => clearTimeout(t)
  }, [isLocked, set.logged_at, screenReaderEnabled])

  const pan = useRef(new Animated.Value(0)).current

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !isLockedRef.current &&
        !deletionLockedRef.current &&
        Math.abs(g.dx) > Math.abs(g.dy) &&
        g.dx < -10,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) pan.setValue(g.dx)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete(set))
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start()
        }
      },
    }),
  ).current

  const isCardio = set.duration_s !== null && set.weight_kg === null
  const accessibilityLabel = isCardio
    ? `Set ${setNumber}. ${formatDurationAccessibility(set.duration_s!)}${set.distance_m !== null ? ', ' + formatDistanceAccessibility(set.distance_m, unit) : ''}.`
    : `Set ${setNumber}. ${formatWeight(set.weight_kg, unit)} by ${set.reps}.`
  const lockDurationS = screenReaderEnabled ? SR_LOCK_WINDOW_S : LOCK_WINDOW_S

  const handleLockedTap = () => {
    Alert.alert('', `Sets are locked after ${lockDurationS} seconds`)
  }

  const handleAccessibilityAction = (event: { nativeEvent: { actionName: string } }) => {
    if (event.nativeEvent.actionName === 'delete') {
      if (isLocked) {
        handleLockedTap()
      } else {
        onDelete(set)
      }
    }
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: pan }] }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
      onAccessibilityAction={handleAccessibilityAction}
      {...(isLocked ? {} : panResponder.panHandlers)}
    >
      {isLocked ? (
        <TouchableOpacity
          style={styles.row}
          onPress={handleLockedTap}
          activeOpacity={0.7}
          accessibilityLabel={accessibilityLabel}
          accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
          onAccessibilityAction={handleAccessibilityAction}
        >
          <RowContent setNumber={setNumber} set={set} unit={unit} />
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          <RowContent setNumber={setNumber} set={set} unit={unit} />
        </View>
      )}
    </Animated.View>
  )
}

function RowContent({ setNumber, set, unit }: RowContentProps) {
  const isCardio = set.duration_s !== null && set.weight_kg === null

  if (isCardio) {
    const durationDisplay = formatDuration(set.duration_s!)
    const distanceDisplay = formatDistanceDisplay(set.distance_m, unit)
    const pace =
      set.duration_s! > 0 && set.distance_m !== null && set.distance_m > 0
        ? formatPace(calculatePaceSecPerKm(set.duration_s!, set.distance_m), unit)
        : null
    return (
      <>
        <Text style={styles.setNumber}>Set {setNumber}</Text>
        <View style={styles.cardioCenter}>
          <Text style={styles.weightReps}>
            {durationDisplay}{distanceDisplay ? ` / ${distanceDisplay}` : ''}
          </Text>
          {pace !== null && <Text style={styles.paceText}>{pace}</Text>}
        </View>
        {/* Ghost delta stub — Epic 3 wires this */}
        <Text style={styles.ghostDelta} />
      </>
    )
  }

  return (
    <>
      <Text style={styles.setNumber}>Set {setNumber}</Text>
      <Text style={styles.weightReps}>
        {formatWeight(set.weight_kg, unit)} × {set.reps ?? 0}
      </Text>
      {/* Ghost delta stub — Epic 3 wires this */}
      <Text style={styles.ghostDelta} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 8,
    marginBottom: 4,
    minHeight: 44,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  setNumber: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    width: 56,
  },
  weightReps: {
    flex: 1,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 40,
    lineHeight: 48,
  },
  cardioCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  paceText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  ghostDelta: {
    width: 48,
  },
})
