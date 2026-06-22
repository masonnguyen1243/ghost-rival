import type { GhostType } from '../types'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatGhostCopy(achievedAt: Date, ghostType: GhostType): string {
  if (ghostType === 'all_time_pr') return 'your best ever'

  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - achievedAt.getTime()) / (1000 * 60 * 60 * 24))

  if (ghostType === 'last_session' || daysDiff <= 7) {
    return `you from ${WEEKDAYS[achievedAt.getDay()]}`
  }

  if (daysDiff <= 30) {
    const weeks = Math.round(daysDiff / 7)
    if (weeks === 1) return 'you from last week'
    return `you from ${weeks} weeks ago`
  }

  if (daysDiff <= 90) {
    const months = Math.round(daysDiff / 30)
    if (months === 1) return 'you from last month'
    return `you from ${MONTHS[achievedAt.getMonth()]}`
  }

  return `the you that peaked in ${MONTHS[achievedAt.getMonth()]} ${achievedAt.getFullYear()}`
}

export interface GhostValueInput {
  weight_kg: number | null
  reps: number | null
  duration_s: number | null
  distance_m: number | null
}

export function formatGhostValue(ghost: GhostValueInput, unit: 'kg' | 'lb'): string {
  if (ghost.duration_s !== null) {
    const minutes = Math.floor(ghost.duration_s / 60)
    const seconds = ghost.duration_s % 60
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    if (ghost.distance_m !== null) {
      return `${timeStr} / ${ghost.distance_m}m`
    }
    return timeStr
  }

  if (ghost.weight_kg !== null) {
    const displayWeight =
      unit === 'lb'
        ? `${Math.round(ghost.weight_kg * 2.20462)} lb`
        : `${ghost.weight_kg} kg`
    return `${displayWeight} × ${ghost.reps ?? '?'}`
  }

  return '—'
}
