---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-19'
inputDocuments:
  - planning-artifacts/briefs/brief-test-project-2026-06-19/brief.md
  - planning-artifacts/prds/prd-test-project-2026-06-19/prd.md
  - planning-artifacts/ux-designs/ux-test-project-2026-06-19/DESIGN.md
  - planning-artifacts/ux-designs/ux-test-project-2026-06-19/EXPERIENCE.md
workflowType: 'architecture'
project_name: 'Ghost Rival'
user_name: 'Mason'
date: '2026-06-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (22 FRs across 8 domains):**

- Exercise Management (FR-1–3): CRUD operations, persistent across sessions
- Session & Set Logging (FR-4–7): Core loop — start/pause/end session, log Strength/Cardio sets, auto Rest Timer
- Floating Bubble / Live Activity (FR-8–9): Platform-specific ambient session surfaces requiring native module bridges
- Ghost Rival System (FR-10–12): Per-exercise Ghost benchmarks (Last Week / Last Month / All-Time PR), live in-session comparison, Ghost retirement on PR
- PR Detection & PR Explosion (FR-13–15): Real-time PR detection on Set confirmation, 10-step full-screen animation sequence, Hall of Fame write
- Infinite Goal Engine (FR-16–17): Post-PR next-target calculation using rate-of-progress algorithm
- Gym Streak & Mercy Days (FR-18–19): Weekly streak tracking + 2 mercy days/month grace mechanism
- Cloud Sync & Account (FR-20–22): Optional account (email/Apple/Google), bidirectional sync, full offline support, data export

**Non-Functional Requirements:**

- **Performance:** Set confirm via Bubble ≤ 200ms; cold start ≤ 3s (mid-range device); Bubble ≤ 2% battery/hour
- **Offline-first:** All core features (logging, PR detection, Ghost comparison, Hall of Fame) function fully offline
- **Privacy:** No analytics, no 3rd-party data sharing, encrypted at rest + in transit, local-only mode fully supported
- **Accessibility:** VoiceOver/TalkBack, Reduced Motion, Smart Invert compatibility, High Contrast Ghost auto-trigger
- **Platform:** iOS 16.1+ and Android 10+ (API 29+), React Native (solo dev)

**Scale & Complexity:**

- Primary domain: Mobile (React Native, cross-platform iOS + Android)
- Complexity level: Medium-High
- Estimated architectural components: ~8-10 major modules

### Technical Constraints & Dependencies

- **React Native** — sole framework; native module bridges required for SYSTEM_ALERT_WINDOW (Android) and ActivityKit/WidgetKit (iOS)
- **Android SYSTEM_ALERT_WINDOW** — requires system settings redirect (not runtime permission dialog); behavior varies across Android versions and OEMs
- **iOS ActivityKit / WidgetKit** — Live Activity requires iOS 16.1+; Dynamic Island requires iPhone 14 Pro+; lock-screen widget for older devices
- **Canonical storage in kg** — unit conversion (kg↔lb) is display-layer only; all stored values are canonical kg
- **Ghost candidate exclusion** — active session_id must be excluded from all Ghost queries at the data layer, not the display layer
- **No pre-built exercise library** — user-defined only; no external data dependency
- **Permanently free** — no monetization backend, no analytics SDK, no ad network

### Cross-Cutting Concerns Identified

1. **Offline-first data layer** — every write must persist locally before any network call; sync queue must drain reliably on reconnect
2. **Session state machine** — complex lifecycle: start → active → (force-close/draft) → resume/discard/save-complete → end; state must survive app termination
3. **PR detection engine** — synchronous evaluation on every Set confirmation; must also run retroactively on draft recovery and multi-device sync merge
4. **Native module bridges** — Floating Bubble (Android) and Live Activity (iOS) each require platform-specific native code; IPC between RN JS thread and native layer must be low-latency (≤200ms)
5. **Animation state machine** — PR Explosion is a 10-step orchestrated sequence with blocking input; Reduced Motion requires a parallel simplified path
6. **Accessibility layer** — Smart Invert flagging, screen reader focus management, swipe-to-delete custom actions, live region announcements
7. **Unit conversion** — kg/lb setting affects display throughout; canonical storage must be consistent; draft recovery must handle mid-session unit changes

## Starter Template Evaluation

### Primary Technology Domain

Mobile (React Native, cross-platform iOS + Android, solo developer)

### Versions at Decision Time

- React Native 0.85 (April 2026) — New Architecture only, no bridge fallback, JSI + Fabric
- Expo SDK 55 — React Native 0.83, React 19.2, Expo Router v7, legacy Architecture dropped
- Expo SDK 56 Beta — full Live Activity + Widgets support (beta, excluded)

### Starter Options Considered

