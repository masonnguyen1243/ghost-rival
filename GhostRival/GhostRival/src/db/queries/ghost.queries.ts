import { eq, and, or, isNull, ne, asc } from 'drizzle-orm'
import { db } from '../client'
import { ghosts } from '../schema'

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
