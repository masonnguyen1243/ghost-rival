import { useCallback } from 'react'
import { eq, and, asc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query'
import { db } from '../db/client'
import { sets } from '../db/schema'
import * as SetsQueries from '../db/queries/sets.queries'
import * as GhostQueries from '../db/queries/ghost.queries'
import { convertToKg } from '../db/mappers/set.mapper'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useSessionStore } from '../stores/useSessionStore'
import { showToast } from '../lib/toast'
import type { DbSet } from '../types'

export function useLiveSetsByExercise(sessionId: string | null, exerciseId: string): DbSet[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(sets)
      .where(and(eq(sets.session_id, sessionId ?? ''), eq(sets.exercise_id, exerciseId)))
      .orderBy(asc(sets.logged_at)),
    [sessionId, exerciseId],
  )
  if (!sessionId) return []
  return (data as DbSet[]) ?? []
}

export function useLiveSetsForSession(sessionId: string | null): DbSet[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(sets)
      .where(eq(sets.session_id, sessionId ?? ''))
      .orderBy(asc(sets.logged_at)),
    [sessionId],
  )
  if (!sessionId) return []
  return (data as DbSet[]) ?? []
}

export function useSetActions() {
  const unit = useSettingsStore((s) => s.unit)

  const logCardioSet = useCallback(
    async (
      exerciseId: string,
      durationS: number,
      distanceM: number | null,
    ): Promise<{ id: string; loggedAt: number } | null> => {
      try {
        const id = crypto.randomUUID()
        const loggedAt = Math.floor(Date.now() / 1000)
        const sessionId = useSessionStore.getState().activeSessionId
        if (!sessionId) return null
        await SetsQueries.logCardioSet({ id, sessionId, exerciseId, durationS, distanceM, loggedAt })
        return { id, loggedAt }
      } catch (e) {
        console.error('[Sets] logCardioSet failed:', e)
        showToast('Could not log set. Try again.', 'error')
        return null
      }
    },
    [],
  )

  const logStrengthSet = useCallback(
    async (
      exerciseId: string,
      weightRaw: number,
      reps: number,
    ): Promise<{ id: string; loggedAt: number } | null> => {
      try {
        const id = crypto.randomUUID()
        const loggedAt = Math.floor(Date.now() / 1000)
        const weightKg = convertToKg(weightRaw, unit)
        const sessionId = useSessionStore.getState().activeSessionId
        if (!sessionId) return null
        await SetsQueries.logStrengthSet({ id, sessionId, exerciseId, weightKg, reps, loggedAt })
        return { id, loggedAt }
      } catch (e) {
        console.error('[Sets] logStrengthSet failed:', e)
        showToast('Could not log set. Try again.', 'error')
        return null
      }
    },
    [unit],
  )

  const deleteSetForUndo = useCallback(async (id: string): Promise<void> => {
    try {
      await SetsQueries.deleteSet(id)
    } catch (e) {
      console.error('[Sets] deleteSetForUndo failed:', e)
      showToast('Could not delete set. Try again.', 'error')
      throw e
    }
  }, [])

  const restoreSet = useCallback(async (data: DbSet): Promise<void> => {
    try {
      await SetsQueries.restoreSet(data)
    } catch (e) {
      console.error('[Sets] restoreSet failed:', e)
      showToast('Could not restore set. Try again.', 'error')
      throw e
    }
  }, [])

  const getPrefillForExercise = useCallback(
    async (
      exerciseId: string,
      sessionId: string,
    ): Promise<{
      weightKg: number | null
      reps: number | null
      durationS: number | null
      distanceM: number | null
      label: 'Same as last set' | 'From your ghost'
    } | null> => {
      if (!sessionId) return null
      const lastSet = await SetsQueries.getLastSetForExerciseInSession(sessionId, exerciseId)
      if (lastSet) {
        return {
          weightKg: lastSet.weight_kg,
          reps: lastSet.reps,
          durationS: lastSet.duration_s,
          distanceM: lastSet.distance_m,
          label: 'Same as last set',
        }
      }
      const ghost = await GhostQueries.getGhostForExercise(exerciseId, sessionId)
      if (ghost) {
        return {
          weightKg: ghost.weight_kg,
          reps: ghost.reps,
          durationS: ghost.duration_s,
          distanceM: ghost.distance_m,
          label: 'From your ghost',
        }
      }
      return null
    },
    [],
  )

  return { logCardioSet, logStrengthSet, deleteSetForUndo, restoreSet, getPrefillForExercise }
}
