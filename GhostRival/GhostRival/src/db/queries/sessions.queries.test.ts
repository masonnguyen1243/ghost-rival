/**
 * Session query tests.
 *
 * NOTE: expo-sqlite relies on a native module that cannot run in Jest's Node.js environment.
 * These tests mock the DB at the module boundary to verify function signatures,
 * argument handling, and error isolation.
 */

jest.mock('../client', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('../schema', () => ({
  sessions: {
    id: 'id',
    started_at: 'started_at',
    ended_at: 'ended_at',
    is_draft: 'is_draft',
  },
  sets: {
    session_id: 'session_id',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  sql: Object.assign(
    jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ type: 'sql', strings, values })),
    { raw: jest.fn() },
  ),
}))

import {
  startSession,
  endSession,
  discardSession,
  getSessionSetCount,
} from './sessions.queries'
import { db } from '../client'

const mockDb = db as jest.Mocked<typeof db>

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockDb.select as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.insert as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.update as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.delete as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.from as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.where as jest.Mock).mockResolvedValue(undefined)
  ;(mockDb.set as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.values as jest.Mock).mockResolvedValue(undefined)
})

describe('startSession', () => {
  it('inserts a session with epoch started_at and is_draft=true', async () => {
    const before = Math.floor(Date.now() / 1000)
    const result = await startSession()
    const after = Math.floor(Date.now() / 1000)

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        is_draft: true,
        ended_at: null,
      }),
    )

    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    expect(typeof call.id).toBe('string')
    expect(call.id.length).toBeGreaterThan(0)
    expect(call.started_at).toBeGreaterThanOrEqual(before)
    expect(call.started_at).toBeLessThanOrEqual(after)
    expect(typeof result.id).toBe('string')
    expect(result.started_at).toBe(call.started_at)
  })

  it('returns an object containing id (UUID string) and started_at', async () => {
    const result = await startSession()
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
    expect(typeof result.started_at).toBe('number')
  })

  it('uses epoch seconds not milliseconds for started_at', async () => {
    await startSession()
    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    // Epoch seconds for years 2001..2286 fit in [1e9, 1e10). Reject ms (~1e12).
    expect(call.started_at).toBeGreaterThan(1e9)
    expect(call.started_at).toBeLessThan(1e11)
  })
})

describe('endSession', () => {
  it('updates ended_at to current epoch and sets is_draft=false', async () => {
    const before = Math.floor(Date.now() / 1000)
    await endSession('session-id-1')
    const after = Math.floor(Date.now() / 1000)

    expect(mockDb.update).toHaveBeenCalled()
    expect(mockDb.set).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()

    const call = (mockDb.set as jest.Mock).mock.calls[0][0]
    expect(call.is_draft).toBe(false)
    expect(call.ended_at).toBeGreaterThanOrEqual(before)
    expect(call.ended_at).toBeLessThanOrEqual(after)
  })

  it('uses epoch seconds for ended_at', async () => {
    await endSession('session-id-1')
    const call = (mockDb.set as jest.Mock).mock.calls[0][0]
    // Epoch seconds for years 2001..2286 fit in [1e9, 1e10). Reject ms (~1e12).
    expect(call.ended_at).toBeGreaterThan(1e9)
    expect(call.ended_at).toBeLessThan(1e11)
  })
})

describe('discardSession', () => {
  it('deletes the session by id', async () => {
    await discardSession('session-id-1')
    expect(mockDb.delete).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
  })
})

describe('getSessionSetCount', () => {
  it('returns 0 when no sets exist', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue([{ count: 0 }])
    const count = await getSessionSetCount('session-id-1')
    expect(count).toBe(0)
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
  })

  it('returns the count of sets for the session', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue([{ count: 5 }])
    const count = await getSessionSetCount('session-id-1')
    expect(count).toBe(5)
  })

  it('returns 0 when result is empty', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue([])
    const count = await getSessionSetCount('session-id-1')
    expect(count).toBe(0)
  })
})
