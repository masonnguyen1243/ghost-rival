import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['strength', 'cardio'] }).notNull(),
  created_at: integer('created_at').notNull(),
  deleted_at: integer('deleted_at'),
  rest_timer_seconds: integer('rest_timer_seconds'),
  user_id: text('user_id'),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  started_at: integer('started_at').notNull(),
  ended_at: integer('ended_at'),
  is_draft: integer('is_draft', { mode: 'boolean' }).notNull().default(true),
  user_id: text('user_id'),
})

export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  session_id: text('session_id').notNull().references(() => sessions.id),
  exercise_id: text('exercise_id').notNull().references(() => exercises.id),
  weight_kg: real('weight_kg'),
  reps: integer('reps'),
  duration_s: integer('duration_s'),
  distance_m: real('distance_m'),
  logged_at: integer('logged_at').notNull(),
})

export const ghosts = sqliteTable('ghosts', {
  id: text('id').primaryKey(),
  exercise_id: text('exercise_id').notNull().references(() => exercises.id),
  type: text('type', { enum: ['last_session', 'last_week', 'last_month', 'all_time_pr'] }).notNull(),
  session_id: text('session_id').references(() => sessions.id),
  weight_kg: real('weight_kg'),
  reps: integer('reps'),
  duration_s: integer('duration_s'),
  distance_m: real('distance_m'),
  updated_at: integer('updated_at').notNull(),
  user_id: text('user_id'),
}, (table) => [
  uniqueIndex('ghosts_exercise_type_unique').on(table.exercise_id, table.type),
])

export const hall_of_fame = sqliteTable('hall_of_fame', {
  id: text('id').primaryKey(),
  exercise_id: text('exercise_id').notNull().references(() => exercises.id),
  pr_type: text('pr_type', { enum: ['weight', 'reps', 'volume', 'cardio_pace'] }).notNull(),
  value: real('value').notNull(),
  previous_value: real('previous_value'),
  session_id: text('session_id').references(() => sessions.id),
  achieved_at: integer('achieved_at').notNull(),
  user_id: text('user_id'),
}, (table) => [
  uniqueIndex('hall_of_fame_exercise_pr_type_unique').on(table.exercise_id, table.pr_type),
])

export const sync_queue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  operation: text('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
  table_name: text('table_name').notNull(),
  payload: text('payload').notNull(),
  created_at: integer('created_at').notNull(),
  synced_at: integer('synced_at'),
})
