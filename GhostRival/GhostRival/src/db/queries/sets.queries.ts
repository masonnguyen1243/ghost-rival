import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '../client'
import { sets } from '../schema'
import type { DbSet } from '../../types'

export async function logStrengthSet(data: {
  id: string
  sessionId: string
  exerciseId: string
  weightKg: number
  reps: number
  loggedAt: number
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(sets).values({
      id: data.id,
      session_id: data.sessionId,
      exercise_id: data.exerciseId,
      weight_kg: data.weightKg,
      reps: data.reps,
      duration_s: null,
      distance_m: null,
      logged_at: data.loggedAt,
    })
    // PR detection stub — Story 3.3 inserts detectPr(tx, data) here
    try {
      // await detectPr(tx, data.exerciseId, data)  // Epic 3
    } catch (prError) {
      console.error('[PR Detection] Failed — set write preserved:', prError)
    }
  })
}

export async function logCardioSet(data: {
  id: string
  sessionId: string
  exerciseId: string
  durationS: number
  distanceM: number | null
  loggedAt: number
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(sets).values({
      id: data.id,
      session_id: data.sessionId,
      exercise_id: data.exerciseId,
      weight_kg: null,
      reps: null,
      duration_s: data.durationS,
      distance_m: data.distanceM,
      logged_at: data.loggedAt,
    })
    // PR detection stub — Story 3.3 inserts detectPr(tx, data) here
    try {
      // await detectPr(tx, data.exerciseId, data)  // Epic 3
    } catch (prError) {
      console.error('[PR Detection] Failed — set write preserved:', prError)
    }
  })
}

export async function getLastSetForExerciseInSession(
  sessionId: string,
  exerciseId: string,
): Promise<DbSet | null> {
  const result = await db
    .select()
    .from(sets)
    .where(and(eq(sets.session_id, sessionId), eq(sets.exercise_id, exerciseId)))
    .orderBy(desc(sets.logged_at))
    .limit(1)
  return (result[0] as DbSet) ?? null
}

export async function getSetsForExerciseInSession(
  sessionId: string,
  exerciseId: string,
): Promise<DbSet[]> {
  return (await db
    .select()
    .from(sets)
    .where(and(eq(sets.session_id, sessionId), eq(sets.exercise_id, exerciseId)))
    .orderBy(asc(sets.logged_at))) as DbSet[]
}

export async function getSetsForSession(sessionId: string): Promise<DbSet[]> {
  return (await db
    .select()
    .from(sets)
    .where(eq(sets.session_id, sessionId))
    .orderBy(asc(sets.logged_at))) as DbSet[]
}

export async function deleteSet(id: string): Promise<void> {
  await db.delete(sets).where(eq(sets.id, id))
}

export async function restoreSet(data: DbSet): Promise<void> {
  try {
    await db.insert(sets).values({
      id: data.id,
      session_id: data.session_id,
      exercise_id: data.exercise_id,
      weight_kg: data.weight_kg,
      reps: data.reps,
      duration_s: data.duration_s,
      distance_m: data.distance_m,
      logged_at: data.logged_at,
    })
  } catch (e: any) {
    // UNIQUE constraint means row already exists (double-tap undo) — treat as success
    if (e?.message?.includes('UNIQUE')) return
    throw e
  }
}
