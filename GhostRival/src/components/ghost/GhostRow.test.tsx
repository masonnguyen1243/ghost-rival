import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GhostRow } from './GhostRow'
import type { DisplayExercise } from '../../types'
import type { DisplayGhost } from '../../db/mappers/ghost.mapper'

const mockExercise: DisplayExercise = {
  id: 'ex-1',
  name: 'Bench Press',
  type: 'strength',
  createdAt: new Date('2026-01-01'),
  restTimerSeconds: 90,
}

const mockGhost: DisplayGhost = {
  id: 'ghost-1',
  exerciseId: 'ex-1',
  type: 'last_week',
  sessionId: null,
  weightKg: 80,
  reps: 5,
  durationS: null,
  distanceM: null,
  updatedAt: new Date('2026-06-14'),
  narrativeCopy: 'you from last week',
  valueDisplay: '80 kg × 5',
  badgeLabel: 'LAST WEEK',
}

describe('GhostRow', () => {
  it('renders correctly with a valid ghost', async () => {
    const { getByText } = await render(
      <GhostRow exercise={mockExercise} ghost={mockGhost} onPress={() => {}} />,
    )
    expect(getByText('Bench Press')).toBeTruthy()
    expect(getByText('you from last week')).toBeTruthy()
    expect(getByText('80 kg × 5')).toBeTruthy()
    expect(getByText('LAST WEEK')).toBeTruthy()
  })

  it('renders correctly with null ghost (AC5)', async () => {
    const { getByText, queryByText } = await render(
      <GhostRow exercise={mockExercise} ghost={null} onPress={() => {}} />,
    )
    expect(getByText('Bench Press')).toBeTruthy()
    expect(getByText('No ghost yet — come back after your first session.')).toBeTruthy()
    expect(queryByText('LAST WEEK')).toBeNull()
  })

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(
      <GhostRow exercise={mockExercise} ghost={mockGhost} onPress={onPress} />,
    )
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('sets correct accessibility label with ghost (AC8)', async () => {
    const { getByRole } = await render(
      <GhostRow exercise={mockExercise} ghost={mockGhost} onPress={() => {}} />,
    )
    const button = getByRole('button')
    expect(button.props.accessibilityLabel).toBe(
      'Bench Press. Ghost: you from last week. LAST WEEK 80 kg × 5.',
    )
  })

  it('sets accessibility label without ghost', async () => {
    const { getByRole } = await render(
      <GhostRow exercise={mockExercise} ghost={null} onPress={() => {}} />,
    )
    const button = getByRole('button')
    expect(button.props.accessibilityLabel).toBe('Bench Press. No ghost yet.')
  })
})