**Option A — React Native CLI 0.85:** Full native control; requires writing both Floating Bubble (Android) and Live Activity (iOS) bridges from scratch in Java/Kotlin and Swift/ObjC respectively.

**Option B — Expo SDK 55 + CNG:** Expo Modules API; Live Activity alpha support already included; Expo Widgets bridge for ActivityKit; CNG workflow generates native projects from config; OTA update capability.

### Selected Starter: Expo SDK 55 + CNG (Continuous Native Generation)

**Rationale:** Ghost Rival requires two heavy native modules (SYSTEM_ALERT_WINDOW overlay + ActivityKit Live Activity). Expo SDK 55 ships Live Activity alpha support, avoiding a full ActivityKit bridge from scratch. Expo Modules API reduces Floating Bubble native code to a single Expo module vs. raw Java + Swift bridges. CNG (`expo prebuild`) manages the `android/` and `ios/` directories, which is critical for a solo developer. OTA update capability allows shipping hot fixes without App Store review delays.

**Initialization Command:**

```bash
npx create-expo-app@latest GhostRival --template blank-typescript
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript (strict mode), React 19.2, React Native 0.83, Hermes V1, New Architecture only (Fabric Renderer + JSI)

**Build Tooling:**
Metro bundler with Hermes bytecode diffing (75% smaller OTA updates), expo-cli for build orchestration, EAS Build for cloud builds

**Navigation:**
Expo Router v7 (file-based routing on top of React Navigation)

**Testing Framework:**
Jest (via jest-expo preset), React Native Testing Library

**Code Organization:**
`/src/app` for screens (Expo Router), `/src/components`, `/src/modules` for native module bridges, `/src/stores` for state management

**Development Experience:**
Hot reload via Metro, Expo Go for rapid iteration on JS-only screens, `expo prebuild` to generate native projects when native modules required, EAS Build for CI/CD

**Note:** Project initialization using this command is the first implementation story. The `expo prebuild` command must be run before developing native modules (Floating Bubble, Live Activity).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Local database and ORM — all data persistence depends on this
- Cloud backend and auth provider — sync and account features depend on this
- State management approach — session lifecycle and UI state depend on this

**Important Decisions (Shape Architecture):**
- Sync queue design — offline-first correctness depends on this
- Encryption strategy — privacy requirements depend on this
- Native module approach for Floating Bubble and Live Activity

**Deferred Decisions (Post-MVP):**
- Crash reporting setup (Sentry) — optional, can be added after first release
- Tablet layout — explicitly out of scope for v1
- Apple Watch / Wear OS integration — Phase 2

### Data Architecture

**Local Database: `expo-sqlite` + `Drizzle ORM v0.31.1`**

Rationale: Drizzle ORM v0.31.1 ships native Expo SQLite integration with `useLiveQuery` (reactive queries that re-render on DB change), `drizzle-kit` for type-safe migrations, and `drizzle-studio-expo` dev tools plugin. Type-safe schema in TypeScript, no additional learning curve for a solo developer. SQLite is the correct choice for Ghost Rival's relational data model (Exercise → Session → Set → Ghost → HallOfFame).

All weights stored in canonical kilograms. Unit conversion (kg ↔ lb) occurs exclusively at the display layer, never at the storage layer.

**Schema domains:**
- `exercises` — id, name, type (strength|cardio), created_at
- `sessions` — id, started_at, ended_at, is_draft
- `sets` — id, session_id, exercise_id, weight_kg, reps, duration_s, distance_m, logged_at
- `ghosts` — id, exercise_id, type (last_week|last_month|all_time_pr), session_id, set data
- `hall_of_fame` — id, exercise_id, pr_type, value, previous_value, achieved_at
- `sync_queue` — id, operation, table_name, payload, created_at, synced_at

**Ghost candidate query rule:** `WHERE session_id != :active_session_id` enforced at the data layer on every Ghost query.

### Authentication & Security

**Cloud Backend: Supabase (`@supabase/supabase-js v2.108.2`)**

Rationale: PostgreSQL backend matches Ghost Rival's relational schema. Supabase Auth supports email/password, Apple Sign In, and Google Sign In natively. Row Level Security (RLS) enforces that each user can only access their own data. EU region hosting available for privacy compliance. Note: Supabase API keys are migrating to publishable/secret key format (sb_publishable_xxx / sb_secret_xxx) by end of 2026 — implementation must use the new format.

**Auth methods:**
- Email/password via Supabase Auth
- Apple Sign In via `expo-apple-authentication`
- Google Sign In via `expo-auth-session`
- Local-only mode: no account required; full feature parity

**Encryption:**
- In transit: TLS (Supabase default)
- At rest (local): `expo-sqlite` with SQLCipher encryption for sensitive data
- Cloud: Supabase encrypted storage (PostgreSQL at rest encryption)

**Privacy constraints:** No analytics SDK, no ad network, no third-party data sharing. Supabase RLS is the only data access gate — no server-side business logic that could log user data.

### State Management

**Zustand v5.0.14**

Rationale: Lightweight (~1KB), zero-boilerplate, hooks-based API. Manages only ephemeral UI and session state — persistent data lives in SQLite. Drizzle `useLiveQuery` handles reactive DB-to-UI binding for list views.

**Store architecture:**
- `useSessionStore` — active session lifecycle: phase (idle|active|draft), current exercise, rest timer state, PR explosion trigger
- `useSettingsStore` — unit preference (kg|lb), default rest timer, account state
- `useSyncStore` — sync queue status, last synced timestamp, connectivity state

No global store for exercises, sets, or Hall of Fame data — these are driven by Drizzle `useLiveQuery` hooks directly in components.

### API & Communication

**Sync strategy: Offline-first queue + Supabase Realtime**

- Every write (Set log, Session end, PR record, settings change) is committed to SQLite first, then enqueued in `sync_queue`
- Background sync drainer processes the queue when connectivity is detected
- Conflict resolution: last write wins per row, using `logged_at` / `updated_at` timestamps
- Ghost candidate queries always exclude the active session at the data layer
- No real-time multiplayer or collaboration — sync is single-user backup only

### Infrastructure & Deployment

- **Build:** EAS Build (cloud builds for iOS + Android)
- **Distribution:** EAS Submit → App Store + Google Play
- **OTA updates:** Expo Updates (hot fixes bypass store review for JS-layer changes; native module changes still require store update)
- **Environments:** `development` (Expo Go + local Supabase), `staging` (EAS dev build + Supabase staging project), `production` (EAS production + Supabase production project)
- **Crash reporting:** Sentry (deferred — add post-MVP if needed; privacy-compliant self-hosted option available)

### Decision Impact Analysis

**Implementation Sequence:**
1. Expo project init + Drizzle schema setup (all features depend on this)
2. Supabase project + RLS policies (auth + sync depend on this)
3. Session state machine + SQLite writes (core loop)
4. Native modules: Floating Bubble (Android) + Live Activity (iOS)
5. Ghost comparison engine + PR detection
6. PR Explosion animation + Hall of Fame
7. Infinite Goal Engine
8. Cloud sync queue drainer
9. Auth flows (optional account)

**Cross-Component Dependencies:**
- PR detection reads from `sets` + `hall_of_fame` → must complete after DB schema
- Ghost query engine depends on `sessions` + `sets` with session exclusion rule
- Floating Bubble IPC must resolve within 200ms SLA (async bridge, not blocking JSI)
- `useLiveQuery` drives Home tab Ghost Row re-renders on every Set commit — verify performance on large datasets

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

8 areas where AI agents could make different choices, resolved by the patterns below.

### Naming Patterns

**Database (Drizzle schema):**
- Columns: `snake_case` (`weight_kg`, `logged_at`, `session_id`)
- Tables: `snake_case`, plural (`exercises`, `sessions`, `sets`, `hall_of_fame`, `sync_queue`)
- Foreign keys: `{table_singular}_id` (`exercise_id`, `session_id`)
- Timestamps: `{action}_at` (`logged_at`, `created_at`, `synced_at`)
- Indexes: `idx_{table}_{column}` (`idx_sets_session_id`, `idx_sets_exercise_id`)
- Enum columns: `text({ enum: [...] })` with string values, never integer enum

**Code:**
- React components: `PascalCase.tsx` (`GhostRow.tsx`, `PrExplosionOverlay.tsx`)
- Custom hooks: `useXxx` prefix (`useSessionStore`, `useLiveGhostQuery`)
- Zustand stores: `use{Domain}Store.ts` (`useSessionStore.ts`, `useSettingsStore.ts`)
- Native module interfaces: `{Feature}Module.ts`
- Native module implementations: `{Feature}Module.android.ts`, `{Feature}Module.ios.ts`
- Expo Router screens: kebab-case in `/src/app/` (`session-active.tsx`, `hall-of-fame.tsx`)
- DB mappers: `map{Source}To{Target}` (`mapDbSetToDisplaySet`)
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase` (`GhostType`, `PrRecord`)

