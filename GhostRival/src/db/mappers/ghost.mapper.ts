import type { GhostType } from '../../types'
import { formatGhostCopy, formatGhostValue } from '../../lib/formatGhostCopy'

export interface DbGhost {
  id: string
  exercise_id: string
  type: GhostType
  session_id: string | null
  weight_kg: number | null
  reps: number | null
  duration_s: number | null
  distance_m: number | null
  updated_at: number
  user_id: string | null
}

export interface DisplayGhost {
  id: string
  exerciseId: string
  type: GhostType
  sessionId: string | null
  weightKg: number | null
  reps: number | null
  durationS: number | null
  distanceM: number | null
  updatedAt: Date
  narrativeCopy: string
  valueDisplay: string
  badgeLabel: string
}

const BADGE_LABELS: Record<GhostType, string> = {
  last_session: 'LAST SESSION',
  last_week: 'LAST WEEK',
  last_month: 'LAST MONTH',
  all_time_pr: 'ALL-TIME PR',
}

export function mapDbGhostToDisplay(dbGhost: DbGhost, unit: 'kg' | 'lb'): DisplayGhost {
  const updatedAt = new Date(dbGhost.updated_at)
  return {
    id: dbGhost.id,
    exerciseId: dbGhost.exercise_id,
    type: dbGhost.type,
    sessionId: dbGhost.session_id,
    weightKg: dbGhost.weight_kg,
    reps: dbGhost.reps,
    durationS: dbGhost.duration_s,
    distanceM: dbGhost.distance_m,
    updatedAt,
    narrativeCopy: formatGhostCopy(updatedAt, dbGhost.type),
    valueDisplay: formatGhostValue(dbGhost, unit),
    badgeLabel: BADGE_LABELS[dbGhost.type],
  }
}
