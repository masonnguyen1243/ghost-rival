import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import {
  SURFACE_BASE,
  GHOST_ACCENT,
} from '../../constants'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { mapDbGhostToDisplay } from '../../db/mappers/ghost.mapper'
import { EmptyState } from '../../components/common/EmptyState'
import { GhostRow } from '../../components/ghost/GhostRow'
import { GhostTypeSelector } from '../../components/ghost/GhostTypeSelector'
import { useGhostRows } from '../../hooks/useGhostRows'
import { useSessionStore } from '../../stores/useSessionStore'
import { useSessions } from '../../hooks/useSessions'
import { getAllGhostsForExercise } from '../../db/queries/ghost.queries'
import type { GhostType } from '../../types'
import type { DisplayGhost } from '../../db/mappers/ghost.mapper'

export default function HomeScreen() {
  const { exercisesWithGhosts } = useGhostRows()
  const phase = useSessionStore((s) => s.phase)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const unit = useSettingsStore((s) => s.unit)
  const { startSession } = useSessions()
  const [selectorExerciseId, setSelectorExerciseId] = useState<string | null>(null)
  const [selectorAllGhosts, setSelectorAllGhosts] = useState<Array<{ type: GhostType; ghost: DisplayGhost | null }>>([])
  const [selectorCurrentType, setSelectorCurrentType] = useState<GhostType>('last_session')

  const handleStartWorkout = async () => {
    const ok = await startSession()
    if (ok) {
      router.push('/session/active')
    }
  }

  const handleGhostRowPress = async (exerciseId: string, currentType: GhostType) => {
    const allDbGhosts = await getAllGhostsForExercise(exerciseId, activeSessionId ?? null)
    const allTypes: GhostType[] = ['last_session', 'last_week', 'last_month', 'all_time_pr']
    const ghostMap = allTypes.map((type) => {
      const found = allDbGhosts.find((g) => g.type === type) ?? null
      if (!found || (found.weight_kg === null && found.reps === null && found.duration_s === null)) {
        return { type, ghost: null as DisplayGhost | null }
      }
      return { type, ghost: mapDbGhostToDisplay(found, unit) }
    })
    setSelectorAllGhosts(ghostMap)
    setSelectorCurrentType(currentType)
    setSelectorExerciseId(exerciseId)
  }

  return (
    <View style={styles.container}>
      {/* Session in progress banner */}
      {phase !== 'idle' && (
        <TouchableOpacity
          style={styles.sessionBanner}
          onPress={() => router.push('/session/active')}
          accessibilityRole="button"
          accessibilityLabel="Session in progress — tap to return"
        >
          <Text style={styles.sessionBannerText}>Session in progress — tap to return.</Text>
        </TouchableOpacity>
      )}

      {exercisesWithGhosts.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            headline="No exercises yet."
            body="Start a workout to create your first exercise. Your ghosts will find you once you've been here before."
          />
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          {exercisesWithGhosts.map(({ exercise, ghost, isFallback }) => (
            <GhostRow
              key={exercise.id}
              exercise={exercise}
              ghost={ghost}
              isFallback={isFallback}
              onPress={() => handleGhostRowPress(exercise.id, ghost?.type ?? 'last_session')}
            />
          ))}
        </ScrollView>
      )}

      {selectorExerciseId !== null && (
        <GhostTypeSelector
          exerciseId={selectorExerciseId}
          currentType={selectorCurrentType}
          allGhosts={selectorAllGhosts}
          onSelect={(type) => setSelectorCurrentType(type)}
          onClose={() => setSelectorExerciseId(null)}
        />
      )}

      {/* Start Workout FAB — visible only when idle */}
      {phase === 'idle' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleStartWorkout}
          accessibilityRole="button"
          accessibilityLabel="Start Workout"
        >
          <Text style={styles.fabText}>Start Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BASE,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  sessionBanner: {
    backgroundColor: GHOST_ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sessionBannerText: {
    color: '#000000',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: GHOST_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#000000',
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
})
