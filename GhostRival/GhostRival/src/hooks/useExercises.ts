import { isNull } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query'
import { db } from '../db/client'
import { exercises } from '../db/schema'
import { mapDbExerciseToDisplay } from '../db/mappers/exercise.mapper'
import { showToast } from '../lib/toast'
import * as ExercisesQueries from '../db/queries/exercises.queries'
import type { ExerciseType, DisplayExercise } from '../types'

export function useExercises() {
  const { data } = useLiveQuery(
    db.select().from(exercises).where(isNull(exercises.deleted_at)).orderBy(exercises.name),
  )

  async function createExercise(
    name: string,
    type: ExerciseType,
  ): Promise<DisplayExercise | null> {
    try {
      const id = await ExercisesQueries.createExercise(name, type)
      // useLiveQuery auto-updates; return a minimal DisplayExercise for immediate callback use
      return {
        id,
        name: name.trim(),
        type,
        createdAt: new Date(),
      }
    } catch (e) {
      console.error('[Exercises] createExercise failed:', e)
      showToast('Could not save exercise. Try again.', 'error')
      return null
    }
  }

  async function renameExercise(id: string, newName: string): Promise<void> {
    try {
      await ExercisesQueries.renameExercise(id, newName)
    } catch (e) {
      console.error('[Exercises] renameExercise failed:', e)
      showToast('Could not rename exercise. Try again.', 'error')
    }
  }

  async function deleteExercise(id: string): Promise<void> {
    try {
      await ExercisesQueries.softDeleteExercise(id)
    } catch (e) {
      console.error('[Exercises] deleteExercise failed:', e)
      showToast('Could not delete exercise. Try again.', 'error')
    }
  }

  async function checkDuplicateName(
    name: string,
    type: ExerciseType,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      return await ExercisesQueries.checkDuplicateName(name, type, excludeId)
    } catch {
      showToast('Could not verify name. Try again.', 'error')
      return true
    }
  }

  return {
    exercises: (data ?? []).map(mapDbExerciseToDisplay),
    createExercise,
    renameExercise,
    deleteExercise,
    checkDuplicateName,
  }
}