### Structure Patterns

```
/src
  /app              # Expo Router screens (kebab-case)
  /components       # Shared UI components (PascalCase/index.tsx)
  /modules          # Native module bridges
    /floating-bubble
      FloatingBubbleModule.ts          # TS interface
      FloatingBubbleModule.android.ts  # Android impl
      FloatingBubbleModule.ios.ts      # iOS stub — throws UnsupportedPlatformError
    /live-activity
      LiveActivityModule.ts            # TS interface
      LiveActivityModule.ios.ts        # iOS impl
      LiveActivityModule.android.ts    # Android stub — throws UnsupportedPlatformError
  /stores           # Zustand stores (one file per domain)
  /db
    schema.ts        # All Drizzle table definitions
    /queries         # One file per domain (sets.queries.ts, ghost.queries.ts)
    /migrations      # Auto-generated by drizzle-kit
    /mappers         # DB→Display transformers (mapDbSetToDisplaySet, etc.)
  /lib              # Pure utility functions (no React, no RN deps)
  /hooks            # Custom React hooks
  /constants
  /types
```

**Tests:** co-located (`GhostRow.test.tsx` next to `GhostRow.tsx`). DB query tests at `/src/db/queries/*.test.ts` run against actual SQLite — never mock the DB layer.

### Data Format Patterns

