import { eq, isNull, and, ne, sql, inArray } from 'drizzle-orm'
import { db } from '../client'
import { exercises } from '../schema'
import type { ExerciseType } from '../../types'

export async function listActiveExercises() {
  return db.select().from(exercises).where(isNull(exercises.deleted_at)).orderBy(exercises.name)
}

export async function createExercise(name: string, type: ExerciseType): Promise<string> {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(exercises).values({ id, name: name.trim(), type, created_at: now })
  return id
}

export async function renameExercise(id: string, newName: string): Promise<void> {
  await db.update(exercises).set({ name: newName.trim() }).where(and(eq(exercises.id, id), isNull(exercises.deleted_at)))
}

export async function softDeleteExercise(id: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db.update(exercises).set({ deleted_at: now }).where(and(eq(exercises.id, id), isNull(exercises.deleted_at)))
}

export async function getExercisesByIds(ids: string[]) {
  if (ids.length === 0) return []
  return db.select().from(exercises).where(inArray(exercises.id, ids))
}

export async function setExerciseRestTimerSeconds(id: string, seconds: number | null): Promise<void> {
  await db
    .update(exercises)
    .set({ rest_timer_seconds: seconds })
    .where(and(eq(exercises.id, id), isNull(exercises.deleted_at)))
}

export async function checkDuplicateName(
  name: string,
  type: ExerciseType,
  excludeId?: string,
): Promise<boolean> {
  const conditions = [
    sql`lower(${exercises.name}) = lower(${name.trim()})`,
    eq(exercises.type, type),
    isNull(exercises.deleted_at),
    ...(excludeId ? [ne(exercises.id, excludeId)] : []),
  ]
  const result = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(...conditions))
    .limit(1)
  return result.length > 0
}
