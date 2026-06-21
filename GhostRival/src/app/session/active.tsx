import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  BackHandler,
  AccessibilityInfo,
  AppState,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../../stores/useSessionStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { FloatingBubbleModule } from '../../modules/floating-bubble/FloatingBubbleModule'
import { LiveActivityModule } from '../../modules/live-activity/LiveActivityModule'
import { BubblePermissionPrompt } from '../../components/session/BubblePermissionPrompt'
import { useFloatingBubble } from '../../hooks/useFloatingBubble'
import { useLiveActivity } from '../../hooks/useLiveActivity'
import {
  requestNotificationPermission,
  dismissSessionNotification,
} from '../../lib/bubbleNotification'
import type { SetPrefill } from '../../types'
import { useSessions } from '../../hooks/useSessions'
import { useSessionExercises } from '../../hooks/useSessionExercises'
import { useLiveSetsByExercise, useSetActions } from '../../hooks/useSets'
import { SessionEndConfirmation } from '../../components/session/SessionEndConfirmation'
import { ExercisePicker } from '../../components/session/ExercisePicker'
import { ExerciseCreator } from '../../components/session/ExerciseCreator'
import { SetEntrySheet } from '../../components/session/SetEntrySheet'
import { CardioSetEntrySheet } from '../../components/session/CardioSetEntrySheet'
import { SetRow } from '../../components/session/SetRow'
import { RestTimerBar } from '../../components/session/RestTimerBar'
import { UndoToast } from '../../components/session/UndoToast'
import { useRestTimer } from '../../hooks/useRestTimer'
import {
  SURFACE_BASE,
  SURFACE_RAISED,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  GHOST_DIM,
  BORDER_SUBTLE,
} from '../../constants'
import type { DisplayExercise, DbExercise, DbSet } from '../../types'

interface ExerciseSetListProps {
  exerciseId: string
  sessionId: string
  unit: 'kg' | 'lb'
  onDeleteSet: (set: DbSet) => void
  deletionLocked: boolean
}

function ExerciseSetList({ exerciseId, sessionId, unit, onDeleteSet, deletionLocked }: ExerciseSetListProps) {
  const sets = useLiveSetsByExercise(sessionId, exerciseId)
  if (sets.length === 0) return null
  return (
    <View style={styles.setList}>
      {sets.map((set, index) => (
        <SetRow
          key={set.id}
          set={set}
          setNumber={index + 1}
          unit={unit}
          onDelete={onDeleteSet}
          deletionLocked={deletionLocked}
        />
      ))}
    </View>
  )
}