- **Weights:** canonical `kg` (float) in DB; unit conversion only at display layer via `formatWeight(value_kg, unit)`
- **Timestamps:** Unix epoch integer in SQLite; convert to `Date` only in `/src/db/mappers/` before returning to components — never in components
- **Booleans:** Drizzle `integer({ mode: 'boolean' })`
- **Supabase → local:** transform via mapper before writing to SQLite; Supabase types must not leak into component layer
- **Platform stubs:** `FloatingBubbleModule.ios.ts` and `LiveActivityModule.android.ts` MUST throw `UnsupportedPlatformError` — never silent no-op; allows test coverage to catch cross-platform call errors

### DB→Display Mapper Pattern

`useLiveQuery` returns raw Drizzle types (timestamps as `number`, not `Date`). All conversion happens in `/src/db/mappers/`, never in hooks or components:

```typescript
// /src/db/mappers/set.mapper.ts
export function mapDbSetToDisplaySet(dbSet: DbSet): DisplaySet {
  return {
    ...dbSet,
    loggedAt: new Date(dbSet.logged_at * 1000),
    weightDisplay: formatWeight(dbSet.weight_kg, getUnit()),
  }
}
```

Hooks call mapper before returning. Components only receive `DisplaySet`.

### State Management Patterns

**Explicit split between Zustand and Drizzle:**

| State | Owner | Reason |
|---|---|---|
| Rest timer countdown | Zustand | Ephemeral — does not need to survive app kill |
| PR explosion pending flag | Zustand | Ephemeral UI trigger |
| Unit preference, default timer | Zustand (persisted) | Settings |
| Active sets in session | Drizzle `useLiveQuery` | Persistent — must survive app kill |
| Exercises, Hall of Fame | Drizzle `useLiveQuery` | Persistent |
| Sync queue status | Zustand | Ephemeral UI indicator |

**Hard rule:** Never copy DB data into Zustand store. `useSessionStore` holds timer state and ephemeral flags only.

**Session recovery pattern:** On app restart, if `sessions` table has a row with `ended_at IS NULL` and `is_draft = true` → Draft Resume modal. Recovery reads from Drizzle directly — Zustand state is gone after app kill.

### PR Detection Pattern

PR detection runs **inside the same Drizzle transaction** as the Set write, but Set write is NEVER rolled back if PR detection fails:

```typescript
// /src/db/queries/sets.queries.ts
export async function confirmSet(tx: DrizzleTransaction, setData: SetInput) {
  // 1. Commit set — never rolled back by PR failure
  await tx.insert(setsTable).values(setData)

  // 2. PR detection with inner try/catch — failure does not affect set write
  try {
    const pr = await detectPr(tx, setData.exercise_id, setData)
    if (pr) {
      await tx.insert(hallOfFameTable).values(pr)
      // HallOfFame insert → useLiveQuery detects new row →
      // Zustand prExplosionPending = { exerciseId, prData } → overlay renders
    }
  } catch (prError) {
    console.error('[PR Detection] Failed — set write preserved:', prError)
    // A missed PR is acceptable; a lost set write is not
  }
}
```

**PR Explosion signal path:** `hallOfFame` insert in transaction → Drizzle `useLiveQuery` on `hallOfFame` table detects new row → component sets `useSessionStore.prExplosionPending` → `PrExplosionOverlay` renders.

**Enforcement:** `detectPr()` and `confirmSet()` live in `/src/db/queries/` — not exported outside the `db` module except via session actions in stores. Components never import directly from `/src/db/queries/`.

### Native Module Patterns

**≤200ms constraint is an async SLA, not a blocking synchronous call.** Floating Bubble IPC uses an async bridge that must complete within ≤200ms. Do not use JSI blocking sync calls (blocks JS thread, no graceful degradation). If >200ms, log a warning and continue — do not throw.

