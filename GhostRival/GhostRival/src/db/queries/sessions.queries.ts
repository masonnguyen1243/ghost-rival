import { eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { sessions, sets } from '../schema'

export async function startSession(): Promise<{ id: string; started_at: number }> {
  const id = crypto.randomUUID()
  const started_at = Math.floor(Date.now() / 1000)
  await db.insert(sessions).values({ id, started_at, ended_at: null, is_draft: true })
  return { id, started_at }
}

export async function endSession(id: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db.update(sessions).set({ ended_at: now, is_draft: false }).where(eq(sessions.id, id))
}

export async function discardSession(id: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id))
}

export async function getSessionSetCount(sessionId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sets)
    .where(eq(sets.session_id, sessionId))
  return result[0]?.count ?? 0
}
