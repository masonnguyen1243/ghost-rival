/**
 * Set query tests.
 *
 * NOTE: expo-sqlite relies on a native module that cannot run in Jest's Node.js environment.
 * These tests mock the DB at the module boundary to verify function signatures,
 * argument handling, and error isolation.
 */

jest.mock('../client', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    values: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn(),
  },
}))

jest.mock('../schema', () => ({
  sets: {
    id: 'id',
    session_id: 'session_id',
    exercise_id: 'exercise_id',
    weight_kg: 'weight_kg',
    reps: 'reps',
    duration_s: 'duration_s',
    distance_m: 'distance_m',
    logged_at: 'logged_at',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  asc: jest.fn((col) => ({ type: 'asc', col })),
}))

import {
  logStrengthSet,
  logCardioSet,
  getLastSetForExerciseInSession,
  getSetsForExerciseInSession,
  getSetsForSession,
  deleteSet,
  restoreSet,
} from './sets.queries'
import { db } from '../client'
import type { DbSet } from '../../types'

const mockDb = db as jest.Mocked<typeof db>

const mockSet: DbSet = {
  id: 'set-id-1',
  session_id: 'session-1',
  exercise_id: 'exercise-1',
  weight_kg: 100,
  reps: 10,
  duration_s: null,
  distance_m: null,
  logged_at: 1700000000,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockDb.select as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.insert as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.delete as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.from as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.where as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.orderBy as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.limit as jest.Mock).mockResolvedValue([])
  ;(mockDb.values as jest.Mock).mockResolvedValue(undefined)
  ;(mockDb.transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof mockDb) => Promise<void>) => fn(mockDb))
})

describe('logStrengthSet', () => {
  it('inserts a set row inside a transaction', async () => {
    await logStrengthSet({
      id: 'set-id-1',
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      weightKg: 100,
      reps: 10,
      loggedAt: 1700000000,
    })

    expect(mockDb.transaction).toHaveBeenCalled()
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'set-id-1',
        session_id: 'session-1',
        exercise_id: 'exercise-1',
        weight_kg: 100,
        reps: 10,
        duration_s: null,
        distance_m: null,
        logged_at: 1700000000,
      }),
    )
  })

  it('sets duration_s and distance_m to null for strength sets', async () => {
    await logStrengthSet({
      id: 'set-id-2',
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      weightKg: 60,
      reps: 5,
      loggedAt: 1700000010,
    })
    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    expect(call.duration_s).toBeNull()
    expect(call.distance_m).toBeNull()
  })
})

describe('logCardioSet', () => {
  it('inserts a cardio set row inside a transaction with null weight_kg and reps', async () => {
    await logCardioSet({
      id: 'cardio-set-1',
      sessionId: 'session-1',
      exerciseId: 'exercise-cardio',
      durationS: 1500,
      distanceM: 5000,
      loggedAt: 1700000100,
    })
    expect(mockDb.transaction).toHaveBeenCalled()
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cardio-set-1',
        session_id: 'session-1',
        exercise_id: 'exercise-cardio',
        weight_kg: null,
        reps: null,
        duration_s: 1500,
        distance_m: 5000,
        logged_at: 1700000100,
      }),
    )
  })

  it('stores null distanceM when no distance provided', async () => {
    await logCardioSet({
      id: 'cardio-set-2',
      sessionId: 'session-1',
      exerciseId: 'exercise-cardio',
      durationS: 900,
      distanceM: null,
      loggedAt: 1700000200,
    })
    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    expect(call.distance_m).toBeNull()
    expect(call.weight_kg).toBeNull()
    expect(call.reps).toBeNull()
    expect(call.duration_s).toBe(900)
  })
})

describe('getLastSetForExerciseInSession', () => {
  it('returns the last set when one exists', async () => {
    ;(mockDb.limit as jest.Mock).mockResolvedValue([mockSet])
    const result = await getLastSetForExerciseInSession('session-1', 'exercise-1')
    expect(result).toEqual(mockSet)
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(mockDb.limit).toHaveBeenCalledWith(1)
  })

  it('returns null when no sets exist', async () => {
    ;(mockDb.limit as jest.Mock).mockResolvedValue([])
    const result = await getLastSetForExerciseInSession('session-1', 'exercise-1')
    expect(result).toBeNull()
  })
})

describe('getSetsForExerciseInSession', () => {
  it('returns sets ordered by logged_at ascending', async () => {
    const sets = [mockSet]
    ;(mockDb.orderBy as jest.Mock).mockResolvedValue(sets)
    const result = await getSetsForExerciseInSession('session-1', 'exercise-1')
    expect(result).toEqual(sets)
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
  })

  it('returns empty array when no sets exist', async () => {
    ;(mockDb.orderBy as jest.Mock).mockResolvedValue([])
    const result = await getSetsForExerciseInSession('session-1', 'exercise-1')
    expect(result).toEqual([])
  })
})

describe('getSetsForSession', () => {
  it('selects all sets for the session ordered by logged_at', async () => {
    const sets = [mockSet]
    ;(mockDb.orderBy as jest.Mock).mockResolvedValue(sets)
    const result = await getSetsForSession('session-1')
    expect(result).toEqual(sets)
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
  })
})

describe('deleteSet', () => {
  it('deletes set by id', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue(undefined)
    await deleteSet('set-id-1')
    expect(mockDb.delete).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
  })
})

describe('restoreSet', () => {
  it('re-inserts the set with original id and logged_at', async () => {
    await restoreSet(mockSet)
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockSet.id,
        session_id: mockSet.session_id,
        exercise_id: mockSet.exercise_id,
        weight_kg: mockSet.weight_kg,
        reps: mockSet.reps,
        logged_at: mockSet.logged_at,
      }),
    )
  })
})
