import { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native'
import {
  parseDurationToSeconds,
  formatPace,
  calculatePaceSecPerKm,
  convertDistanceToMeters,
} from '../../db/mappers/cardio.mapper'
import { useSetActions } from '../../hooks/useSets'
import {
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  GHOST_DIM,
  FEEDBACK_ERROR,
  BORDER_SUBTLE,
} from '../../constants'

interface CardioSetEntrySheetProps {
  visible: boolean
  exerciseId: string
  exerciseName: string
  sessionId: string
  unit: 'kg' | 'lb'
  onDismiss: () => void
  onLogged: () => void
}

export function CardioSetEntrySheet({
  visible,
  exerciseId,
  exerciseName,
  sessionId,
  unit,
  onDismiss,
  onLogged,
}: CardioSetEntrySheetProps) {
  const { logCardioSet, getPrefillForExercise } = useSetActions()

  const [minutesText, setMinutesText] = useState('')
  const [secondsText, setSecondsText] = useState('')
  const [distanceText, setDistanceText] = useState('')
  const [prefillLabel, setPrefillLabel] = useState<string | null>(null)
  const [inFlight, setInFlight] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(false)

  const totalDurationS = parseDurationToSeconds(minutesText, secondsText)
  const durationValid = totalDurationS > 0

  const distanceValue = distanceText.length > 0 ? Number(distanceText) : null
  const distanceEntered = distanceText.length > 0
  const distanceValid = distanceValue === null || (Number.isFinite(distanceValue) && distanceValue > 0)

  const canLog = durationValid && distanceValid && !inFlight

  const showDurationError = hasAttempted && !durationValid
  const showDistanceError = hasAttempted && distanceEntered && !distanceValid

  // Live pace preview
  const distanceM =
    distanceValue !== null && Number.isFinite(distanceValue) && distanceValue > 0
      ? convertDistanceToMeters(distanceValue, unit)
      : null
  const pacePreview =
    durationValid && distanceM !== null && distanceM > 0
      ? formatPace(calculatePaceSecPerKm(totalDurationS, distanceM), unit)
      : null

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      const prefill = await getPrefillForExercise(exerciseId, sessionId)
      if (cancelled) return
      if (!prefill || prefill.durationS === null) {
        setMinutesText('')
        setSecondsText('')
        setDistanceText('')
        setPrefillLabel(null)
        return
      }
      const totalS = prefill.durationS
      setMinutesText(String(Math.floor(totalS / 60)))
      setSecondsText(String(totalS % 60).padStart(2, '0'))
      if (prefill.distanceM !== null) {
        const displayDist =
          unit === 'lb'
            ? (prefill.distanceM / 1609.344).toFixed(2)
            : (prefill.distanceM / 1000).toFixed(2)
        setDistanceText(displayDist)
      } else {
        setDistanceText('')
      }
      setPrefillLabel(prefill.label)
    })()
    return () => { cancelled = true }
  }, [visible, exerciseId, sessionId, unit, getPrefillForExercise])

  const handleLogSet = async () => {
    setHasAttempted(true)
    if (!canLog) return
    setInFlight(true)
    try {
      const finalDistanceM =
        distanceValue !== null && Number.isFinite(distanceValue) && distanceValue > 0
          ? convertDistanceToMeters(distanceValue, unit)
          : null
      const result = await logCardioSet(exerciseId, totalDurationS, finalDistanceM)
      if (result) {
        onLogged()
        onDismiss()
      }
    } finally {
      setInFlight(false)
    }
  }

  const handleDismiss = () => {
    setMinutesText('')
    setSecondsText('')
    setDistanceText('')
    setPrefillLabel(null)
    setHasAttempted(false)
    setInFlight(false)
    onDismiss()
  }

  const distanceLabel = unit === 'lb' ? 'mi' : 'km'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>{exerciseName}</Text>

          {/* Duration field — two inputs: minutes + seconds */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationField}>
                <TextInput
                  style={styles.numericInput}
                  value={minutesText}
                  onChangeText={setMinutesText}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={INK_DISABLED}
                  accessibilityLabel="Minutes"
                />
                <Text style={styles.durationSubLabel}>Min</Text>
              </View>
              <Text style={styles.durationSeparator}>:</Text>
              <View style={styles.durationField}>
                <TextInput
                  style={styles.numericInput}
                  value={secondsText}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10)
                    if (t === '' || (Number.isFinite(n) && n >= 0 && n <= 59)) {
                      setSecondsText(t)
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="00"
                  placeholderTextColor={INK_DISABLED}
                  accessibilityLabel="Seconds"
                />
                <Text style={styles.durationSubLabel}>Sec</Text>
              </View>
            </View>
            {showDurationError && (
              <Text style={styles.errorText}>Enter a duration greater than 0:00.</Text>
            )}
          </View>

          {/* Distance field (optional) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Distance ({distanceLabel}) — optional</Text>
            <TextInput
              style={styles.numericInput}
              value={distanceText}
              onChangeText={setDistanceText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={INK_DISABLED}
              accessibilityLabel={`Distance in ${distanceLabel}`}
            />
            {showDistanceError && (
              <Text style={styles.errorText}>Enter a valid distance.</Text>
            )}
            {pacePreview !== null && (
              <Text style={styles.pacePreview}>≈ {pacePreview}</Text>
            )}
          </View>

          {/* Pre-fill label */}
          {prefillLabel !== null && (
            <Text style={styles.prefillLabel}>{prefillLabel}</Text>
          )}

          {/* Log Set CTA */}
          <TouchableOpacity
            style={[styles.logSetButton, !canLog && styles.logSetButtonDisabled]}
            onPress={handleLogSet}
            disabled={!canLog}
            accessibilityRole="button"
            accessibilityLabel="Log Set"
            accessibilityState={{ disabled: !canLog }}
          >
            <Text style={styles.logSetButtonText}>Log Set</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE_OVERLAY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 48,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER_SUBTLE,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 24,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  durationField: {
    flex: 1,
  },
  durationSeparator: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 24,
    paddingBottom: 8,
  },
  durationSubLabel: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  numericInput: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 40,
    lineHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SUBTLE,
    paddingVertical: 4,
  },
  errorText: {
    color: FEEDBACK_ERROR,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  pacePreview: {
    color: GHOST_DIM,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  prefillLabel: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginBottom: 24,
  },
  logSetButton: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  logSetButtonDisabled: {
    opacity: 0.4,
  },
  logSetButtonText: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
  },
})
