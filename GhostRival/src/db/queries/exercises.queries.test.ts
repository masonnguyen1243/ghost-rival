/**
 * Exercise query tests.
 *
 * NOTE: expo-sqlite relies on a native module (requireNativeModule('ExpoSQLite'))
 * that cannot run in Jest's Node.js environment. These tests mock the DB at the
 * module boundary to verify function signatures, argument handling, and error
 * isolation. Full integration tests require a native runner (Detox / EAS device test).
 */

jest.mock('../client', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    limit: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../schema', () => ({
  exercises: {
    id: 'id',
    name: 'name',
    type: 'type',
    created_at: 'created_at',
    deleted_at: 'deleted_at',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  isNull: jest.fn((col) => ({ type: 'isNull', col })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  ne: jest.fn((col, val) => ({ type: 'ne', col, val })),
  sql: Object.assign(jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ type: 'sql', strings, values })), {
    raw: jest.fn(),
  }),
}))

import {
  listActiveExercises,
  createExercise,
  renameExercise,
  softDeleteExercise,
  checkDuplicateName,
} from './exercises.queries'
import { db } from '../client'

const mockDb = db as jest.Mocked<typeof db>

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockDb.select as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.insert as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.update as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.from as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.where as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.orderBy as jest.Mock).mockResolvedValue([])
  ;(mockDb.set as jest.Mock).mockReturnValue(mockDb)
  ;(mockDb.values as jest.Mock).mockResolvedValue(undefined)
  ;(mockDb.limit as jest.Mock).mockResolvedValue([])
})

describe('listActiveExercises', () => {
  it('selects exercises ordered by name', async () => {
    await listActiveExercises()
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
  })

  it('returns empty array when no exercises exist', async () => {
    ;(mockDb.orderBy as jest.Mock).mockResolvedValue([])
    const result = await listActiveExercises()
    expect(result).toEqual([])
  })
})

describe('createExercise', () => {
  it('inserts exercise with trimmed name, correct type, and epoch timestamp', async () => {
    const before = Math.floor(Date.now() / 1000)
    await createExercise('  Bench Press  ', 'strength')
    const after = Math.floor(Date.now() / 1000)

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bench Press',
        type: 'strength',
      }),
    )

    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    expect(call.id).toBeTruthy()
    expect(typeof call.id).toBe('string')
    expect(call.created_at).toBeGreaterThanOrEqual(before)
    expect(call.created_at).toBeLessThanOrEqual(after)
  })

  it('returns the generated UUID id', async () => {
    const id = await createExercise('Squat', 'strength')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('trims whitespace from name before saving', async () => {
    await createExercise('  Run  ', 'cardio')
    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    expect(call.name).toBe('Run')
  })

  it('stores epoch seconds not milliseconds', async () => {
    const msBefore = Date.now()
    await createExercise('Deadlift', 'strength')
    const call = (mockDb.values as jest.Mock).mock.calls[0][0]
    // Epoch in seconds should be much smaller than ms timestamp
    expect(call.created_at).toBeLessThan(msBefore)
  })
})

describe('renameExercise', () => {
  it('calls update with trimmed new name', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue(undefined)
    await renameExercise('exercise-id-1', '  New Name  ')
    expect(mockDb.update).toHaveBeenCalled()
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }))
    expect(mockDb.where).toHaveBeenCalled()
  })
})

describe('softDeleteExercise', () => {
  it('sets deleted_at to current epoch', async () => {
    ;(mockDb.where as jest.Mock).mockResolvedValue(undefined)
    const before = Math.floor(Date.now() / 1000)
    await softDeleteExercise('exercise-id-1')
    const after = Math.floor(Date.now() / 1000)

    expect(mockDb.update).toHaveBeenCalled()
    const call = (mockDb.set as jest.Mock).mock.calls[0][0]
    expect(call.deleted_at).toBeGreaterThanOrEqual(before)
    expect(call.deleted_at).toBeLessThanOrEqual(after)
  })
})

describe('checkDuplicateName', () => {
  it('returns false when no duplicates found', async () => {
    ;(mockDb.limit as jest.Mock).mockResolvedValue([])
    const result = await checkDuplicateName('Bench Press', 'strength')
    expect(result).toBe(false)
  })

  it('returns true when duplicate found', async () => {
    ;(mockDb.limit as jest.Mock).mockResolvedValue([{ id: 'existing-id' }])
    const result = await checkDuplicateName('Bench Press', 'strength')
    expect(result).toBe(true)
  })

  it('includes excludeId condition when provided', async () => {
    ;(mockDb.limit as jest.Mock).mockResolvedValue([])
    await checkDuplicateName('Bench Press', 'strength', 'current-id')
    // The ne() function should have been called with the excludeId
    const { ne } = jest.requireMock('drizzle-orm')
    expect(ne).toHaveBeenCalledWith(expect.anything(), 'current-id')
  })

  it('does not include excludeId condition when not provided', async () => {
    jest.clearAllMocks()
    ;(mockDb.select as jest.Mock).mockReturnValue(mockDb)
    ;(mockDb.from as jest.Mock).mockReturnValue(mockDb)
    ;(mockDb.where as jest.Mock).mockReturnValue(mockDb)
    ;(mockDb.limit as jest.Mock).mockResolvedValue([])

    await checkDuplicateName('Bench Press', 'strength')
    const { ne } = jest.requireMock('drizzle-orm')
    expect(ne).not.toHaveBeenCalled()
  })
})
