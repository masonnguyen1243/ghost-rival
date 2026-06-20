import type { DbExercise, DisplayExercise } from '../../types'

export function mapDbExerciseToDisplay(dbExercise: DbExercise): DisplayExercise {
  return {
    id: dbExercise.id,
    name: dbExercise.name,
    type: dbExercise.type,
    createdAt: new Date(dbExercise.created_at * 1000),
  }
}
