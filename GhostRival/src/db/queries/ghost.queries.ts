import { eq, and, or, isNull, ne, asc, desc } from 'drizzle-orm'
import { db } from '../client'
import { ghosts } from '../schema'
import type { GhostType } from '../../types'
import type { DbGhost } from '../mappers/ghost.mapper'

export async function getGhostForExercise(
  exerciseId: string,
  activeSessionId: string,
): Promise<typeof ghosts.$inferSelect | null> {
  const result = await db
    .select()
    .from(ghosts)
    .where(
      and(
        eq(ghosts.exercise_id, exerciseId),
        or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId)),
      ),
    )
    .orderBy(asc(ghosts.id))
    .limit(1)
  return result[0] ?? null
}

export async function getSelectedGhostForExercise(
  exerciseId: string,
  activeSessionId: string,
): Promise<DbGhost | null> {
  const result = await db
    .select()
    .from(ghosts)
    .where(
      and(
        eq(ghosts.exercise_id, exerciseId),
        or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId)),
      ),
    )
    .orderBy(desc(ghosts.updated_at))
    .limit(1)
  return (result[0] as DbGhost) ?? null
}

export async function getGhostByType(
  exerciseId: string,
  type: GhostType,
  activeSessionId: string,
): Promise<DbGhost | null> {
  const result = await db
    .select()
    .from(ghosts)
    .where(
      and(
        eq(ghosts.exercise_id, exerciseId),
        eq(ghosts.type, type),
        or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId)),
      ),
    )
    .limit(1)
  return (result[0] as DbGhost) ?? null
}

export async function setActiveGhostType(
  exerciseId: string,
  type: GhostType,
): Promise<void> {
  const now = Date.now()
  const existing = await db
    .select({ id: ghosts.id })
    .from(ghosts)
    .where(and(eq(ghosts.exercise_id, exerciseId), eq(ghosts.type, type)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(ghosts)
      .set({ updated_at: now })
      .where(and(eq(ghosts.exercise_id, exerciseId), eq(ghosts.type, type)))
  } else {
    await db.insert(ghosts).values({
      id: crypto.randomUUID(),
      exercise_id: exerciseId,
      type,
      session_id: null,
      weight_kg: null,
      reps: null,
      duration_s: null,
      distance_m: null,
      updated_at: now,
      user_id: null,
    })
  }
}

export async function getAllGhostsForExercise(
  exerciseId: string,
  activeSessionId: string | null,
): Promise<DbGhost[]> {
  const where = activeSessionId
    ? and(
        eq(ghosts.exercise_id, exerciseId),
        or(isNull(ghosts.session_id), ne(ghosts.session_id, activeSessionId)),
      )
    : eq(ghosts.exercise_id, exerciseId)
  const result = await db.select().from(ghosts).where(where)
  return result as DbGhost[]
}