```typescript
// /src/modules/floating-bubble/FloatingBubbleModule.ts
export interface FloatingBubbleModule {
  show(options: BubbleOptions): Promise<void>
  hide(): Promise<void>
  updateState(state: BubbleState): Promise<void>  // SLA ≤200ms
  onTap(callback: (prefill: SetPrefill) => void): () => void
}
```

Components import only from the interface — never from platform implementation files.

### Error Handling Patterns

```typescript
// Standard pattern for a Zustand action that calls a DB operation
const confirmSetAction = async (setData: SetInput) => {
  try {
    await db.transaction(async (tx) => confirmSet(tx, setData))
  } catch (e) {
    console.error('[Session] confirmSet failed:', e)
    // Sentry.captureException(e) — add post-MVP at this single call site
    showToast('Could not save set. Try again.', 'error')
    // No manual store rollback needed — persistent state reflects Drizzle
  }
}
```

**`showToast(message: string, type: 'error' | 'info')`** defined at `/src/lib/toast.ts` — single entry point; never call toast library directly in components or stores.

**Error logging:** `console.error` in dev. Sentry is deferred post-MVP — when added, insert at the single call site in the catch block above.

### Enforcement Guidelines

**All AI agents MUST:**
- Store weight in canonical `kg` — never `lb` in the DB
- Store timestamps as Unix epoch integer — never ISO string in SQLite
- Call `confirmSet(tx, ...)` with the transaction object, not the top-level `db`
- Wrap PR detection in inner try/catch — never let PR failure roll back the set write
- Import native modules only via interface at `/src/modules/` — never import platform files directly
- Convert DB types to display types only in `/src/db/mappers/`
- Call `showToast()` from `/src/lib/toast.ts` — never call toast library directly
- Platform stubs MUST throw `UnsupportedPlatformError` — never silent no-op

