import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import {
  SURFACE_BASE,
  SURFACE_RAISED,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
} from '../../constants'
import { EmptyState } from '../../components/common/EmptyState'
import { useExercises } from '../../hooks/useExercises'
import { useSessionStore } from '../../stores/useSessionStore'
import { useSessions } from '../../hooks/useSessions'
import type { DisplayExercise } from '../../types'

function ExercisePlaceholderRow({ exercise }: { exercise: DisplayExercise }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardLeft}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.ghostForming}>Your ghost is forming.</Text>
      </View>
      <Text style={styles.typeTag}>{exercise.type.toUpperCase()}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const { exercises } = useExercises()
  const phase = useSessionStore((s) => s.phase)
  const { startSession } = useSessions()

  const handleStartWorkout = async () => {
    const ok = await startSession()
    if (ok) {
      router.push('/session/active')
    }
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

      {exercises.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            headline="No exercises yet."
            body="Start a workout to create your first exercise. Your ghosts will find you once you've been here before."
          />
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            Come back after your next session and you'll have a ghost to chase.
          </Text>
          {exercises.map((exercise) => (
            <ExercisePlaceholderRow key={exercise.id} exercise={exercise} />
          ))}
        </ScrollView>
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
  subtitle: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCardLeft: {
    flex: 1,
  },
  exerciseName: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  ghostForming: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  typeTag: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
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
