import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  BackHandler,
  AccessibilityInfo,
} from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../../stores/useSessionStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
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
  const { deleteSetForUndo, restoreSet } = useSetActions()

  const sessionExercises = useSessionExercises(sessionExerciseIds)
  const { startTimer } = useRestTimer()

  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showExerciseCreator, setShowExerciseCreator] = useState(false)
  const [setCount, setSetCount] = useState(0)
  const [endingInFlight, setEndingInFlight] = useState(false)
  const [activeExerciseForEntry, setActiveExerciseForEntry] = useState<DbExercise | null>(null)
  const [undoData, setUndoData] = useState<DbSet | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled)
  }, [])

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
                    onPress={() => !isDeleted && setActiveExerciseForEntry(item)}
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