export default function ActiveSessionScreen() {
  const phase = useSessionStore((s) => s.phase)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const sessionExerciseIds = useSessionStore((s) => s.sessionExerciseIds)
  const addExerciseToSession = useSessionStore((s) => s.addExerciseToSession)
  const unit = useSettingsStore((s) => s.unit)
  const { endSession, discardSession, getSetCount } = useSessions()
  const { deleteSetForUndo, restoreSet, logStrengthSet } = useSetActions()

  const sessionExercises = useSessionExercises(sessionExerciseIds)
  const { startTimer } = useRestTimer()

  const setBubbleMode = useSessionStore((s) => s.setBubbleMode)
  const { hasShownBubblePrompt, bubbleEnabled, setHasShownBubblePrompt, setBubbleEnabled,
    hasShownLiveActivityPrompt, setHasShownLiveActivityPrompt, setLiveActivityEnabled } =
    useSettingsStore()

  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showExerciseCreator, setShowExerciseCreator] = useState(false)
  const [setCount, setSetCount] = useState(0)
  const [endingInFlight, setEndingInFlight] = useState(false)
  const [activeExerciseForEntry, setActiveExerciseForEntry] = useState<DbExercise | null>(null)
  const [undoData, setUndoData] = useState<DbSet | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const [showBubblePrompt, setShowBubblePrompt] = useState(false)
  const [lastExerciseName, setLastExerciseName] = useState('')
  // P12: currentPrefill updated on set log so bubble shows correct pre-fill values
  const [currentPrefill, setCurrentPrefill] = useState<SetPrefill>({
    weightKg: null,
    reps: null,
    durationS: null,
    distanceM: null,
  })
  // P11: guard against double-tap on Enable/Skip
  const isHandlingBubbleRef = useRef(false)
  // P0: track last active exercise for tap-to-open (AC6) and long-press log (AC7)
  const lastActiveExerciseRef = useRef<DbExercise | null>(null)

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled)
  }, [])

  // Show bubble permission prompt once when a new session starts on Android
  // P2: include hasShownBubblePrompt so async MMKV hydration doesn't re-trigger prompt
  useEffect(() => {
    if (phase !== 'active' || hasShownBubblePrompt || Platform.OS !== 'android') return
    setShowBubblePrompt(true)
  }, [phase, hasShownBubblePrompt])

  // Initialize bubble mode for users who already granted permission
  useEffect(() => {
    if (phase !== 'active' || Platform.OS !== 'android') return
    if (bubbleEnabled) {
      setBubbleMode('bubble')
    } else if (hasShownBubblePrompt) {
      setBubbleMode('notification')
    }
  }, [phase, bubbleEnabled, hasShownBubblePrompt])

  // Request Live Activity permission on iOS — once, on first session start (AC1)
  useEffect(() => {
    if (Platform.OS !== 'ios' || phase !== 'active' || hasShownLiveActivityPrompt) return
    setHasShownLiveActivityPrompt(true)
    LiveActivityModule.requestPermission()
      .then((status) => {
        setLiveActivityEnabled(status === 'granted')
      })
      .catch(() => {})
  }, [phase])

  const handleBubbleEnable = async () => {
    // P11: guard double-tap
    if (isHandlingBubbleRef.current) return
    isHandlingBubbleRef.current = true
    setShowBubblePrompt(false)
    setHasShownBubblePrompt(true)
    if (Platform.OS !== 'android') {
      isHandlingBubbleRef.current = false
      return
    }
    await FloatingBubbleModule.openPermissionSettings()
    // P1: wait for AppState 'active' resume before re-checking permission —
    // openPermissionSettings resolves as soon as the intent fires, before user acts
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return
      sub.remove()
      const status = await FloatingBubbleModule.checkPermission()
      if (status === 'granted') {
        setBubbleEnabled(true)
        setBubbleMode('bubble')
      } else {
        setBubbleMode('notification')
        await requestNotificationPermission()
      }
      isHandlingBubbleRef.current = false
    })
  }

  const handleBubbleSkip = async () => {
    // P11: guard double-tap; P14: guard iOS
    if (isHandlingBubbleRef.current) return
    isHandlingBubbleRef.current = true
    setShowBubblePrompt(false)
    setHasShownBubblePrompt(true)
    if (Platform.OS === 'android') {
      setBubbleMode('notification')
      await requestNotificationPermission()
    }
    isHandlingBubbleRef.current = false
  }

  useLiveActivity({
    exerciseName: lastExerciseName,
    sessionId: activeSessionId,
  })

  useFloatingBubble({
    // AC6: bubble tap brings app to foreground; open SetEntrySheet for last active exercise
    onTapPrefill: (_prefill) => {
      if (lastActiveExerciseRef.current) {
        setActiveExerciseForEntry(lastActiveExerciseRef.current)
      }
    },
    // AC7: native long-press edit sheet confirmed a set; log it without bringing app to foreground
    // prefill.weightKg is stored in kg; logStrengthSet expects display unit — convert back
    onLongPressConfirm: (prefill) => {
      const exercise = lastActiveExerciseRef.current
      if (!activeSessionId || !exercise) return
      if (exercise.type === 'strength' && prefill.weightKg !== null && prefill.reps !== null) {
        const displayWeight = unit === 'lb' ? prefill.weightKg * 2.20462 : prefill.weightKg
        logStrengthSet(exercise.id, displayWeight, prefill.reps)
        setCurrentPrefill(prefill)
        handleSetLogged(exercise.id)
      }
    },
    exerciseName: lastExerciseName,
    currentPrefill,
  })

  const handleEndWorkoutTap = useCallback(async () => {
    if (endingInFlight || showEndConfirmation) return
    const count = await getSetCount()
    if (count === null) {
      return
    }
    setSetCount(count)
    setShowEndConfirmation(true)
  }, [endingInFlight, showEndConfirmation, getSetCount])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showExerciseCreator) {
        setShowExerciseCreator(false)
        return true
      }
      if (showExercisePicker) {
        setShowExercisePicker(false)
        return true
      }
      if (activeExerciseForEntry) {
        setActiveExerciseForEntry(null)
        return true
      }
      if (showEndConfirmation) {
        setShowEndConfirmation(false)
        return true
      }
      if (phase === 'active') {
        handleEndWorkoutTap()
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [
    phase,
    showEndConfirmation,
    showExercisePicker,
    showExerciseCreator,
    activeExerciseForEntry,
    handleEndWorkoutTap,
  ])

  const handleConfirmEnd = async () => {
    if (endingInFlight) return
    setEndingInFlight(true)
    setShowEndConfirmation(false)
    try {
      if (Platform.OS === 'android') {
        await FloatingBubbleModule.hide()
        await dismissSessionNotification()
      } else if (Platform.OS === 'ios') {
        await LiveActivityModule.end()
      }
    } catch {}
    const ok = await endSession()
    setEndingInFlight(false)
    if (ok) {
      router.replace('/session/summary')
    }
  }

  const handleDiscard = async () => {
    if (endingInFlight) return
    setEndingInFlight(true)
    setShowEndConfirmation(false)
    try {
      if (Platform.OS === 'android') {
        await FloatingBubbleModule.hide()
        await dismissSessionNotification()
      } else if (Platform.OS === 'ios') {
        await LiveActivityModule.end()
      }
    } catch {}
    const ok = await discardSession()
    setEndingInFlight(false)
    if (ok) {
      router.replace('/')
    }
  }

  const handleCancelEnd = () => {
    setShowEndConfirmation(false)
  }

  const handleExerciseSelected = (exercise: DisplayExercise) => {
    addExerciseToSession(exercise.id)
    setShowExercisePicker(false)
  }

  const handleOpenCreatorFromPicker = () => {
    setShowExercisePicker(false)
    setShowExerciseCreator(true)
  }

  const handleExerciseCreated = (exercise: DisplayExercise) => {
    addExerciseToSession(exercise.id)
    setShowExerciseCreator(false)
  }

  const handleDeleteSet = useCallback(
    async (set: DbSet) => {
      try {
        await deleteSetForUndo(set.id)
      } catch {
        return  // toast shown by hook; do not show undo for a failed delete
      }
      setUndoData(set)
      setShowUndoToast(true)
    },
    [deleteSetForUndo],
  )

  const handleUndo = useCallback(async () => {
    if (!undoData) return
    try {
      await restoreSet(undoData)
    } finally {
      setUndoData(null)
      setShowUndoToast(false)
    }
  }, [undoData, restoreSet])

  const handleToastDismiss = useCallback(() => {
    setUndoData(null)
    setShowUndoToast(false)
  }, [])

  const handleSetLogged = useCallback((exerciseId: string) => {
    const exercise = sessionExercises.find((e) => e.id === exerciseId)
    const duration = exercise?.rest_timer_seconds ?? useSettingsStore.getState().defaultRestTimerSeconds
    startTimer(duration)
  }, [sessionExercises, startTimer])

  const isEmpty = sessionExerciseIds.length === 0

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <TouchableOpacity
          onPress={handleEndWorkoutTap}
          disabled={endingInFlight}
          accessibilityRole="button"
          accessibilityLabel="End Workout"
          accessibilityState={{ disabled: endingInFlight }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.endButton}>End Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise List */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={[styles.ghostIcon, { opacity: 0.4 }]}>👻</Text>
          <Text style={styles.emptyHeading}>Log your first set.</Text>
          <Text style={styles.emptyBody}>Tap the exercise to get started.</Text>
          <TouchableOpacity
            style={styles.addExercisePill}
            onPress={() => setShowExercisePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Add Exercise"
          >
            <Text style={styles.addExercisePillText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={sessionExercises}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isDeleted = item.deleted_at !== null
              return (
                <View style={styles.exerciseBlock}>
                  <TouchableOpacity
                    style={styles.exerciseCard}
                    onPress={() => {
                      if (!isDeleted) {
                        setActiveExerciseForEntry(item)
                        setLastExerciseName(item.name)
                        lastActiveExerciseRef.current = item
                      }
                    }}
                    disabled={isDeleted}
                    accessibilityRole="button"
                    accessibilityLabel={isDeleted ? `${item.name} (deleted)` : item.name}
                    accessibilityState={{ disabled: isDeleted }}
                  >
                    <Text style={isDeleted ? styles.exerciseNameDeleted : styles.exerciseName}>
                      {isDeleted ? `(deleted) ${item.name}` : item.name}
                    </Text>
                    <Text style={styles.typeTag}>{item.type.toUpperCase()}</Text>
                    {!isDeleted && (
                      <Text style={styles.addSetLabel}>+ Add Set</Text>
                    )}
                  </TouchableOpacity>
                  {activeSessionId && (
                    <ExerciseSetList
                      exerciseId={item.id}
                      sessionId={activeSessionId}
                      unit={unit}
                      onDeleteSet={handleDeleteSet}
                      deletionLocked={showUndoToast}
                    />
                  )}
                </View>
              )
            }}
          />
          <TouchableOpacity
            style={styles.addExerciseFab}
            onPress={() => setShowExercisePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Add Exercise"
          >
            <Text style={styles.addExerciseFabText}>Add Exercise</Text>
          </TouchableOpacity>
        </>
      )}

      <SessionEndConfirmation
        visible={showEndConfirmation}
        setCount={setCount}
        exerciseCount={sessionExerciseIds.length}
        onConfirm={handleConfirmEnd}
        onDiscard={handleDiscard}
        onCancel={handleCancelEnd}
      />

      <ExercisePicker
        visible={showExercisePicker}
        onDismiss={() => setShowExercisePicker(false)}
        onSelect={handleExerciseSelected}
        onCreateNew={handleOpenCreatorFromPicker}
        excludeIds={sessionExerciseIds}
      />

      <ExerciseCreator
        visible={showExerciseCreator}
        onDismiss={() => setShowExerciseCreator(false)}
        onCreated={handleExerciseCreated}
      />

      {activeExerciseForEntry && activeSessionId && (
        activeExerciseForEntry.type === 'cardio' ? (
          <CardioSetEntrySheet
            visible={true}
            exerciseId={activeExerciseForEntry.id}
            exerciseName={activeExerciseForEntry.name}
            sessionId={activeSessionId}
            unit={unit}
            onDismiss={() => setActiveExerciseForEntry(null)}
            onLogged={() => handleSetLogged(activeExerciseForEntry.id)}
          />
        ) : (
          <SetEntrySheet
            visible={true}
            exerciseId={activeExerciseForEntry.id}
            exerciseName={activeExerciseForEntry.name}
            sessionId={activeSessionId}
            unit={unit}
            onDismiss={() => setActiveExerciseForEntry(null)}
            onLogged={() => handleSetLogged(activeExerciseForEntry.id)}
          />
        )
      )}

      {/* Rest Timer — pinned to screen bottom */}
      <RestTimerBar />

      <UndoToast
        visible={showUndoToast}
        onUndo={handleUndo}
        onDismiss={handleToastDismiss}
        screenReaderEnabled={screenReaderEnabled}
      />

      <BubblePermissionPrompt
        visible={showBubblePrompt}
        onEnable={handleBubbleEnable}
        onSkip={handleBubbleSkip}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BASE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SUBTLE,
  },
  headerTitle: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
  },
  endButton: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 150,
  },
  exerciseBlock: {
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  exerciseName: {
    flex: 1,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  exerciseNameDeleted: {
    flex: 1,
    color: INK_DISABLED,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  typeTag: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  addSetLabel: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  setList: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  ghostIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: GHOST_DIM,
  },
  emptyHeading: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  addExercisePill: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addExercisePillText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  addExerciseFab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: SURFACE_BASE,
  },
  addExerciseFabText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
})