**Anti-patterns to avoid:**
```typescript
// ❌ lb stored in DB
{ weight_kg: weightInLbs }

// ❌ PR detection outside transaction / using db instead of tx
await db.insert(sets).values(data)
await detectPr(db, exerciseId, data)  // WRONG — must be tx, inside transaction

// ❌ Importing platform implementation directly
import { FloatingBubble } from './FloatingBubbleModule.android'

// ❌ Date conversion in component
const date = new Date(set.logged_at * 1000)  // WRONG — use mapper

// ❌ iOS stub as silent no-op
export const FloatingBubbleModule = { show: async () => {} }  // WRONG — must throw
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
GhostRival/
├── app.json                          # Expo config (sdk version, plugins, permissions)
├── eas.json                          # EAS Build profiles (dev/staging/production)
├── package.json
├── tsconfig.json                     # strict mode
├── babel.config.js
├── metro.config.js
├── drizzle.config.ts                 # drizzle-kit config (schema path, migrations dir)
├── .env.example                      # SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                    # EAS Build trigger on PR + main push
│
└── src/
    ├── app/                          # Expo Router v7 screens
    │   ├── _layout.tsx               # Root layout — font loading, DB init, auth gate
    │   ├── +not-found.tsx
    │   ├── (tabs)/
    │   │   ├── _layout.tsx           # Tab bar (Home / Hall of Fame / Settings)
    │   │   ├── index.tsx             # Home tab — Ghost lineup + Streak widget + FAB
    │   │   ├── hall-of-fame.tsx      # Hall of Fame tab — all PRs chronological
    │   │   └── settings.tsx          # Settings — unit, rest timer, account, export
    │   └── session/
    │       ├── active.tsx            # Session full-screen takeover (hides tab bar)
    │       └── summary.tsx           # Post-session read-only summary
    │
    ├── components/
    │   ├── ghost/
    │   │   ├── GhostRow.tsx          # FR-10,11 — exercise card + Ghost benchmark
    │   │   ├── GhostRow.test.tsx
    │   │   └── GhostTypeSelector.tsx # FR-10 — bottom sheet (Last Week/Month/All-Time)
    │   ├── session/
    │   │   ├── SetRow.tsx            # FR-5,6 — logged set with Ghost delta inline
    │   │   ├── SetRow.test.tsx
    │   │   ├── RestTimerBar.tsx      # FR-7 — 3px drain bar at bottom of session
    │   │   ├── ExerciseCreator.tsx   # FR-1 — bottom sheet: name + Strength/Cardio
    │   │   ├── SessionEndConfirmation.tsx  # FR-4 — modal with 0-set guard
    │   │   ├── DraftResumePrompt.tsx       # FR-4 — app restart after force-close
    │   │   ├── HallOfFameSlideInPanel.tsx  # read-only panel mid-session
    │   │   └── UndoToast.tsx               # 4s undo after set delete
    │   ├── pr/
    │   │   ├── PrBadge.tsx           # FR-13 — outline pill in lists, filled in HoF
    │   │   ├── PrExplosionOverlay.tsx # FR-14 — 10-step full-screen sequence
    │   │   └── PrExplosionOverlay.test.tsx
    │   ├── home/
    │   │   ├── GymStreakWidget.tsx   # FR-18,19 — streak count + mercy days
    │   │   └── InfiniteGoalChip.tsx  # FR-16,17 — orange pill with next target
    │   └── common/
    │       ├── EmptyState.tsx        # ghost icon + warm copy per surface
    │       └── TabBar.tsx            # 3-tab, hidden during session
    │
    ├── modules/                      # Native module bridges
    │   ├── floating-bubble/
    │   │   ├── FloatingBubbleModule.ts          # FR-8 — TS interface (SLA ≤200ms)
    │   │   ├── FloatingBubbleModule.android.ts  # Android WindowManager impl
    │   │   └── FloatingBubbleModule.ios.ts      # throws UnsupportedPlatformError
    │   └── live-activity/
    │       ├── LiveActivityModule.ts            # FR-9 — TS interface
    │       ├── LiveActivityModule.ios.ts        # ActivityKit + WidgetKit impl
    │       └── LiveActivityModule.android.ts    # throws UnsupportedPlatformError
    │
    ├── stores/                       # Zustand — ephemeral UI state only
    │   ├── useSessionStore.ts        # timer, prExplosionPending, session phase
    │   ├── useSettingsStore.ts       # unit (kg|lb), defaultRestTimer, account state
    │   └── useSyncStore.ts           # sync queue status, last synced timestamp
    │
    ├── db/
    │   ├── client.ts                 # Drizzle client init + expo-sqlite connection
    │   ├── schema.ts                 # All table definitions (exercises, sessions,
    │   │                             #   sets, ghosts, hall_of_fame, sync_queue)
    │   ├── queries/
    │   │   ├── exercises.queries.ts       # FR-1,2,3 — CRUD
    │   │   ├── exercises.queries.test.ts
    │   │   ├── sessions.queries.ts        # FR-4 — lifecycle, draft detection
    │   │   ├── sessions.queries.test.ts
    │   │   ├── sets.queries.ts            # FR-5,6,7 — confirmSet() wrapping detectPr()
    │   │   ├── sets.queries.test.ts       # covers PR rollback isolation
    │   │   ├── ghosts.queries.ts          # FR-10,11,12 — always excludes active session
    │   │   ├── ghosts.queries.test.ts
    │   │   ├── hall-of-fame.queries.ts    # FR-15 — read-only chronological
    │   │   ├── hall-of-fame.queries.test.ts
    │   │   ├── sync-queue.queries.ts      # FR-21 — enqueue + drain
    │   │   └── sync-queue.queries.test.ts
    │   ├── migrations/               # Auto-generated by drizzle-kit
    │   │   └── 0001_initial.sql
    │   └── mappers/                  # DB → DisplayType transformers
    │       ├── set.mapper.ts              # mapDbSetToDisplaySet (epoch→Date, kg→display)
    │       ├── set.mapper.test.ts
    │       ├── exercise.mapper.ts
    │       ├── ghost.mapper.ts            # Ghost self-narrative copy generation
    │       └── hall-of-fame.mapper.ts
    │
    ├── lib/                          # Pure functions — no React, no RN deps
    │   ├── detectPr.ts               # FR-13 — pure PR logic (called by sets.queries)
    │   ├── detectPr.test.ts
    │   ├── calculateGoalTarget.ts    # FR-16 — Infinite Goal Engine algorithm
    │   ├── calculateGoalTarget.test.ts
    │   ├── formatGhostCopy.ts        # self-narrative copy rules
    │   ├── formatGhostCopy.test.ts
    │   ├── formatWeight.ts           # kg↔lb display conversion
    │   ├── formatWeight.test.ts
    │   ├── toast.ts                  # showToast(message, type) — unified entry point
    │   ├── supabase.ts               # Supabase client init (publishable key)
    │   └── mercyDays.ts              # FR-19 — mercy day calculation
    │
    ├── hooks/
    │   ├── useGhostRows.ts           # useLiveQuery wrapper for Home tab ghost list
    │   ├── useActiveSession.ts       # useLiveQuery for sets in current session
    │   ├── useHallOfFame.ts          # useLiveQuery for HoF entries
    │   └── useRestTimer.ts           # countdown logic feeding useSessionStore
    │
    ├── constants/
    │   └── index.ts                  # DEFAULT_REST_TIMER_SECONDS, MERCY_DAYS_PER_MONTH,
    │                                 # GHOST_DIM_OPACITY, BUBBLE_SLA_MS, etc.
    │
    └── types/
        └── index.ts                  # GhostType, PrType, SetEntry, DisplaySet,
                                      # BubbleState, SetPrefill, SyncOperation, etc.
```

