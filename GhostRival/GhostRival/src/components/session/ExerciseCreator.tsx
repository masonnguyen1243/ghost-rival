import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  PanResponder,
  Animated,
} from 'react-native'
import {
  SURFACE_BASE,
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  PR_BURST,
  BORDER_SUBTLE,
  FEEDBACK_ERROR,
} from '../../constants'
import type { DisplayExercise, ExerciseType } from '../../types'
import { useExercises } from '../../hooks/useExercises'

interface ExerciseCreatorProps {
  visible: boolean
  onDismiss: () => void
  onCreated: (exercise: DisplayExercise) => void
}

export function ExerciseCreator({ visible, onDismiss, onCreated }: ExerciseCreatorProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ExerciseType>('strength')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createExercise, checkDuplicateName } = useExercises()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAddingRef = useRef(false)
  const translateY = useRef(new Animated.Value(0)).current
  const dismissRef = useRef<() => void>(() => {})

  // Reset state when modal is hidden (externally or after swipe animation)
  useEffect(() => {
    if (!visible) {
      translateY.setValue(0)
      setName('')
      setType('strength')
      setError(null)
      setIsSubmitting(false)
      isAddingRef.current = false
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [visible, translateY])

  // Cancel any in-flight debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    translateY.setValue(0)
    setName('')
    setType('strength')
    setError(null)
    onDismiss()
  }, [onDismiss, translateY])

  // Keep dismissRef current so the PanResponder (created once) always calls the latest handleDismiss
  dismissRef.current = handleDismiss

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 80 || vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => dismissRef.current())
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const validateName = useCallback(
    (value: string, typeOverride?: ExerciseType) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (!value.trim()) {
        setError(null)
        return
      }
      const checkType = typeOverride ?? type
      debounceTimer.current = setTimeout(async () => {
        const isDuplicate = await checkDuplicateName(value, checkType)
        setError(isDuplicate ? 'You already have an exercise with this name.' : null)
      }, 150)
    },
    [type, checkDuplicateName],
  )

  const handleNameChange = (value: string) => {
    setName(value)
    validateName(value)
  }

  const handleTypeChange = (newType: ExerciseType) => {
    setType(newType)
    if (name.trim()) {
      validateName(name, newType)
    }
  }

  const handleAdd = async () => {
    if (!name.trim() || error || isSubmitting || isAddingRef.current) return
    isAddingRef.current = true
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setIsSubmitting(true)
    const isDuplicate = await checkDuplicateName(name, type)
    if (isDuplicate) {
      setError('You already have an exercise with this name.')
      setIsSubmitting(false)
      isAddingRef.current = false
      return
    }
    const created = await createExercise(name.trim(), type)
    setIsSubmitting(false)
    isAddingRef.current = false
    if (created) {
      setName('')
      setType('strength')
      setError(null)
      onCreated(created)
      onDismiss()
    }
  }

  const isAddEnabled = name.trim().length > 0 && !error && !isSubmitting

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.handle} />

            <Text style={styles.title}>New Exercise</Text>

            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Exercise name"
              placeholderTextColor={INK_DISABLED}
              value={name}
              onChangeText={handleNameChange}
              maxLength={60}
              autoFocus
              returnKeyType="done"
              accessibilityLabel="Exercise name"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.typeLabel}>TYPE</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'strength' ? styles.typeButtonSelected : null]}
                onPress={() => handleTypeChange('strength')}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === 'strength' }}
                accessibilityLabel="Strength"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'strength' ? styles.typeButtonTextSelected : null,
                  ]}
                >
                  Strength
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'cardio' ? styles.typeButtonSelected : null]}
                onPress={() => handleTypeChange('cardio')}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === 'cardio' }}
                accessibilityLabel="Cardio"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'cardio' ? styles.typeButtonTextSelected : null,
                  ]}
                >
                  Cardio
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.addButton, !isAddEnabled ? styles.addButtonDisabled : null]}
              onPress={handleAdd}
              disabled={!isAddEnabled}
              accessibilityRole="button"
              accessibilityLabel="Add exercise"
              accessibilityState={{ disabled: !isAddEnabled }}
            >
              <Text
                style={[styles.addButtonText, !isAddEnabled ? styles.addButtonTextDisabled : null]}
              >
                {isSubmitting ? 'Adding…' : 'Add'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE_OVERLAY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 20,
  },
  input: {
    height: 48,
    backgroundColor: SURFACE_BASE,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    marginBottom: 6,
  },
  inputError: {
    borderColor: FEEDBACK_ERROR,
  },
  errorText: {
    color: FEEDBACK_ERROR,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginBottom: 12,
  },
  typeLabel: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: BORDER_SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonSelected: {
    borderColor: PR_BURST,
  },
  typeButtonText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
  typeButtonTextSelected: {
    color: INK_PRIMARY,
  },
  addButton: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    borderColor: BORDER_SUBTLE,
  },
  addButtonText: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
  },
  addButtonTextDisabled: {
    color: INK_DISABLED,
  },
})
