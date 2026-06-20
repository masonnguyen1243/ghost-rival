import { useEffect, useState } from 'react'
import * as ExercisesQueries from '../db/queries/exercises.queries'
import { showToast } from '../lib/toast'
import type { DbExercise } from '../types'

/**
 * Loads exercise rows for the given IDs (including soft-deleted rows).
 * Returns rows in the same order as `ids` and warns when some IDs cannot be resolved.
 */
export function useSessionExercises(ids: string[]) {
  const [exercises, setExercises] = useState<DbExercise[]>([])
  const idsKey = ids.join(',')

  useEffect(() => {
    let cancelled = false
    if (ids.length === 0) {
      setExercises([])
      return
    }
    ExercisesQueries.getExercisesByIds(ids)
      .then((rows) => {
        if (cancelled) return
        const byId = new Map(rows.map((r) => [r.id, r]))
        const ordered = ids.map((id) => byId.get(id)).filter((r): r is DbExercise => r !== undefined)
        if (ordered.length !== ids.length) {
          console.warn('[useSessionExercises] missing rows for ids:', ids.filter((id) => !byId.has(id)))
        }
        setExercises(ordered)
      })
      .catch((e) => {
        if (cancelled) return
        console.error('[useSessionExercises] load failed:', e)
        showToast('Could not load session exercises.', 'error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  return exercises
}