### Requirements to Structure Mapping

| FR Group | Primary Location |
|---|---|
| FR-1–3 Exercise Management | `/src/db/queries/exercises.queries.ts` + `/src/components/session/ExerciseCreator.tsx` |
| FR-4 Session Lifecycle | `/src/db/queries/sessions.queries.ts` + `/src/stores/useSessionStore.ts` + `/src/app/session/` |
| FR-5–6 Set Logging | `/src/db/queries/sets.queries.ts` + `/src/components/session/SetRow.tsx` |
| FR-7 Rest Timer | `/src/hooks/useRestTimer.ts` + `/src/components/session/RestTimerBar.tsx` |
| FR-8 Floating Bubble | `/src/modules/floating-bubble/` |
| FR-9 Live Activity | `/src/modules/live-activity/` |
| FR-10–12 Ghost System | `/src/db/queries/ghosts.queries.ts` + `/src/components/ghost/` |
| FR-13 PR Detection | `/src/lib/detectPr.ts` (pure) → called inside `confirmSet()` in `sets.queries.ts` |
| FR-14 PR Explosion | `/src/components/pr/PrExplosionOverlay.tsx` → triggered via `useSessionStore.prExplosionPending` |
| FR-15 Hall of Fame | `/src/db/queries/hall-of-fame.queries.ts` + `/src/app/(tabs)/hall-of-fame.tsx` |
| FR-16–17 Infinite Goal Engine | `/src/lib/calculateGoalTarget.ts` + `/src/components/home/InfiniteGoalChip.tsx` |
| FR-18–19 Streak & Mercy Days | `/src/lib/mercyDays.ts` + `/src/components/home/GymStreakWidget.tsx` |
| FR-20 Account / Auth | `/src/lib/supabase.ts` + settings screen auth section |
| FR-21 Cloud Sync | `/src/db/queries/sync-queue.queries.ts` + background drain in `/src/lib/supabase.ts` |
| FR-22 Data Export | Settings screen + export utility in `/src/lib/` |

### Architectural Boundaries

**DB Layer → UI Layer:**
Drizzle `useLiveQuery` → `/src/db/mappers/` → `/src/hooks/` → components. No component imports from `/src/db/queries/` directly.

**PR Detection data flow:**
`/src/lib/detectPr.ts` (pure function) → called inside `confirmSet()` in `/src/db/queries/sets.queries.ts` → `hall_of_fame` insert → `useLiveQuery` in `useHallOfFame.ts` detects new row → `useSessionStore.prExplosionPending` set → `PrExplosionOverlay` renders.

**Native module boundary:**
Components → `/src/modules/{feature}/{Feature}Module.ts` interface only. Zero platform-specific code outside `/src/modules/`.

**Supabase boundary:**
Only `/src/lib/supabase.ts` and `/src/db/queries/sync-queue.queries.ts` import from `@supabase/supabase-js`. No component touches Supabase directly.

**Ghost query boundary:**
All queries in `/src/db/queries/ghosts.queries.ts` enforce `WHERE session_id != :activeSessionId` at the SQL level. This exclusion is never delegated to hook or component layer.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**

| Pair | Status |
|---|---|
| Expo SDK 55 + Drizzle ORM v0.31.1 + expo-sqlite | ✅ Drizzle has native Expo SQLite driver |
| Drizzle `useLiveQuery` + Zustand ephemeral split | ✅ No overlap — two completely separate concerns |
| Supabase v2.108.2 + React Native 0.83 | ✅ Official support, publishable key format ready |
| Expo Router v7 + TypeScript strict | ✅ Expo Router v7 ships with full TS support |
| New Architecture (no bridge fallback) + Expo Modules API | ✅ Expo Modules API built for New Architecture |
| PR detection in Drizzle tx + inner try/catch isolation | ✅ Set write unaffected by PR failure |

All patterns are coherent with the tech stack. Naming (snake_case DB ↔ camelCase JS) handled automatically by Drizzle. useLiveQuery → mappers → hooks → components is a unidirectional, consistent boundary. Platform stubs that throw are enforceable via TypeScript.

### Requirements Coverage Validation

**22/22 Functional Requirements have architectural support:**

