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
import { formatWeight } from '../../db/mappers/set.mapper'
import { useSetActions } from '../../hooks/useSets'
import {
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  FEEDBACK_ERROR,
  BORDER_SUBTLE,
} from '../../constants'

interface SetEntrySheetProps {
  visible: boolean
  exerciseId: string
  exerciseName: string
  sessionId: string
  unit: 'kg' | 'lb'
  onDismiss: () => void
  onLogged: () => void
}

export function SetEntrySheet({
  visible,
  exerciseId,
  exerciseName,
  sessionId,
  unit,
  onDismiss,
  onLogged,
}: SetEntrySheetProps) {
  const { logStrengthSet, getPrefillForExercise } = useSetActions()

  const [weightText, setWeightText] = useState('')
  const [repsText, setRepsText] = useState('')
  const [prefillLabel, setPrefillLabel] = useState<string | null>(null)
  const [inFlight, setInFlight] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(false)

  const weightValue = Number(weightText)
  const repsValue = Number(repsText)
  const weightValid = Number.isFinite(weightValue) && weightValue > 0
  const repsValid = Number.isInteger(repsValue) && repsValue >= 1
  const canLog = weightValid && repsValid && !inFlight

  const showWeightError = (hasAttempted || weightText.length > 0) && !weightValid
  const showRepsError = (hasAttempted || repsText.length > 0) && !repsValid

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      const prefill = await getPrefillForExercise(exerciseId, sessionId)
      if (cancelled) return
      if (!prefill) {
        setWeightText('')
        setRepsText('')
        setPrefillLabel(null)
        return
      }
      const numericWeight =
        prefill.weightKg === null
          ? ''
          : formatWeight(prefill.weightKg, unit).replace(/ kg$| lb$/, '')
      setWeightText(numericWeight)
      setRepsText(prefill.reps !== null ? String(prefill.reps) : '')
      setPrefillLabel(prefill.label)
    })()
    return () => { cancelled = true }
  }, [visible, exerciseId, sessionId, unit, getPrefillForExercise])

  const handleLogSet = async () => {
    setHasAttempted(true)
    if (!canLog) return
    setInFlight(true)
    try {
      const result = await logStrengthSet(exerciseId, weightValue, repsValue)
      if (result) {
        onLogged()
        onDismiss()
      }
    } finally {
      setInFlight(false)
    }
  }

  const handleDismiss = () => {
    setWeightText('')
    setRepsText('')
    setPrefillLabel(null)
    setHasAttempted(false)
    onDismiss()
  }

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

          {/* Weight field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Weight ({unit})</Text>
            <TextInput
              style={styles.numericInput}
              value={weightText}
              onChangeText={setWeightText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={INK_DISABLED}
              accessibilityLabel={`Weight in ${unit}`}
            />
            {showWeightError && (
              <Text style={styles.errorText}>Weight must be greater than 0.</Text>
            )}
          </View>

          {/* Reps field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Reps</Text>
            <TextInput
              style={styles.numericInput}
              value={repsText}
              onChangeText={setRepsText}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={INK_DISABLED}
              accessibilityLabel="Reps"
            />
            {showRepsError && (
              <Text style={styles.errorText}>Enter at least 1 rep.</Text>
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
