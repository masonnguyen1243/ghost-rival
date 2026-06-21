import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native'
import {
  SURFACE_BASE,
  SURFACE_RAISED,
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  BORDER_SUBTLE,
  FEEDBACK_ERROR,
  PR_BURST,
} from '../../constants'
import { useExercises } from '../../hooks/useExercises'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { FloatingBubbleModule } from '../../modules/floating-bubble/FloatingBubbleModule'
import type { DisplayExercise, ExerciseType } from '../../types'

interface RenameState {
  id: string
  currentName: string
  draftName: string
  error: string | null
}

export default function SettingsScreen() {
  const { exercises, renameExercise, deleteExercise, checkDuplicateName, setRestTimerSeconds } = useExercises()
  const defaultRestTimerSeconds = useSettingsStore((s) => s.defaultRestTimerSeconds)
  const hasShownBubblePrompt = useSettingsStore((s) => s.hasShownBubblePrompt)
  const bubbleEnabled = useSettingsStore((s) => s.bubbleEnabled)
  const [renaming, setRenaming] = useState<RenameState | null>(null)
  const [restTimerEditId, setRestTimerEditId] = useState<string | null>(null)
  const [restTimerDraft, setRestTimerDraft] = useState<string>('')
  const renameDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (renameDebounceTimer.current) clearTimeout(renameDebounceTimer.current)
    }
  }, [])

  const startRename = (exercise: DisplayExercise) => {
    setRenaming({
      id: exercise.id,
      currentName: exercise.name,
      draftName: exercise.name,
      error: null,
    })
  }

  const handleRenameChange = (value: string) => {
    if (!renaming) return
    setRenaming((prev) => (prev ? { ...prev, draftName: value, error: null } : null))
    if (renameDebounceTimer.current) clearTimeout(renameDebounceTimer.current)
    if (!value.trim()) return
    const capturedId = renaming.id
    renameDebounceTimer.current = setTimeout(async () => {
      const exerciseType = exercises.find((e) => e.id === capturedId)?.type
      if (!exerciseType) return
      const isDuplicate = await checkDuplicateName(value, exerciseType, capturedId)
      setRenaming((prev) =>
        prev ? { ...prev, error: isDuplicate ? 'You already have an exercise with this name.' : null } : null,
      )
    }, 150)
  }

  const confirmRename = async () => {
    if (!renaming || !renaming.draftName.trim() || renaming.error) return
    if (renaming.draftName.trim() === renaming.currentName) {
      setRenaming(null)
      return
    }
    const exerciseType = exercises.find((e) => e.id === renaming.id)?.type
    if (!exerciseType) {
      setRenaming(null)
      return
    }
    const isDuplicate = await checkDuplicateName(renaming.draftName, exerciseType, renaming.id)
    if (isDuplicate) {
      setRenaming((prev) => (prev ? { ...prev, error: 'You already have an exercise with this name.' } : null))
      return
    }
    await renameExercise(renaming.id, renaming.draftName)
    setRenaming(null)
  }

  const confirmDelete = (exercise: DisplayExercise) => {
    Alert.alert(
      `Delete "${exercise.name}"?`,
      'All historical sets and ghost records are preserved. The exercise will no longer appear in workouts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExercise(exercise.id),
        },
      ],
    )
  }

  const handleSaveRestTimer = async (id: string) => {
    const val = parseInt(restTimerDraft, 10)
    // P3: show feedback on invalid input instead of silently no-oping
    if (!Number.isInteger(val) || val < 1 || val > 3600) {
      Alert.alert('Invalid duration', 'Please enter a value between 1 and 3600 seconds.')
      return
    }
    // P5: capture ID before await — async completion must not close a different editor
    const editingId = id
    try {
      // P4: catch DB errors so the UI stays consistent
      await setRestTimerSeconds(editingId, val)
      // P5: functional update reads current state — won't close a different editor opened mid-flight
      setRestTimerEditId((cur) => (cur === editingId ? null : cur))
    } catch {
      Alert.alert('Error', 'Could not save rest timer. Please try again.')
    }
  }

  const handleClearRestTimer = async (id: string) => {
    const editingId = id
    try {
      // P4: catch DB errors
      await setRestTimerSeconds(editingId, null)
      setRestTimerEditId((cur) => (cur === editingId ? null : cur))
    } catch {
      Alert.alert('Error', 'Could not clear rest timer. Please try again.')
    }
  }

  const renderExerciseRow = (exercise: DisplayExercise) => {
    const isRenaming = renaming?.id === exercise.id
    return (
      <View key={exercise.id} style={styles.exerciseRow}>
        {isRenaming ? (
          <View style={styles.renameContainer}>
            <TextInput
              style={[styles.renameInput, renaming.error ? styles.renameInputError : null]}
              value={renaming.draftName}
              onChangeText={handleRenameChange}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={confirmRename}
              accessibilityLabel={`Rename ${exercise.name}`}
            />
            {renaming.error ? <Text style={styles.renameError}>{renaming.error}</Text> : null}
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameBtn, !renaming.draftName.trim() || !!renaming.error ? styles.renameBtnDisabled : null]}
                onPress={confirmRename}
                disabled={!renaming.draftName.trim() || !!renaming.error}
                accessibilityRole="button"
                accessibilityLabel="Save rename"
              >
                <Text style={styles.renameBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRenaming(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel rename"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseType}>{exercise.type.toUpperCase()}</Text>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => startRename(exercise)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Rename ${exercise.name}`}
              >
                <Text style={styles.actionBtnText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(exercise)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${exercise.name}`}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
            {/* Rest Timer config row */}
            {restTimerEditId === exercise.id ? (
              <View style={styles.restTimerEditRow}>
                <TextInput
                  style={styles.restTimerInput}
                  value={restTimerDraft}
                  onChangeText={setRestTimerDraft}
                  keyboardType="number-pad"
                  placeholder="Default"
                  placeholderTextColor={INK_DISABLED}
                  accessibilityLabel={`Custom rest timer for ${exercise.name} in seconds`}
                  maxLength={4}
                />
                <Text style={styles.restTimerUnit}>sec</Text>
                <TouchableOpacity
                  style={styles.restTimerSaveBtn}
                  onPress={() => handleSaveRestTimer(exercise.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Save rest timer"
                >
                  <Text style={styles.restTimerSaveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.restTimerClearBtn}
                  onPress={() => handleClearRestTimer(exercise.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Clear rest timer (use default)"
                >
                  <Text style={styles.restTimerClearBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRestTimerEditId(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel rest timer edit"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.restTimerRow}
                onPress={() => {
                  setRestTimerEditId(exercise.id)
                  setRestTimerDraft(exercise.restTimerSeconds !== null ? String(exercise.restTimerSeconds) : '')
                }}
                accessibilityRole="button"
                accessibilityLabel={`Rest timer for ${exercise.name}: ${exercise.restTimerSeconds !== null ? `${exercise.restTimerSeconds} seconds` : 'default'}`}
                hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
              >
                <Text style={styles.restTimerLabel}>REST TIMER</Text>
                <Text style={styles.restTimerValue}>
                  {exercise.restTimerSeconds !== null
                    ? `${exercise.restTimerSeconds}s`
                    : `${defaultRestTimerSeconds}s (default)`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Platform.OS === 'android' && hasShownBubblePrompt && !bubbleEnabled && (
        <>
          <Text style={styles.sectionHeader}>SESSION</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => FloatingBubbleModule.openPermissionSettings()}
              accessibilityRole="button"
              accessibilityLabel="Enable Ghost Bubble overlay permission"
            >
              <Text style={styles.settingLabel}>Enable Ghost Bubble</Text>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionHeader}>EXERCISE MANAGEMENT</Text>

      {exercises.length === 0 ? (
        <Text style={styles.emptyText}>
          No exercises yet. Start a workout to create one.
        </Text>
      ) : (
        <View style={styles.exerciseList}>{exercises.map(renderExerciseRow)}</View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BASE,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  exerciseList: {
    gap: 2,
  },
  exerciseRow: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    padding: 16,
    marginBottom: 2,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginBottom: 8,
  },
  exerciseName: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    flex: 1,
  },
  exerciseType: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  deleteBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: FEEDBACK_ERROR,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  renameContainer: {
    gap: 6,
  },
  renameInput: {
    height: 44,
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  renameInputError: {
    borderColor: FEEDBACK_ERROR,
  },
  renameError: {
    color: FEEDBACK_ERROR,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  renameActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  renameBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  renameBtnDisabled: {
    opacity: 0.4,
  },
  renameBtnText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  cancelBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    minHeight: 36,
  },
  restTimerLabel: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  restTimerValue: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  restTimerEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  restTimerInput: {
    flex: 1,
    height: 44,
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  restTimerUnit: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  restTimerSaveBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTimerSaveBtnText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  restTimerClearBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTimerClearBtnText: {
    color: FEEDBACK_ERROR,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  settingCard: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 52,
  },
  settingLabel: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  settingChevron: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 20,
  },
})