| FR | Location |
|---|---|
| FR-1–3 Exercise Management | `exercises.queries.ts` + `ExerciseCreator.tsx` |
| FR-4 Session Lifecycle | `sessions.queries.ts` + `useSessionStore.ts` + draft recovery pattern |
| FR-5–6 Set Logging | `sets.queries.ts` (confirmSet) + `SetRow.tsx` |
| FR-7 Rest Timer | `useRestTimer.ts` + `RestTimerBar.tsx` |
| FR-8 Floating Bubble | `/src/modules/floating-bubble/` (≤200ms async SLA) |
| FR-9 Live Activity | `/src/modules/live-activity/` (Expo Widgets alpha) |
| FR-10–12 Ghost System | `ghosts.queries.ts` (active session excluded at SQL) + `GhostTypeSelector.tsx` |
| FR-13 PR Detection | `detectPr.ts` (pure) → `confirmSet()` transaction |
| FR-14 PR Explosion | `PrExplosionOverlay.tsx` ← `useSessionStore.prExplosionPending` ← `useLiveQuery` HoF |
| FR-15 Hall of Fame | `hall-of-fame.queries.ts` + `hall-of-fame.tsx` |
| FR-16–17 Infinite Goal Engine | `calculateGoalTarget.ts` + `InfiniteGoalChip.tsx` |
| FR-18–19 Streak & Mercy Days | `mercyDays.ts` + `GymStreakWidget.tsx` |
| FR-20–22 Cloud Sync & Auth | `supabase.ts` + `sync-queue.queries.ts` + settings screen |

**Non-Functional Requirements:**
- ≤200ms Set confirm: async SLA documented, enforced via module boundary ✅
- Cold start ≤3s: Hermes V1 + Expo SDK 55 lazy loading ✅
- ≤2% battery: to benchmark during Floating Bubble development (constraint documented) ✅
- Offline-first: SQLite write-first + sync queue drain ✅
- Privacy: no analytics SDK, Supabase RLS, no 3rd-party sharing ✅
- Accessibility: fully specified in EXPERIENCE.md; component-level implementation ✅

### Gap Analysis Results

**Critical Gaps:** None — Party Mode resolved the 2 blockers (PR rollback isolation + session state ownership).

**Important Gaps (non-blocking):**
1. **Drizzle migration on-device strategy** — policy should be auto-migrate on app start in `_layout.tsx`; not manual trigger. Add to implementation notes.
2. **`calculateGoalTarget.ts` phase thresholds** — beginner/intermediate/plateau/advanced constants must live in `/src/constants/index.ts`, not hardcoded in the algorithm file.
3. **Export utility filename** — specify as `/src/lib/exportData.ts` (JSON/CSV for FR-22).

**Nice-to-have:**
- DM Sans font loading strategy in `_layout.tsx` (minor implementation detail)
- Supabase RLS policy templates (implementation detail, not architecture)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (22 FRs + NFRs + 2 native modules)
- [x] Cross-cutting concerns mapped (7 concerns)

**Architectural Decisions**
- [x] Critical decisions documented with verified versions
- [x] Technology stack fully specified (Expo 55 / RN 0.83 / Drizzle 0.31.1 / Supabase 2.108.2 / Zustand 5.0.14)
- [x] Integration patterns defined (sync queue, Supabase boundary, native module boundary)
- [x] Performance considerations addressed (≤200ms SLA, cold start, battery constraint)

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified (PR signal path, native module TS interface)
- [x] Process patterns documented (PR tx isolation, error handling, session recovery)

**Project Structure**
- [x] Complete directory structure defined (all files named)
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete (FR-1 through FR-22)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Canonical kg storage eliminates unit conversion bugs at the source
- PR detection inner try/catch guarantees no Set data loss on PR engine failure
- useLiveQuery-driven UI eliminates stale cache bugs entirely
- Native module TS interfaces create an enforceable platform boundary
- Session recovery pattern documented before implementation, not discovered as a bug

**Areas for Future Enhancement (post-MVP):**
- Sentry crash reporting (single call-site addition in `toast.ts`)
- Supabase SDK v3 migration when publishable key deprecation takes effect (end of 2026)
- Expo SDK 56 upgrade for full Live Activity support (out of beta)
- SQLCipher encryption for local DB (unencrypted is acceptable for MVP; add in v1.1)

### Implementation Handoff

**First implementation story:**
```bash
npx create-expo-app@latest GhostRival --template blank-typescript
```
Followed immediately by: Drizzle schema setup in `/src/db/schema.ts` — all other features depend on this foundation.

**Implementation sequence:**
1. Project init + Drizzle schema + `client.ts`
2. Supabase project + RLS policies
3. Session state machine + SQLite writes (core loop)
4. Native modules: Floating Bubble (Android) + Live Activity (iOS)
5. Ghost comparison engine + PR detection
6. PR Explosion animation + Hall of Fame
7. Infinite Goal Engine
8. Cloud sync queue drainer
9. Auth flows (optional account)

**AI Agent Guidelines:**
- Refer to this document for all architectural questions before making local decisions
- Follow all patterns exactly — especially PR detection tx isolation and canonical kg storage
- Never import across defined layer boundaries
- When in doubt, check the anti-patterns section first
