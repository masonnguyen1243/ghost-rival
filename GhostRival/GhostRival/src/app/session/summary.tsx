import { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, BackHandler } from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../../stores/useSessionStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useSessionExercises } from '../../hooks/useSessionExercises'
import { useLiveSetsForSession } from '../../hooks/useSets'
import { formatWeight } from '../../db/mappers/set.mapper'
import { formatDuration, formatDistanceDisplay } from '../../db/mappers/cardio.mapper'
import {
  SURFACE_BASE,
  SURFACE_RAISED,
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  GHOST_ACCENT,
} from '../../constants'

// Ghost system lands in Epic 3. Until then we suppress the "first Ghost" callout
// rather than show it for every exercise of every session.
const GHOST_SYSTEM_ENABLED = false

export default function SessionSummaryScreen() {
  const sessionExerciseIds = useSessionStore((s) => s.sessionExerciseIds)
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const reset = useSessionStore((s) => s.reset)
  const unit = useSettingsStore((s) => s.unit)

  const exercises = useSessionExercises(sessionExerciseIds)
  const allSets = useLiveSetsForSession(activeSessionId)

  const handleDone = () => {
    reset()
    router.replace('/')
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDone()
      return true
    })
    return () => sub.remove()
    // handleDone closes over `reset`, which is stable from zustand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatSessionDuration = (startEpoch: number | null): string => {
    if (!startEpoch) return ''
    const durationS = Math.floor(Date.now() / 1000) - startEpoch
    const mins = Math.floor(durationS / 60)
    return mins > 0 ? `${mins} min` : 'Less than a minute'
  }

  const formatDate = (startEpoch: number | null): string => {
    if (!startEpoch) return new Date().toLocaleDateString()
    return new Date(startEpoch * 1000).toLocaleDateString()
  }

  const getExerciseSummary = (exerciseId: string): string => {
    const exerciseSets = allSets.filter((s) => s.exercise_id === exerciseId)
    if (exerciseSets.length === 0) return '0 sets'
    const setLabel = `${exerciseSets.length} ${exerciseSets.length === 1 ? 'set' : 'sets'}`

    const isCardio = exerciseSets.some((s) => s.duration_s !== null && s.weight_kg === null)
    if (isCardio) {
      const totalS = exerciseSets.reduce((sum, s) => sum + (s.duration_s ?? 0), 0)
      const hasDistance = exerciseSets.some((s) => s.distance_m !== null)
      const totalM = hasDistance
        ? exerciseSets.reduce((sum, s) => sum + (s.distance_m ?? 0), 0)
        : null
      const distanceStr = totalM !== null ? formatDistanceDisplay(totalM, unit) : null
      return `${setLabel} · ${formatDuration(totalS)} total${distanceStr ? ' · ' + distanceStr : ''}`
    }

    const volumeKg = exerciseSets.reduce(
      (sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0),
      0,
    )
    const volumeDisplay = formatWeight(volumeKg, unit)
    return `${setLabel} · ${volumeDisplay} total volume`
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeading}>Session Complete</Text>
        <Text style={styles.summaryMeta}>
          {formatDate(sessionStartedAt)}
          {sessionStartedAt ? `  ·  ${formatSessionDuration(sessionStartedAt)}` : ''}
        </Text>

        {exercises.length === 0 ? (
          <Text style={styles.noExercises}>No exercises logged.</Text>
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} style={styles.exerciseBlock}>
              <Text style={styles.exerciseBlockName}>{ex.name}</Text>
              <Text style={styles.exerciseBlockSets}>{getExerciseSummary(ex.id)}</Text>
            </View>
          ))
        )}
      </View>

      {/* First-Ghost callout — wired in Epic 3 (gated on ghost history per exercise) */}
      {GHOST_SYSTEM_ENABLED &&
        exercises.map((ex) => (
          <View key={`ghost-${ex.id}`} style={styles.ghostCallout}>
            <Text style={styles.ghostCalloutText}>
              Your first {ex.name} Ghost has been summoned. Come back next time to beat it.
            </Text>
          </View>
        ))}

      {/* Done button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BASE,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  summaryCard: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  summaryHeading: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    marginBottom: 6,
  },
  summaryMeta: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginBottom: 20,
  },
  noExercises: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  exerciseBlock: {
    marginBottom: 16,
  },
  exerciseBlockName: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseBlockSets: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  ghostCallout: {
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ghostCalloutText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  doneButton: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
  },
  doneButtonText: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
  },
})
