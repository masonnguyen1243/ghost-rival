export type ExerciseType = 'strength' | 'cardio'

export interface DbExercise {
  id: string
  name: string
  type: ExerciseType
  created_at: number
  deleted_at: number | null
  rest_timer_seconds: number | null
}

export interface DisplayExercise {
  id: string
  name: string
  type: ExerciseType
  createdAt: Date
  restTimerSeconds: number | null
}

export type GhostType = 'last_session' | 'last_week' | 'last_month' | 'all_time_pr'

export type PrType = 'weight' | 'reps' | 'volume' | 'cardio_pace'

export interface SetEntry {
  id: string
  sessionId: string
  exerciseId: string
  weightKg: number | null
  reps: number | null
  durationS: number | null
  distanceM: number | null
  loggedAt: number
}

export interface DisplaySet {
  id: string
  displayWeight: string
  reps: number | null
  durationS: number | null
  distanceM: number | null
  isGhost: boolean
}

export type BubbleState = 'hidden' | 'resting' | 'active' | 'collapsed'

export interface SetPrefill {
  weightKg: number | null
  reps: number | null
  durationS: number | null
  distanceM: number | null
}

export interface BubbleOptions {
  timerSeconds: number
  exerciseName: string
  prefill: SetPrefill
}

export type BubblePermissionStatus = 'granted' | 'denied' | 'not_determined'

export interface LiveActivityOptions {
  exerciseName: string
  timerSeconds: number
  timerRunning: boolean
  sessionId: string
}

export type LiveActivityPermissionStatus = 'granted' | 'denied' | 'not_determined'

export type SyncOperation = 'insert' | 'update' | 'delete'

export type SessionPhase = 'idle' | 'active' | 'draft'

export interface DbSet {
  id: string
  session_id: string
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  duration_s: number | null
  distance_m: number | null
  logged_at: number
}
