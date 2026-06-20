import { mapDbExerciseToDisplay } from './exercise.mapper'
import type { DbExercise } from '../../types'

const makeDbExercise = (overrides?: Partial<DbExercise>): DbExercise => ({
  id: 'exercise-1',
  name: 'Bench Press',
  type: 'strength',
  created_at: 1718764800, // 2024-06-19 00:00:00 UTC in epoch seconds
  deleted_at: null,
  ...overrides,
})

describe('mapDbExerciseToDisplay', () => {
  it('maps id, name, and type directly', () => {
    const result = mapDbExerciseToDisplay(makeDbExercise())
    expect(result.id).toBe('exercise-1')
    expect(result.name).toBe('Bench Press')
    expect(result.type).toBe('strength')
  })

  it('converts epoch seconds to Date', () => {
    const epochSeconds = 1718764800
    const result = mapDbExerciseToDisplay(makeDbExercise({ created_at: epochSeconds }))
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt.getTime()).toBe(epochSeconds * 1000)
  })

  it('handles cardio exercise type', () => {
    const result = mapDbExerciseToDisplay(makeDbExercise({ type: 'cardio' }))
    expect(result.type).toBe('cardio')
  })

  it('does not include deleted_at in display type', () => {
    const result = mapDbExerciseToDisplay(makeDbExercise())
    expect('deleted_at' in result).toBe(false)
  })

  it('does not include created_at epoch in display type', () => {
    const result = mapDbExerciseToDisplay(makeDbExercise())
    expect('created_at' in result).toBe(false)
  })
})
