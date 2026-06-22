import { isNull, desc, and, or, ne, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query'
import { db } from '../db/client'
import { exercises, ghosts } from '../db/schema'
import { mapDbExerciseToDisplay } from '../db/mappers/exercise.mapper'
import { mapDbGhostToDisplay } from '../db/mappers/ghost.mapper'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useSessionStore } from '../stores/useSessionStore'
import type { DisplayExercise } from '../types'
import type { DisplayGhost } from '../db/mappers/ghost.mapper'

export interface ExerciseWithGhost {
  exercise: DisplayExercise
  ghost: DisplayGhost | null
  /** true when the displayed ghost is a fallback (AC4): user's selected type had no data */
  isFallback: boolean
}

export function useGhostRows(): { exercisesWithGhosts: ExerciseWithGhost[] } {
  const unit = useSettingsStore((s) => s.unit)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)

  const { data: rawExercises } = useLiveQuery(
    db.select().from(exercises).where(isNull(exercises.deleted_at)).orderBy(exercises.name),
  )

  // P6 (ARCH-9): exclude active session at SQL level, never in JS
  const { data: rawGhosts } = useLiveQuery(
    activeSessionId
      ? db
          .select()
          .from(ghosts)
          .where(or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId)))
          .orderBy(desc(ghosts.updated_at))
      : db.select().from(ghosts).orderBy(desc(ghosts.updated_at)),
  )

  const exercisesWithGhosts: ExerciseWithGhost[] = (rawExercises ?? []).map((ex) => {
    const displayExercise = mapDbExerciseToDisplay(ex)

    // P3: scan all matching ghosts in updated_at desc order; skip placeholders to find the
    // first ghost that has real metric data (handles the case where a placeholder was most
    // recently touched by setActiveGhostType)
    const exerciseGhosts = (rawGhosts ?? []).filter((g) => g.exercise_id === ex.id)

    // The most-recently-updated ghost reflects the user's selected type (via updated_at bump)
    const selectedTypeGhost = exerciseGhosts[0] ?? null
    const selectedTypeIsPlaceholder =
      selectedTypeGhost === null ||
      (selectedTypeGhost.weight_kg === null &&
        selectedTypeGhost.reps === null &&
        selectedTypeGhost.duration_s === null)

    const matchingGhost = exerciseGhosts.find((g) => {
      const isPlaceholder =
        g.weight_kg === null && g.reps === null && g.duration_s === null
      return !isPlaceholder
    }) ?? null

    if (!matchingGhost) {
      return { exercise: displayExercise, ghost: null, isFallback: false }
    }

    // isFallback=true when the selected type was a placeholder and we fell back to another ghost
    const isFallback = selectedTypeIsPlaceholder

    return {
      exercise: displayExercise,
      ghost: mapDbGhostToDisplay(matchingGhost as Parameters<typeof mapDbGhostToDisplay>[0], unit),
      isFallback,
    }
  })

  return { exercisesWithGhosts }
}
