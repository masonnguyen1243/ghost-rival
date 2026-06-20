---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-06-19'
inputDocuments:
  - planning-artifacts/prds/prd-test-project-2026-06-19/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-designs/ux-test-project-2026-06-19/DESIGN.md
  - planning-artifacts/ux-designs/ux-test-project-2026-06-19/EXPERIENCE.md
---

# Ghost Rival - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Ghost Rival, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: User can create an Exercise by entering a name (max 60 characters, free text) and selecting a type (Strength or Cardio). Duplicate name within the same type is rejected with an inline error. Exercise is immediately available to add to a Session after creation.

FR-2: User can rename an existing Exercise. Historical Sets, Sessions, and Ghost records are preserved and reassociated to the new name. Changing Exercise type after creation is out of scope.

FR-3: User can delete an Exercise with explicit confirmation. All associated data is soft-deleted (retained in cloud backup; removed from all UI surfaces).

FR-4: User can start, pause, and end a Session. Only one active Session at a time. Session auto-saves to draft if the app is force-closed mid-session; user is prompted to resume or discard on next open. Session timer runs from start to end. Session summary shown on end: exercises logged, total Sets, total Volume, Ghost delta per Exercise.

FR-5: Within a Session, user can log a Strength Set by entering weight and reps. Weight field supports kg or lb (unit set globally in app settings). Reps are positive whole numbers. Pre-fill values are editable before confirmation.

FR-6: Within a Session, user can log a Cardio Set by entering duration and optionally distance. Duration format: mm:ss. If distance is entered, pace is calculated and displayed automatically. Ghost comparison uses duration and/or distance, whichever fields are populated.

FR-7: After each confirmed Set, the Rest Timer starts automatically. Default duration: 90 seconds globally; configurable per Exercise. Timer surfaces on Floating Bubble (Android) or Live Activity (iOS). Completion triggers haptic feedback. User can skip or extend the timer from the Bubble/Live Activity without opening the app.

FR-8: On Android, user can enable a persistent Floating Bubble (SYSTEM_ALERT_WINDOW permission) during an active Session. Bubble displays countdown timer, current Exercise name, next Set pre-fill. Single tap confirms next Set; long-press opens editor to adjust values before confirming. Bubble persists across all apps until Session ends or dismissed. If permission denied: falls back to persistent notification with confirm action. Bubble only present during active Session.

FR-9: On iOS 16.1+, an active Session launches a Live Activity on the Dynamic Island (supported devices) and lock screen. Live Activity shows Rest Timer countdown and next Set pre-fill. Tap deep-links into the active Session screen. Live Activity ends when Session ends or is paused for more than 8 hours. On devices without Dynamic Island: lock screen only.

FR-10: User can set the active Ghost type per Exercise. Default: Last Week. If no data exists for the selected type, UI shows: "No [type] Ghost yet — complete a session to set one." Ghost type selection persists until user changes it. Takes effect on next Set logged for that Exercise in current Session (or immediately, outside a Session).

FR-11: During a Session, each logged Set is displayed alongside the corresponding Ghost Set for that Exercise. Display: "You: 80 kg × 5 | Ghost: 75 kg × 5 → +5 kg ahead". If user has logged more Sets than Ghost had, remaining Ghost slots show "—". Comparison updates in real time after each Set. Cardio live-comparison: target Ghost pace shown as live reference during Set; actual vs Ghost pace delta shown post-Set.

FR-12: When a PR is detected, the All-Time PR Ghost retires and a new Ghost is created from the new PR. Retired Ghost is archived in Hall of Fame with date and Session context. New Ghost appears in Ghost lineup immediately after PR Explosion completes. Last Week and Last Month Ghosts update automatically as Sessions accumulate; no explicit retirement event.

FR-13: System detects a PR when a confirmed Set exceeds the all-time best on any of: weight, reps (at equal or higher weight), or Volume (weight × reps). For Cardio: best pace (distance ÷ duration) is the PR metric. PR detection fires immediately after Set confirmation. Multiple PR types from a single Set are all recorded. A second PR on the same metric for the same Exercise in the same Session does not retrigger PR Explosion.

FR-14: On PR detection, the PR Explosion plays: full-screen animation, haptic feedback, "NEW RECORD" card showing old record vs new record, and "View Hall of Fame" CTA. If device is silent: animation only, no sound. User must dismiss (single tap anywhere) before returning to the Session. Session is not ended by the PR Explosion. The old Ghost must visibly retire on screen before the new one appears.

FR-15: User can view a permanent, chronological log of all PRs per Exercise in the Hall of Fame. Each entry: date, Session date, PR type, previous record, new record. Hall of Fame is read-only. Accessible from home screen shortcut and Exercise detail view.

FR-16: After a PR Explosion, system calculates next target weight/reps (or Cardio metric) using the user's average improvement rate over the last 4 Sessions (all available if fewer). Target displays as: "Next target: 105 kg × 4 — estimated by [date]". Estimated date calculated from average time between PRs. If fewer than 2 Sessions: target is next standard increment (+2.5 kg or +1 rep for Strength); no estimated date shown. Goal auto-updates after each PR. User cannot manually override goal in MVP.

FR-17: Active goal for each Exercise is visible on the home/Ghost screen alongside the active Ghost. Goal shown as secondary line under the Ghost; does not replace Ghost display. If no goal exists yet: slot shows "Log more sessions to unlock your next target."

FR-18: System increments Streak by 1 for each calendar week containing at least one completed Session. Streak displayed on home screen. Streak resets to 0 if a full calendar week passes without a completed Session. Streak milestone push notifications at: 4, 8, 12, 26, and 52 weeks.

FR-19: User receives 2 Mercy Days per calendar month. A Mercy Day is consumed automatically when the user would otherwise break a secondary daily-log streak. Mercy Day notification: "Mercy Day used — your streak is safe." Mercy Day count resets on the 1st of each month. Unused Mercy Days do not carry over.

FR-20: User can create an account via email/password, Apple Sign In, or Google Sign In. Account creation is optional. Users who skip can use all features; data is local-only and not backed up. Account prompt shown once during onboarding; dismissible and re-accessible from settings.

FR-21: Sessions, Exercises, Sets, Ghosts, and Hall of Fame data sync bidirectionally between device and cloud. Sync is automatic when connected; no manual action required. All core features function fully offline; sync queues and drains on reconnect. Conflict resolution: most recent write wins per Set. Sync status (last synced timestamp) visible in settings.

FR-22: User can export all data as JSON or CSV from settings. Export includes all Sessions, Exercises, Sets, Hall of Fame entries, and Ghost history. Available with or without a cloud account. Export is downloaded to device; not sent to any external service.

### NonFunctional Requirements

NFR-1: Floating Bubble / Live Activity Set confirm must respond within ≤200ms (async SLA, not blocking JSI sync call).

NFR-2: App cold start to usable state: under 3 seconds on a mid-range device (3 years old).

NFR-3: Floating Bubble must not exceed 2% additional battery drain per active hour. (Benchmark to be established during development.)

NFR-4: All core features (logging, PR detection, Ghost comparison, Hall of Fame) must function fully offline.

NFR-5: Sync queue writes locally; drains automatically on reconnect. Conflict resolution: last write wins per row using logged_at / updated_at timestamps.

NFR-6: User data encrypted at rest (expo-sqlite with SQLCipher for local) and in transit (TLS via Supabase). Cloud: Supabase encrypted storage.

NFR-7: No analytics SDK, no ad network, no third-party data sharing of any kind. Supabase RLS is the only data access gate.

NFR-8: Local-only mode must be fully supported; all features function without an account.

NFR-9: VoiceOver (iOS) / TalkBack (Android) support — all interactive elements have descriptive accessibility labels.

NFR-10: Dynamic Type (iOS) / Font Scale (Android) — all text scales with system font size settings; display numbers reflow with minimum 28pt before truncating.

NFR-11: Minimum 44×44pt/dp touch targets on all interactive elements.

NFR-12: No information conveyed by color alone — always supplemented by text label, position, or opacity.

NFR-13: Reduced Motion compatibility — PR Explosion shockwave replaced by static 200ms pr-burst flash at 40% opacity; all functional behavior preserved; animations instant.

NFR-14: Smart Invert compatibility (iOS) — ghost illustrations, PR Explosion rings/particles, ghost-dim text, ghost-accent indicators, pr-burst elements must set accessibilityIgnoresInvertColors = true.

NFR-15: High Contrast Ghost auto-trigger — when iOS Increase Contrast or Android highTextContrast is active, ghost-dim elements render at full ghost-accent opacity automatically (no user action required within app).

NFR-16: Target platforms: iOS 16.1+ and Android 10+ (API 29+).

NFR-17: Permanently free — no subscription, no ads, no locked features, no monetization of any kind.

### Additional Requirements

- ARCH-1: Project initialized with `npx create-expo-app@latest GhostRival --template blank-typescript` (Expo SDK 55 + CNG); this is Story 1.1 — all other stories depend on this foundation.
- ARCH-2: Drizzle ORM v0.31.1 + expo-sqlite as local database. Schema at `/src/db/schema.ts` (exercises, sessions, sets, ghosts, hall_of_fame, sync_queue). drizzle-kit for migrations; migrations run automatically on app start in `_layout.tsx`.
- ARCH-3: Supabase v2.108.2 as cloud backend. New publishable key format (sb_publishable_xxx / sb_secret_xxx). Row Level Security (RLS) policies required per table.
- ARCH-4: Zustand v5.0.14 for ephemeral UI state only (useSessionStore, useSettingsStore, useSyncStore). Never copy DB data into Zustand; persistent state always driven by Drizzle useLiveQuery.
- ARCH-5: Expo Router v7 (file-based routing); all screen files in `/src/app/` using kebab-case filenames.
- ARCH-6: EAS Build + EAS Submit for CI/CD (iOS + Android cloud builds). Expo Updates for OTA hot fixes (JS-layer only; native changes still require store update). Three environments: development / staging / production.
- ARCH-7: All weights stored in canonical kilograms in DB — never lb. Unit conversion (kg ↔ lb) only at display layer via `formatWeight(value_kg, unit)`.
- ARCH-8: Timestamps stored as Unix epoch integers in SQLite — never ISO strings. Converted to Date objects only in `/src/db/mappers/`.
- ARCH-9: Ghost candidate queries must always exclude the active session at the SQL level (`WHERE session_id != :active_session_id`) — never delegated to hook or component layer.
- ARCH-10: PR detection runs inside the same Drizzle transaction as the Set write. Set write is NEVER rolled back if PR detection fails (inner try/catch isolates PR failure). Implemented in `confirmSet(tx, setData)` in `/src/db/queries/sets.queries.ts`.
- ARCH-11: Native module bridges in `/src/modules/`. Platform stubs MUST throw `UnsupportedPlatformError` — never silent no-op. Components import only from TS interface file, never from platform implementation files.
- ARCH-12: DB→Display type conversion only in `/src/db/mappers/`. Components receive DisplayType only. Hooks call mapper before returning. Mappers handle: epoch→Date, kg→display weight, Ghost self-narrative copy generation.
- ARCH-13: `showToast(message: string, type: 'error' | 'info')` at `/src/lib/toast.ts` is the single entry point for user-facing error display — never call toast library directly in components or stores.
- ARCH-14: Session recovery pattern: on app restart, check `sessions` table for rows with `ended_at IS NULL AND is_draft = true` → Draft Resume modal. Zustand state is gone after app kill; recovery reads from Drizzle directly.
- ARCH-15: `calculateGoalTarget.ts` phase threshold constants (beginner/intermediate/plateau/advanced) must live in `/src/constants/index.ts`, not hardcoded in the algorithm file.
- ARCH-16: Data export utility at `/src/lib/exportData.ts` (JSON/CSV for FR-22).
- ARCH-17: PR Explosion signal path: `hall_of_fame` insert in transaction → `useLiveQuery` on `hall_of_fame` detects new row → component sets `useSessionStore.prExplosionPending` → `PrExplosionOverlay` renders.

### UX Design Requirements

UX-DR1: DM Sans custom font loaded on both iOS and Android via app root `_layout.tsx` — no platform-native fallback; font is bundled with app.

UX-DR2: Full design token system implemented: surface-base (#0d0d0f), surface-raised (#141418), surface-overlay (#1a1a22), ink-primary (#ffffff), ink-secondary (#8888a0), ink-disabled (#3a3a50), ghost-accent (#00e5ff), ghost-dim (rgba(0,229,255,0.40)), pr-burst (#ff6b00), border-subtle (#1e1e28), feedback-error (#ff4444). Orange (pr-burst) reserved for PR-only elements. Cyan (ghost-accent/ghost-dim) reserved for Ghost data only.

UX-DR3: Ghost Row component — exercise name (DM Sans 700/ink-primary), self-narrative copy (body/ink-secondary), Ghost data (display 800/ghost-dim 40% opacity), Ghost type badge (label 500 uppercase/ghost-accent), full-width tap target, tapping opens Ghost Type Selector sheet.

UX-DR4: Set Row component — set number (mono-data/ink-secondary), weight × reps (display/ink-primary), Ghost comparison delta (body/ghost-dim as self-narrative sentence, never +/- numeric delta), PR badge if applicable; pre-fill with last set or Ghost benchmark; swipe-to-delete within 30s (90s with screen reader).

UX-DR5: PR Badge component — outline-only (pr-burst border, transparent fill) in list contexts (Ghost Row, Set Row). Filled pr-burst background only in Hall of Fame entries.

UX-DR6: PR Explosion Overlay — 10-step full-screen sequence: haptic → screen lock → shockwave burst (3 rings: ghost-accent 60%, pr-burst 80%, pr-burst 40%; 80ms staggered) + particle scatter → background dim → Ghost retire animation (float up 40dp + fade over 400ms) → NEW RECORD card (slide up spring 300ms) → new Ghost materialize (fade in 0→40% over 400ms) → HoF write → user dismiss. No auto-dismiss. Full-bleed, 0 corner radius, no rounded corners.

UX-DR7: Floating Bubble (Android) — 56dp circle, surface-overlay background, ghost-accent border 1.5px, drop shadow (0 4px 16px rgba(0,0,0,0.6)); one-tap routes to Session with pre-filled Set (2 taps total to confirm); long-press opens minimal edit sheet near Bubble without opening app; pulses (single radial ghost-accent ring) + heavy haptic at timer zero; "Ready" sub-label persists until next Set logged.

UX-DR8: Live Activity (iOS) — compact DI: ghost icon (leading) + countdown (trailing); expanded/lock screen: exercise name (heading/ink-primary), ghost data (body/ghost-dim), rest timer (display/ink-primary); read-only on lock screen (iOS constraint); tap deep-links to Session.

UX-DR9: Session Summary Card — per-exercise blocks (sets logged, volume total, Ghost comparison delta, PR badge if applicable); first-Ghost callout panel in surface-overlay for first session on any exercise; no share/export/rating prompts of any kind.

UX-DR10: Hall of Fame Entry Row — PR badge filled pr-burst (only context where filled badge appears in a list); PR type label in label-typography uppercase; chronological newest-first order; per-exercise filtered view via tapping exercise name.

UX-DR11: Tab Bar — 3 tabs (Home/Hall of Fame/Settings), hidden during Session, icon-only when inactive, icon + label when active, no badge indicators, no notification dots.

UX-DR12: Empty States — per-surface warm copy without urgency: Home/no exercises: "No exercises yet." / "Start a workout..."; Home/no Ghost: "Your ghost is forming." / "Come back after your next session..."; Hall of Fame/no PRs: "No records yet." / "Every rep you do becomes history..."; Session/no sets: "Log your first set." / "Tap the exercise to get started."

UX-DR13: Rest Timer Bar — 3px height, full-width, ghost-accent fill draining left-to-right; pr-burst flash (600ms) at zero; numeric countdown displayed separately above the bar in mono-data/ink-primary; pinned to bottom of Session screen.

UX-DR14: Infinite Goal Chip — rounded-pill, pr-burst border 1.5px, transparent fill, arrow-up icon (pr-burst), "Next target: [value]" label (label-typography/pr-burst); dismissible on PR Explosion overlay; persistent on Ghost Row; hidden from Ghost Row when plateau detected (5+ consecutive sessions without PR).

UX-DR15: Gym Streak Widget — streak count (display/ink-primary) with "WEEK STREAK" label; mercy day indicator: small dot indicator visible only on active Mercy Day (no count surfaced); streak count never turns red; tap opens tooltip on first interaction explaining weekly cadence and Mercy Day rules.

UX-DR16: Ghost Type Selector — 4 options (Last Session / Last Week / Last Month / All-Time PR), radio-style with ghost-accent checkmark on selected; each option shows value + time reference (ghost-dim); no-data options show footnote in ink-disabled: "No session in this range"; accessibilityRole="radio" and accessibilityState={{ checked: isSelected }} on each option.

UX-DR17: Session End Confirmation — heading "End this session?", "[N] sets · [duration]" in ink-secondary; "End Workout" CTA in pr-burst fill (intentional — one of two non-PR orange uses); "Keep Going" in ink-secondary; 0-set guard: primary CTA becomes "End Anyway" with warning to require conscious intent.

UX-DR18: Exercise Creator — text field for name (max 60 chars, feedback-error inline for duplicate: "You already have an exercise with this name."), Strength/Cardio toggle (selected option: pr-burst border/ink-primary, unselected: border-subtle/ink-secondary), "Add" CTA enabled only when name ≥ 1 char and no validation error.

UX-DR19: Draft Resume Prompt — "Resume" always visible; "Start Fresh" always visible (requires second confirmation: "Discard this session?"); "Save as Complete" promoted to primary CTA when draft > 2h old. On "Save as Complete": draft finalized as completed session, PR detection runs retroactively on all recovered Sets, PR Explosions fire sequentially for qualifying Sets before returning to Home.

UX-DR20: Undo Toast — appears after swipe-to-delete on Set Row; "Set deleted" + "Undo" link (ghost-accent); auto-dismisses after 4s (8s when VoiceOver/TalkBack active); accessibilityLiveRegion set on toast container; tapping "Undo" restores Set Row in place.

UX-DR21: Hall of Fame Slide-In Panel — accessible from session header button; slides over Session from bottom (60% height); read-only HoF per exercise with horizontal filter tabs; session continues uninterrupted while panel open; dismiss via swipe-down or close button.

UX-DR22: Ghost self-narrative copy rules — Within last 7 days: "you from [day]"; 8–30 days: "you from last week" or "you from [N] weeks ago"; 31–90 days: "you from last month" or "you from [month]"; 90+ days: "the you that peaked in [month + year]"; All-Time PR: "your best ever". Never data-label format ("Last Week Ghost", "All-Time PR type").

UX-DR23: Smart Invert compatibility (iOS) — the following must set `accessibilityIgnoresInvertColors = true`: Ghost icon illustrations, PR Explosion rings and particles, all ghost-dim text elements, all ghost-accent indicators, all pr-burst elements.

UX-DR24: PR Explosion screen reader — VoiceOver/TalkBack announce "New personal record: [value]. Previous: [old value]. Saved to Hall of Fame." before card content; accessibilityViewIsModal = true (iOS) / importantForAccessibility="yes" (Android); traversal order: announcement → "NEW RECORD" heading → new value → "Previous" line → "Saved to Hall of Fame" → Infinite Goal chip → "Continue" button; on dismiss, focus returns to the Set Row that triggered the PR.

UX-DR25: Swipe-to-delete screen reader equivalent — "Delete" custom action via accessibilityActions on Set Row so VoiceOver rotor / TalkBack custom actions users can delete without swipe gesture.

UX-DR26: PR rollback after swipe-to-delete — if Set deleted within edit window after triggering PR Explosion: Hall of Fame entry retracted and previous Ghost benchmark restored silently; toast: "Set deleted. PR removed from Hall of Fame."

UX-DR27: Session input validation — weight must be > 0 (Log Set button disabled + feedback-error inline note: "Weight must be greater than 0." if violated); reps must be ≥ 1 (same pattern: "Enter at least 1 rep."); errors clear immediately on correction.

UX-DR28: Android predictive back gesture — intercept Back gesture during Session to show End Workout confirmation modal; suppress OS-level predictive back destination preview (peek) during active Session.

UX-DR29: Floating Bubble permission flow — contextual explanation screen before first Session: "Enable" opens system settings for Draw Over Other Apps; "Skip for now" enables notification fallback; prompt shown only once; "Enable Ghost Bubble" link in Settings → Session thereafter.

UX-DR30: SYSTEM_ALERT_WINDOW revocation mid-session — detect permission revocation while Session is active; immediately promote to persistent notification fallback; show one-time toast: "Overlay permission removed — logging via notification instead."

### FR Coverage Map

FR-1: Epic 1 — Exercise creation (name + type, 60-char limit, duplicate validation)
FR-2: Epic 1 — Exercise rename (historical Sets/Ghosts preserved and reassociated)
FR-3: Epic 1 — Exercise soft-delete with explicit confirmation
FR-4: Epic 1 — Session lifecycle (start/pause/end, draft auto-save, basic draft resume/discard, session summary); "Save as Complete" with retroactive PR detection extended in Epic 3
FR-5: Epic 1 — Strength Set logging (weight + reps, unit display, pre-fill hierarchy)
FR-6: Epic 1 — Cardio Set logging (duration + optional distance, pace auto-calculation)
FR-7: Epic 2 — Rest Timer (auto-start after Set, configurable per Exercise, haptic at zero, skip/extend from Bubble/Live Activity)
FR-8: Epic 2 — Android Floating Bubble (SYSTEM_ALERT_WINDOW, one-tap confirm, long-press edit, notification fallback if denied)
FR-9: Epic 2 — iOS Live Activity (Dynamic Island + lock screen, deep-link, auto-end after 8h pause)
FR-10: Epic 3 — Ghost type selection (Last Week default, 4 types, persists per exercise, fallback message if no data)
FR-11: Epic 3 — Live Ghost comparison (inline set-by-set delta, Cardio target pace reference)
FR-12: Epic 3 — Ghost retirement and respawn (All-Time PR Ghost retires on PR, archived to HoF, new Ghost spawns)
FR-13: Epic 3 — PR detection in Drizzle transaction (weight/reps/Volume/Cardio pace; inner try/catch; Set write never rolled back)
FR-14: Epic 3 — PR Explosion 10-step full-screen sequence (haptic, shockwave, Ghost retire animation, NEW RECORD card, new Ghost materialize, user-controlled dismiss)
FR-15: Epic 3 — Hall of Fame (permanent chronological log, read-only, per-exercise view)
FR-16: Epic 4 — Infinite Goal Engine algorithm (rate-of-progress, phase thresholds, rounded to valid increment, estimated date)
FR-17: Epic 4 — Goal display on Ghost Row (secondary line; "Log more sessions" placeholder if no goal yet)
FR-18: Epic 4 — Weekly Gym Streak (weekly cadence, home display, streak reset, milestone push notifications at 4/8/12/26/52 weeks)
FR-19: Epic 4 — Mercy Days (2/month, auto-consumed, notification, monthly reset, unused days do not carry over)
FR-20: Epic 5 — Account creation (email/Apple/Google, optional, local-only mode with full feature parity)
FR-21: Epic 5 — Bidirectional cloud sync (automatic, offline-first queue, last-write-wins conflict resolution, sync status in settings)
FR-22: Epic 5 — Data export (JSON/CSV, all data, local device download, no external service)

## Epic List

### Epic 1: App Foundation & Core Workout Logging
Mason can create exercises, start and end a gym session, log Strength and Cardio sets, and view a session summary — all stored locally and persisting across app restarts. After this epic, Ghost Rival is a fully functional offline workout logger.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6

**Implementation scope:**
- Project init: `npx create-expo-app@latest GhostRival --template blank-typescript` (ARCH-1)
- Drizzle ORM v0.31.1 + expo-sqlite schema: exercises, sessions, sets, ghosts, hall_of_fame, sync_queue (ARCH-2); migrations auto-run on app start in `_layout.tsx`
- Expo Router v7 navigation: Home tab, Hall of Fame tab, Settings tab, Session full-screen takeover, Session Summary (ARCH-5)
- DM Sans custom font (UX-DR1) + full design token system (UX-DR2)
- Zustand stores: useSessionStore, useSettingsStore, useSyncStore (ARCH-4)
- Exercise CRUD: ExerciseCreator bottom sheet (UX-DR18), exercise list in Settings, input validation (UX-DR27)
- Session lifecycle: start/end flow, basic draft resume/discard (FR-4), Session End Confirmation with 0-set guard (UX-DR17)
- Strength Set logging: SetRow (UX-DR4 base), swipe-to-delete within 30s + Undo Toast (UX-DR20), Android predictive back interception (UX-DR28)
- Cardio Set logging: duration + distance entry, pace display
- DB→Display mappers in `/src/db/mappers/` (ARCH-12); `showToast()` at `/src/lib/toast.ts` (ARCH-13); canonical kg storage (ARCH-7); epoch timestamps (ARCH-8)
- Session Summary Card (UX-DR9); Tab Bar hidden during session (UX-DR11); Empty States (UX-DR12)
- EAS Build dev/staging/production profiles (ARCH-6)

---

### Epic 2: Ambient Session — Rest Timer & Platform Overlays
Mason can log his next Set from Instagram, Spotify, or any app via the Android Floating Bubble (one-tap confirm + long-press edit) or see his Rest Timer on the iOS Dynamic Island / lock screen — without leaving what he's doing. After this epic, the "invisible by design" core mechanic is live.

**FRs covered:** FR-7, FR-8, FR-9

**Implementation scope:**
- Rest Timer Bar: 3px ghost-accent drain, pr-burst flash at zero, numeric countdown above bar (UX-DR13)
- Android Floating Bubble native module: FloatingBubbleModule.ts interface + .android.ts implementation + .ios.ts stub throwing UnsupportedPlatformError (ARCH-11); ≤200ms async SLA (NFR-1)
- iOS Live Activity native module: LiveActivityModule.ts interface + .ios.ts implementation via Expo Widgets alpha + .android.ts stub (ARCH-11)
- Floating Bubble permission flow (UX-DR29): contextual explanation before first session, "Enable" → system settings, "Skip" → notification fallback; once-only prompt
- SYSTEM_ALERT_WINDOW revocation mid-session: detect → notification fallback → one-time toast (UX-DR30)
- Live Activity permission: standard iOS Notifications dialog on first session
- Floating Bubble behavior: 56dp circle, ghost-accent border, drop shadow, one-tap to session, long-press edit sheet near Bubble, single radial pulse + heavy haptic at timer zero, "Ready" sub-label persists (UX-DR7)
- Live Activity behavior: compact DI (ghost icon + countdown), expanded lock screen (exercise name + ghost data + rest timer), read-only on lock screen (UX-DR8)
- Session recovery (ARCH-14): Draft Resume Prompt (UX-DR19 — basic resume/discard path only)
- Battery constraint: ≤2% per active hour benchmark (NFR-3)

---

### Epic 3: Ghost Rival System & PR Celebration
Mason races a version of his past self during every session, sees live set-by-set Ghost comparisons, and when he breaks a PR the app stops everything to celebrate — saved permanently in his Hall of Fame. After this epic, the core competitive mechanic that defines Ghost Rival is fully live.

**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15

**Implementation scope:**
- Ghost type selection: GhostTypeSelector bottom sheet (UX-DR16), 4 options (Last Session / Last Week / Last Month / All-Time PR), persists per exercise, fallback for no-data options
- Ghost Row full implementation (UX-DR3): exercise name, self-narrative copy (UX-DR22), Ghost data at ghost-dim 40%, Ghost type badge; empty-state for no-Ghost-yet
- Ghost candidate SQL exclusion at query level: `WHERE session_id != :active_session_id` (ARCH-9)
- Live Ghost comparison: inline set-by-set delta on SetRow (UX-DR4 full) in self-narrative format; Cardio target pace reference
- Ghost comparison copy: time-based hierarchy ("you from Tuesday" / "your best ever") (UX-DR22)
- PR detection: `detectPr.ts` pure function → called inside `confirmSet(tx, setData)` Drizzle transaction with inner try/catch isolation (ARCH-10); weight/reps/Volume/Cardio pace; multiple PR types per Set
- PR signal path: hall_of_fame insert → useLiveQuery detects → useSessionStore.prExplosionPending → PrExplosionOverlay renders (ARCH-17)
- PR Explosion Overlay: 10-step sequence (shockwave rings, particle scatter, Ghost retire animation, NEW RECORD card, new Ghost materialize), no auto-dismiss, full-bleed 0 corner radius (UX-DR6)
- Reduced Motion path for PR Explosion: 200ms pr-burst flash, instant Ghost transitions (NFR-13 / UX-DR26 base)
- Smart Invert compatibility: accessibilityIgnoresInvertColors on Ghost/PR elements (NFR-14 / UX-DR23)
- PR Explosion screen reader: VoiceOver/TalkBack announcement, accessibilityViewIsModal, traversal order, focus return to Set Row (UX-DR24)
- Hall of Fame: hall-of-fame.queries.ts, hall-of-fame.tsx screen, Hall of Fame Entry Row with filled PR badge (UX-DR10), per-exercise filter view
- Hall of Fame Slide-In Panel within active session (UX-DR21)
- Ghost retirement/respawn: retired Ghost archived, new Ghost created and shown after PR Explosion
- PR rollback on swipe-to-delete: Hall of Fame entry retracted, previous Ghost benchmark restored, silent + toast (UX-DR26)
- PR Badge component: outline-only in list contexts, filled pr-burst in HoF only (UX-DR5)
- Swipe-to-delete screen reader equivalent: accessibilityActions "Delete" on Set Row (UX-DR25)
- "Save as Complete" path on Draft Resume: finalize draft, run retroactive PR detection, fire PR Explosions sequentially (extends FR-4 from Epic 1)
- High Contrast Ghost auto-trigger on system accessibility flags (NFR-15)

---

### Epic 4: Progress Visibility & Motivation
After every PR, Mason sees his next target auto-generated based on his rate of progress. He can track his weekly gym streak and has 2 Mercy Days per month for real life — so motivation is always forward-looking, never guilt-based. After this epic, the motivation flywheel is complete.

**FRs covered:** FR-16, FR-17, FR-18, FR-19

**Implementation scope:**
- `calculateGoalTarget.ts`: rate-of-progress algorithm with Beginner/Intermediate/Plateau/Advanced phase thresholds from `/src/constants/index.ts` (ARCH-15); plate-increment rounding (0.5kg/2.5lb); Cardio pace and distance targets; edge cases (first PR, plateau, rapid beginner gains, unit change)
- Infinite Goal Chip: rounded-pill pr-burst border, arrow-up icon, "Next target: [value]" label (UX-DR14); dismissible on PR Explosion overlay; persistent on Ghost Row; hidden when plateau detected (5+ sessions without PR for that exercise)
- Goal display on Ghost Row as secondary line (FR-17); "Log more sessions" placeholder
- `mercyDays.ts`: 2/month limit, auto-consume on secondary daily streak break, monthly reset
- Gym Streak Widget: streak count + "WEEK STREAK" label, mercy day dot indicator (active days only), streak never turns red, tap-to-tooltip on first interaction (UX-DR15)
- Streak milestone push notifications at 4/8/12/26/52 weeks (FR-18)
- Mercy Day notification: "Mercy Day used — your streak is safe." (FR-19)

---

### Epic 5: Cloud Backup & Account
Mason can optionally create an account to back up his training data securely to the cloud, access it from any device after signing in, and export his full data at any time. After this epic, Ghost Rival is ready for production release. Local-only mode remains fully functional with no features removed.

**FRs covered:** FR-20, FR-21, FR-22

**Implementation scope:**
- Supabase v2.108.2 project setup: sb_publishable_xxx key format, RLS policies per table, EU region (ARCH-3)
- `/src/lib/supabase.ts` client init
- Account creation: email/password, Apple Sign In (expo-apple-authentication), Google Sign In (expo-auth-session) (FR-20)
- Onboarding: single-screen "Local only" vs "Sign in" choice on first launch; no interstitials
- Account prompt in onboarding: once-only, dismissible, re-accessible from settings
- Sync queue drainer: background drain on connectivity; writes replayed in chronological order; last-write-wins with logged_at timestamp (FR-21)
- Sync status in Settings: "Syncing…" / "Last synced: [time]" / "Offline — will sync when connected" (no banner on other tabs)
- Multi-device merge: cloud state downloads on new device sign-in, merges with local state
- Data export utility at `/src/lib/exportData.ts`: JSON + CSV, all data, device-local only (FR-22 / ARCH-16)
- Local encryption: SQLCipher for expo-sqlite (NFR-6)
- Account deletion: two-step confirmation (Step 1: modal with warning, Step 2: type "DELETE" to confirm)
- EAS Submit production profiles for App Store + Google Play (ARCH-6)

---

## Epic 1: App Foundation & Core Workout Logging

Mason can create exercises, start and end a gym session, log Strength and Cardio sets, and view a session summary — all stored locally and persisting across app restarts. After this epic, Ghost Rival is a fully functional offline workout logger.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6

### Story 1.1: Project Foundation & Navigation Shell

As a solo developer (Mason),
I want the Ghost Rival project initialized with Expo SDK 55, Drizzle ORM, full database schema, and the base navigation structure,
So that all subsequent stories have a working, typed foundation to build upon.

**Acceptance Criteria:**

**Given** the developer runs `npx create-expo-app@latest GhostRival --template blank-typescript`
**When** the project initializes
**Then** the project uses React Native 0.83, React 19.2, TypeScript strict mode, Hermes V1, and New Architecture only

**Given** Drizzle ORM v0.31.1 and expo-sqlite are installed
**When** `drizzle.config.ts` is configured
**Then** `/src/db/schema.ts` defines all 6 tables: `exercises`, `sessions`, `sets`, `ghosts`, `hall_of_fame`, `sync_queue` with correct column types (snake_case columns, `integer({ mode: 'boolean' })` for booleans, epoch integers for timestamps, canonical kg floats for weights)

**Given** the app starts
**When** `_layout.tsx` root layout initializes
**Then** the Drizzle migration runs automatically, DM Sans font loads (weights 400/500/600/700/800), and the DB client at `/src/db/client.ts` is initialized before any screen renders

**Given** the design token and constants system is in place
**When** any component references a color, spacing, or constant
**Then** all values come from `/src/constants/index.ts` including all color tokens (surface-base `#0d0d0f`, surface-raised `#141418`, surface-overlay `#1a1a22`, ink-primary `#ffffff`, ink-secondary `#8888a0`, ink-disabled `#3a3a50`, ghost-accent `#00e5ff`, ghost-dim `rgba(0,229,255,0.40)`, pr-burst `#ff6b00`, border-subtle `#1e1e28`, feedback-error `#ff4444`) and operational constants (`DEFAULT_REST_TIMER_SECONDS = 90`, `MERCY_DAYS_PER_MONTH = 2`, `GHOST_DIM_OPACITY = 0.40`, `BUBBLE_SLA_MS = 200`)

**Given** Expo Router v7 is configured
**When** the app renders
**Then** a 3-tab layout (Home / Hall of Fame / Settings) renders with `surface-raised` tab bar background and `border-subtle` top border; tab bar shows icon-only when inactive, icon + label when active; no badge indicators on any tab

**Given** the session screen scaffold exists at `/src/app/session/active.tsx`
**When** a session activates (implemented in Story 1.3)
**Then** the tab bar will be hidden (scaffold in place now; hide behavior wired in Story 1.3)

**Given** the Zustand stores are defined
**When** any component imports a store
**Then** `useSessionStore`, `useSettingsStore`, `useSyncStore` are importable with correct initial types; no DB data is ever copied into Zustand stores

**Given** EAS Build is configured
**When** `eas.json` is present
**Then** development, staging, and production build profiles are defined; `.env.example` documents `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (stub values — Supabase integration is Epic 5)

**Given** the Home tab is visible with no data
**When** the app renders
**Then** the correct empty state displays: ghost icon at 40% opacity, headline "No exercises yet.", body copy "Start a workout to create your first exercise. Your ghosts will find you once you've been here before."

**Given** the app cold-starts on a mid-range device (3 years old)
**When** the Home tab is visible and interactive
**Then** time from app launch to usable state is under 3 seconds (NFR-2)

---

### Story 1.2: Exercise Management (Create, Rename, Delete)

As Mason,
I want to create exercises by name and type, rename them, and delete them with confirmation,
So that I own my exercise vocabulary and it reflects exactly how I train.

**Acceptance Criteria:**

**Given** I am in an active session and tap "Add Exercise"
**When** the ExerciseCreator bottom sheet opens
**Then** a text field for exercise name (max 60 characters) and a Strength / Cardio type toggle are shown; the "Add" CTA is disabled until name has ≥ 1 character and no validation error; dismiss by swipe-down is supported

**Given** I type a valid name and select Strength or Cardio then tap "Add"
**When** the exercise is saved
**Then** it is written to the `exercises` table immediately and appears in the session exercise list without a refresh

**Given** I type a name identical to an existing exercise of the same type
**When** the duplicate is detected (on each keystroke)
**Then** an inline `feedback-error` message appears below the name field: "You already have an exercise with this name." and the Add CTA remains disabled

**Given** I open an existing exercise in Settings → Exercise Management and rename it
**When** I confirm the rename
**Then** all historical Sets, Sessions, Ghost records, and Hall of Fame entries remain intact and are reassociated to the new name; changing the exercise type after creation is not supported

**Given** I tap "Delete" on an exercise in Settings
**When** I confirm the deletion dialog
**Then** the exercise is soft-deleted: removed from all UI surfaces (Home tab, session exercise picker, Settings list); all associated Sets and Ghost records remain in the local DB; the exercise name is marked "(deleted)" in any in-progress sessions that include it

**Given** a soft-deleted exercise
**When** I start a new session
**Then** the deleted exercise does not appear in the exercise picker

**And** all interactive elements in ExerciseCreator meet the 44×44dp minimum touch target requirement (NFR-11)

---

### Story 1.3: Session Lifecycle — Start, Add Exercises, End

As Mason,
I want to start a workout session, add exercises to it, and end it with a summary,
So that I can track each gym visit as a complete unit from start to finish.

**Acceptance Criteria:**

**Given** I am on the Home tab with no active session
**When** I tap the "Start Workout" FAB (rounded-pill)
**Then** the Session full-screen takeover slides up from the bottom; the tab bar hides; a row is written to `sessions` with `is_draft = true` and `ended_at = NULL`; the FAB is no longer visible

**Given** I am in an active session and tap "Add Exercise"
**When** the exercise picker opens
**Then** I can select from previously created exercises (searchable list) or create a new one via ExerciseCreator sheet; the exercise appears in the session exercise list immediately

**Given** I tap "End Workout"
**When** the Session End Confirmation modal appears
**Then** it shows heading "End this session?", "[X exercises · Y sets logged]" in ink-secondary, "End Workout" CTA with pr-burst fill, and "Keep Going" CTA in ink-secondary

**Given** I confirm "End Workout"
**When** the session is finalized
**Then** the `sessions` row is updated: `ended_at` = current Unix epoch, `is_draft = false`; the Session Summary Card renders (exercises logged, Sets per exercise, Volume per exercise); tab bar returns; FAB reappears

**Given** I have logged 0 sets and tap "End Workout"
**When** the confirmation modal appears
**Then** the summary line shows "No sets logged yet." and the primary CTA changes to "End Anyway"; on confirm, the session is discarded (not saved as completed, no Ghost or Streak effect)

**Given** I tap "Keep Going"
**When** the modal dismisses
**Then** the session remains active with no state changed

**Given** I am in an active session on Android and press the system Back button
**When** the back gesture fires
**Then** the End Workout confirmation modal appears; the OS-level predictive back destination preview is suppressed (UX-DR28)

**And** the Session Summary Card has no share button, no export prompt, and no rating prompt of any kind (UX-DR9)

---

### Story 1.4: Strength Set Logging

As Mason,
I want to log a Strength Set by entering weight and reps with smart pre-fill,
So that recording each set takes under 5 seconds and never interrupts my training flow.

**Acceptance Criteria:**

**Given** I have a Strength exercise in my active session and tap it
**When** the set entry form opens
**Then** weight (in kg or lb per Settings) and reps fields display with the correct pre-fill: (1) previous Set's weight/reps with label "Same as last set" if Sets 2+; (2) Ghost benchmark values with label "From your ghost" if Set 1 and Ghost exists; (3) blank fields if Set 1 and no Ghost

**Given** weight field value is 0 or negative
**When** I attempt to tap "Log Set"
**Then** "Log Set" is disabled; inline `feedback-error` appears below the weight field: "Weight must be greater than 0."; error clears immediately on correction

**Given** reps field value is 0
**When** I attempt to tap "Log Set"
**Then** "Log Set" is disabled; inline `feedback-error` appears: "Enter at least 1 rep."; error clears immediately on correction

**Given** I tap "Log Set" with valid weight and reps
**When** the Set is confirmed
**Then** a row is written to `sets` with `weight_kg` in canonical kilograms (converted from lb if user's unit is lb), `reps` as integer, `logged_at` as Unix epoch integer, `session_id`, and `exercise_id`; a Set Row appears in the exercise list

**Given** a Set Row is visible and less than 30 seconds have elapsed since logging
**When** I swipe left on the Set Row and confirm delete
**Then** the Set is removed from `sets`; an Undo Toast appears ("Set deleted" in ink-secondary + "Undo" link in ghost-accent); toast auto-dismisses after 4 seconds (8 seconds when VoiceOver or TalkBack is active)

**Given** the Undo Toast is visible
**When** I tap "Undo" before dismissal
**Then** the Set Row is restored in place with the original data

**Given** more than 30 seconds have elapsed since logging
**When** I tap the locked Set Row
**Then** a toast appears: "Sets are locked after 30 seconds"

**Given** VoiceOver (iOS) or TalkBack (Android) is active
**When** I navigate to a Set Row
**Then** accessibility label reads: "Set [number]. [Weight] by [reps]."; a "Delete" custom action is available via VoiceOver rotor / TalkBack custom actions menu via `accessibilityActions` (UX-DR25)

**And** the Undo Toast container has `accessibilityLiveRegion` set so screen readers announce "Set deleted" on appearance

---

### Story 1.5: Cardio Set Logging

As Mason,
I want to log a Cardio Set by entering duration and optional distance,
So that cardio sessions are tracked with the same zero-friction experience as strength training.

**Acceptance Criteria:**

**Given** I have a Cardio exercise in my active session and tap it
**When** the set entry form opens
**Then** a duration field (mm:ss format) and an optional distance field are shown; pre-fill follows the same hierarchy as Strength (previous Set duration/distance, or Ghost data, or blank)

**Given** I enter both duration and distance then tap "Log Set"
**When** the Set is confirmed
**Then** pace is calculated and displayed automatically in the Set Row (min/km or min/mile per unit setting)

**Given** duration is 0:00 or empty
**When** I attempt to tap "Log Set"
**Then** "Log Set" is disabled; inline error appears: "Enter a duration greater than 0:00"

**Given** I confirm a Cardio Set
**When** the Set is written to the DB
**Then** `duration_s` is stored in canonical seconds (integer), `distance_m` in canonical meters (float), and `weight_kg` is null; no conversion losses regardless of display unit

**Given** VoiceOver or TalkBack is active and I navigate to a Cardio Set Row
**When** focus lands on the row
**Then** accessibility label includes duration and distance (e.g., "Set 2. 25 minutes, 5 kilometres.")

---

### Story 1.6: Draft Session Recovery (Resume & Discard)

As Mason,
I want my session saved automatically on every Set confirmation so I never lose logged data if the app crashes,
So that a force-close is a minor inconvenience, not a data loss event.

**Acceptance Criteria:**

**Given** I am mid-session and the app is force-closed
**When** I reopen the app
**Then** the Draft Resume Prompt modal fires before the Home tab loads; the modal reads the `sessions` table for rows where `ended_at IS NULL AND is_draft = true`; Zustand state is not used for recovery (it is gone after app kill)

**Given** the draft is less than 2 hours old
**When** the Draft Resume Prompt appears
**Then** "Resume" is the primary CTA (ghost-accent border); "Start Fresh" and "Discard" are secondary options; "Start Fresh" requires a second confirmation: "Discard this session?"

**Given** I tap "Resume"
**When** the session reopens
**Then** all previously logged Sets are present and displayed; Rest Timer resets to the configured default (rest timer state is ephemeral and not preserved across app kills)

**Given** I tap "Start Fresh" and confirm the second dialog
**When** the draft is discarded
**Then** the draft session is deleted and a new session can begin normally

**Given** the draft is 2 or more hours old
**When** the Draft Resume Prompt appears
**Then** "Save as Complete" is promoted to primary CTA; selecting it finalizes the draft (`ended_at` set to original session timeframe, `is_draft = false`); Gym Streak is credited for the original session date
**And** retroactive PR detection on the recovered Sets is deferred to Epic 3 (PR Explosions will fire sequentially on "Save as Complete" after Epic 3 is implemented)

**Given** the unit setting changed between force-close and resume
**When** the draft is resumed or finalized
**Then** all Set weights display in the new unit; canonical kg values in the DB are unchanged — only display representation changes

---

## Epic 2: Ambient Session — Rest Timer & Platform Overlays

Mason can log his next Set from Instagram, Spotify, or any app via the Android Floating Bubble (one-tap confirm) or see his Rest Timer on the iOS Dynamic Island / lock screen — without leaving what he's doing. After this epic, the "invisible by design" core mechanic is live.

**FRs covered:** FR-7, FR-8, FR-9

### Story 2.1: Rest Timer Bar & In-App Timer UX

As Mason,
I want the Rest Timer to start automatically after each Set and be clearly visible in-app,
So that I always know exactly when to start my next set without watching a clock.

**Acceptance Criteria:**

**Given** I confirm a Set in an active session
**When** the Set is logged
**Then** the Rest Timer starts automatically at the configured duration (default: 90 seconds; or per-Exercise duration if configured); a 3px Rest Timer Bar drains ghost-accent left-to-right at the bottom of the Session screen; a numeric countdown displays above the bar in `mono-data / ink-primary`

**Given** the Rest Timer reaches zero
**When** the countdown hits 0
**Then** the Rest Timer Bar flashes `pr-burst` for 600ms then resets; a light haptic fires; the numeric display shows "0:00"

**Given** I navigate to a specific Exercise's settings
**When** I configure a custom rest timer duration
**Then** sessions that include that Exercise use the custom duration; all other exercises use the global default of 90 seconds

**Given** I tap "Skip" on the Rest Timer during a session
**When** the skip action fires
**Then** the Rest Timer stops immediately and resets; no haptic fires

**And** all rest timer controls meet the 44×44dp minimum touch target requirement

---

### Story 2.2: Android Floating Bubble

As Mason,
I want a Floating Bubble to appear over other apps when I leave Ghost Rival mid-session,
So that I can log my next Set with one tap without navigating back to the app.

**Acceptance Criteria:**

**Given** I start a session for the first time
**When** the session begins
**Then** a contextual explanation screen appears before the session starts: "Stay in your flow — the Ghost Bubble lets you log sets without leaving Instagram, Spotify, or wherever you are. Tap 'Enable' to go to settings." with options "Enable (Recommended)" and "Skip for now"; this prompt is shown only once (UX-DR29)

**Given** I tap "Enable"
**When** the Android system Draw Over Other Apps settings screen opens and permission is granted
**Then** the session proceeds with Floating Bubble active

**Given** I tap "Skip for now"
**When** the session starts
**Then** the session proceeds using the notification fallback (persistent notification in the notification shade)

**Given** SYSTEM_ALERT_WINDOW permission is granted and a session is active
**When** I leave Ghost Rival
**Then** a 56dp circular Floating Bubble appears: `surface-overlay` background, `ghost-accent` border 1.5px, drop shadow (0 4px 16px rgba(0,0,0,0.6)), Ghost icon in ghost-accent, Rest Timer countdown in `mono-data / ink-primary` (or "Active" in `label / ink-secondary` when no timer is running)

**Given** the Rest Timer reaches zero while the Bubble is visible
**When** countdown hits 0
**Then** the Bubble pulses once (single radial ghost-accent ring that expands and fades — does not loop); device vibrates (heavy haptic); the sub-label changes to "Ready" in `label / ghost-accent` and persists until the next Set is logged

**Given** I tap the Floating Bubble (one tap)
**When** Ghost Rival comes to foreground
**Then** the Session screen shows the next Set entry pre-filled with the previous Set's weight/reps; a single tap on "Log Set" confirms the Set (2 taps total: Bubble tap → Log Set tap)

**Given** I long-press the Floating Bubble
**When** the edit sheet appears
**Then** a minimal edit sheet anchored near the Bubble shows weight stepper + reps stepper + "Log Set" button; tapping "Log Set" confirms the Set without bringing Ghost Rival to foreground; the edit sheet dismisses automatically; the entire interaction (IPC + confirm) completes within ≤200ms (NFR-1)

**Given** SYSTEM_ALERT_WINDOW permission is denied or "Skip for now" was selected
**When** a session is active and I leave the app
**Then** a persistent notification appears: "Session active — [exercise] in progress. [Rest timer countdown or 'Ready to log']"; tapping the notification routes to the Session screen; no "Log Set" action is available from the notification shade

**Given** I previously skipped the permission prompt
**When** I open Settings → Session
**Then** an "Enable Ghost Bubble" link is available that opens the system Draw Over Other Apps settings

**Given** SYSTEM_ALERT_WINDOW permission is revoked in system settings while a session is active
**When** Ghost Rival detects the revocation
**Then** the app immediately switches to the persistent notification fallback; a one-time toast appears: "Overlay permission removed — logging via notification instead."; no gap in session continuity (UX-DR30)

**Given** a session ends
**When** end is confirmed
**Then** the Floating Bubble disappears immediately

**And** implemented via `FloatingBubbleModule.ts` interface; `FloatingBubbleModule.ios.ts` throws `UnsupportedPlatformError` — never a silent no-op (ARCH-11); battery impact target ≤2% per active hour (NFR-3; benchmark established during development)

---

### Story 2.3: iOS Live Activity

As Mason,
I want a Live Activity in the Dynamic Island and lock screen when I leave Ghost Rival mid-session on iOS,
So that I can see my Rest Timer countdown from anywhere without unlocking my phone.

**Acceptance Criteria:**

**Given** I start a session for the first time on iOS
**When** the session begins
**Then** Ghost Rival requests Notifications permission (standard iOS runtime dialog, which enables Live Activities on iOS 16.1+); if already granted, this is skipped

**Given** permission is granted and a session is active
**When** I leave Ghost Rival on iPhone 14 Pro+
**Then** a compact Live Activity appears in the Dynamic Island: Ghost icon (leading, ghost-accent, 14pt) + Rest Timer countdown or "Active" label (trailing, mono-data, ink-primary, 13pt)

**Given** a session is active and I view the lock screen (all iPhone models)
**When** the Live Activity renders in expanded mode
**Then** left column: Exercise name (heading/ink-primary, truncated to 1 line) + Ghost data (body/ghost-dim); right column: Rest Timer countdown (display/ink-primary, 56pt when active); bottom row: "Tap to log next set" (body/ink-secondary)

**Given** I tap the Live Activity (Dynamic Island or lock screen)
**When** the tap registers
**Then** Ghost Rival is brought to foreground (triggers Face ID/Touch ID if on lock screen — iOS platform constraint); the Session screen is shown; no Set action is available directly from the lock screen (read-only by design)

**Given** permission is denied
**When** a session is active and I leave the app
**Then** no ambient indicator appears; the session continues in background; Settings → Session shows: "Enable Live Activities to see your rest timer from any screen." with a link to iOS Settings for Ghost Rival

**Given** a session is paused for more than 8 hours
**When** the elapsed time is detected
**Then** the Live Activity ends automatically

**Given** another Live Activity forces minimal state in Dynamic Island
**When** minimal state is active
**Then** the minimal state shows the Ghost icon only; no fallback notification is triggered (expected iOS behavior)

**Given** a session ends
**When** end is confirmed
**Then** the Live Activity ends immediately

**And** implemented via `LiveActivityModule.ts` interface; `LiveActivityModule.android.ts` throws `UnsupportedPlatformError` — never a silent no-op (ARCH-11)

---

### Story 2.4: Rest Timer Skip & Extend from Bubble

As Mason,
I want to skip or extend the Rest Timer from the Floating Bubble without opening the app,
So that I can adjust my rest period with zero interruption to my phone flow.

**Acceptance Criteria:**

**Given** the Rest Timer is running and the Floating Bubble is visible (Android)
**When** I long-press the Bubble to open the edit sheet
**Then** the edit sheet includes "Skip Rest" and "+30s" controls alongside the weight/reps fields

**Given** I tap "Skip Rest" from the Bubble edit sheet
**When** the action fires
**Then** the Rest Timer stops; no haptic fires for the skip; the Bubble sub-label returns to "Active"

**Given** I tap "+30s" from the Bubble edit sheet
**When** the action fires
**Then** 30 seconds are added to the current remaining Rest Timer time; the Bubble countdown updates immediately; the in-app Rest Timer Bar and numeric countdown also update reactively

**Given** I am on iOS and want to skip or extend
**When** I interact with the Live Activity
**Then** tapping the Live Activity routes to the app (foreground required for timer control on iOS — platform constraint); skip and extend controls are available in-app

**And** all Rest Timer state (countdown, running/paused) lives in `useSessionStore` (ephemeral Zustand); no timer state is persisted to the DB

---

## Epic 3: Ghost Rival System & PR Celebration

Mason races a version of his past self during every session, sees live set-by-set Ghost comparisons, and when he breaks a PR the app stops everything to celebrate — saved permanently in his Hall of Fame. After this epic, the core competitive mechanic that defines Ghost Rival is fully live.

**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15

### Story 3.1: Ghost Type Selection & Home Tab Ghost Row

As Mason,
I want to choose which version of my past self I race for each exercise (Last Week, Last Month, All-Time PR),
So that I always have a meaningful benchmark waiting before I walk into the gym.

**Acceptance Criteria:**

**Given** I am on the Home tab and at least one session has been completed for an exercise
**When** the Ghost Row renders
**Then** it shows: exercise name (heading/ink-primary), self-narrative copy (body/ink-secondary e.g. "you from last week"), Ghost benchmark data (display/ghost-dim at 40% opacity), and Ghost type badge (label/ghost-accent uppercase e.g. "LAST WEEK"); the entire row is a full-width tap target

**Given** I tap a Ghost Row
**When** the GhostTypeSelector bottom sheet opens
**Then** 4 options are shown: Last Session / Last Week / Last Month / All-Time PR; the currently selected type has a ghost-accent checkmark; each option shows the Ghost value + time reference in ghost-dim; options with no data show a footnote in ink-disabled: "No session in this range"; each option uses `accessibilityRole="radio"` and `accessibilityState={{ checked: isSelected }}`

**Given** I select a Ghost type
**When** the selection is persisted to the `ghosts` table
**Then** the Ghost Row updates immediately; the selection persists indefinitely between sessions and app restarts

**Given** I select a Ghost type with no data
**When** the Ghost Row renders
**Then** it displays the next-available Ghost with the note: "Showing your most recent session instead."

**Given** an exercise has no session history yet
**When** the Ghost Row renders
**Then** the Ghost data slot shows in ink-secondary: "No ghost yet — come back after your first session."; no Ghost type badge is shown

**Given** all Ghost candidate queries run
**When** the query executes
**Then** the active session's `session_id` is excluded at the SQL level (`WHERE session_id != :active_session_id`) — never delegated to hook or component layer (ARCH-9)

**Given** iOS Increase Contrast is active or Android `isHighTextContrastEnabled` is true
**When** Ghost data renders
**Then** ghost-dim elements automatically render at full ghost-accent opacity without any user action in the app (NFR-15)

**And** Ghost Row accessibility label: "[Exercise name]. Ghost: [self-narrative description]. [Ghost type] [value]."

---

### Story 3.2: Live Ghost Comparison During Session

As Mason,
I want to see how each Set compares to my Ghost's performance inline and in real time,
So that I know immediately whether I'm ahead or behind my past self on every single rep.

**Acceptance Criteria:**

**Given** I confirm a Strength Set for an exercise with an active Ghost
**When** the Set Row renders
**Then** a Ghost comparison delta displays inline in `body / ghost-dim` as a self-narrative sentence — never a +/- numeric delta:
- Same weight, same reps → "matches you from [ghost time]"
- Same weight, more reps → "[n] reps ahead"
- More weight, any reps → "[n]kg heavier — ahead"
- Less weight, any reps → "[n]kg lighter"
- Same weight, fewer reps → "[n] reps behind"

**Given** I log more Sets than the Ghost session contained
**When** a Set Row renders beyond the Ghost's last set
**Then** the comparison slot shows: "beyond your ghost's last set" in ink-secondary

**Given** I open a Cardio Set entry form with an active Ghost
**When** the form is open (before Set is confirmed)
**Then** the Ghost's target pace is shown as read-only at the top of the form: "[n] min/km from [ghost time]" in ghost-dim

**Given** I confirm a Cardio Set
**When** the Set Row renders
**Then** the delta shows post-Set: "X seconds per km faster" / "matched your ghost pace" / "X seconds per km slower"

**Given** an exercise has no Ghost
**When** Sets are logged
**Then** no Ghost comparison delta is shown; Set Row shows weight × reps only

**Given** I change the Ghost type mid-session
**When** the change takes effect
**Then** subsequent Sets compare against the new Ghost; previously logged Set Rows in this session do not retroactively update their delta display

**And** Ghost comparison copy follows the time-based self-narrative hierarchy (UX-DR22):
- Within last 7 days → "you from [day]"
- 8–30 days → "you from last week" or "you from [N] weeks ago"
- 31–90 days → "you from last month" or "you from [month]"
- 90+ days → "the you that peaked in [month + year]"
- All-Time PR → "your best ever"

**And** Set Row full accessibility label: "Set [number]. [Weight] by [reps]. [Ghost comparison delta as readable sentence]."

---

### Story 3.3: PR Detection Engine

As Mason,
I want the app to detect when I break a personal record immediately after each Set,
So that every PR is captured accurately and my Hall of Fame is always complete.

**Acceptance Criteria:**

**Given** I confirm a Strength Set
**When** `confirmSet(tx, setData)` runs inside a Drizzle transaction
**Then** `detectPr(tx, exerciseId, setData)` is called within the same transaction; if a PR is detected, a `hall_of_fame` row is inserted within the same transaction; the Set write is NEVER rolled back if PR detection fails — an inner try/catch isolates PR errors from Set writes (ARCH-10)

**Given** a Strength Set's weight exceeds the all-time best weight for that exercise
**When** `detectPr` runs
**Then** a Weight PR row is written to `hall_of_fame`

**Given** a Strength Set has equal or higher weight and more reps than the all-time best
**When** `detectPr` runs
**Then** a Reps PR row is written

**Given** a Strength Set's Volume (weight × reps) exceeds the all-time best Volume
**When** `detectPr` runs
**Then** a Volume PR row is written

**Given** a Cardio Set achieves a new best pace at equal or greater distance
**When** `detectPr` runs
**Then** a Cardio Pace PR row is written

**Given** multiple PR types fire from a single Set
**When** all are detected
**Then** all PR types are recorded in a single `hall_of_fame` entry tagged with all applicable types

**Given** a PR was already detected for the same exercise earlier in the same session
**When** a second Set exceeds the same metric in the same session
**Then** the new record is written to `hall_of_fame` but `prExplosionPending` is NOT set again (only one PR Explosion per exercise per session)

**Given** PR detection throws an error
**When** the error is caught
**Then** `console.error('[PR Detection] Failed — set write preserved:', prError)` is logged; the Set write succeeds; `showToast()` is not called (PR failure is silent — a missed PR is acceptable; a lost Set write is not)

**Given** a `hall_of_fame` row is inserted
**When** `useLiveQuery` on `hall_of_fame` detects the new row
**Then** `useSessionStore.prExplosionPending` is set to `{ exerciseId, prData }` → `PrExplosionOverlay` renders (ARCH-17)

**And** `detectPr.ts` is a pure function in `/src/lib/`; called only from `sets.queries.ts`; no component imports it directly (ARCH-12)

---

### Story 3.4: Hall of Fame — View & Ghost Retirement

As Mason,
I want a permanent, chronological record of every PR I've ever set,
So that my training history is preserved and I can see exactly how far I've come.

**Acceptance Criteria:**

**Given** a PR is detected and written to `hall_of_fame`
**When** the All-Time PR Ghost is active for that exercise
**Then** the old Ghost is archived (previous value recorded in the `hall_of_fame` entry); a new row in `ghosts` is created with the just-set PR values; the new Ghost appears in the Home tab Ghost lineup immediately after the PR Explosion dismisses

**Given** I navigate to the Hall of Fame tab
**When** the screen renders
**Then** all PR entries display newest-first; each Hall of Fame Entry Row shows: Exercise name (heading/ink-primary), date achieved (body/ink-secondary), record value (display/ink-primary), filled pr-burst PR badge (the only list context where the filled orange badge appears), PR type label in label-typography uppercase

**Given** I tap an exercise name in the Hall of Fame
**When** the per-exercise filter activates
**Then** only PR entries for that exercise display in reverse chronological order; a filter pill shows the exercise name; an "All PRs" pill returns to the full feed

**Given** I am in an active session and tap the "History" icon in the session header
**When** the Hall of Fame Slide-In Panel opens
**Then** it slides over the Session screen from the bottom (60% height, rounded-lg top corners); the currently active exercise is shown by default; navigable across exercises via horizontal scroll filter tabs; the session continues uninterrupted; the panel is read-only

**Given** the HoF Slide-In Panel is open
**When** I swipe down or tap the close button
**Then** the panel dismisses and the active session screen resumes focus

**Given** Last Week or Last Month Ghosts are active for an exercise
**When** new sessions accumulate over time
**Then** those Ghost types update automatically — no explicit retirement event (only All-Time PR Ghost retires on PR detection)

**And** `hall-of-fame.queries.ts` contains read-only queries only; no component imports from it directly (ARCH-12)

---

### Story 3.5: PR Explosion Animation & Accessibility

As Mason,
I want a full-screen celebration sequence when I break a PR that makes the moment feel genuinely earned,
So that hitting a new record feels like an event — not a number quietly updating in a list.

**Acceptance Criteria:**

**Given** `useSessionStore.prExplosionPending` is set
**When** `PrExplosionOverlay` renders
**Then** the 10-step sequence executes in order:
1. Medium haptic fires before any visual
2. All session input locks (no Set logging, no "End Workout", no navigation)
3. Three shockwave rings expand from screen center (80ms stagger): ghost-accent 60%, pr-burst 80%, pr-burst 40%; 12–20 cyan and orange particles scatter and fade over 600ms
4. surface-base at 90% opacity fades in over 200ms behind the card
5. Old Ghost value (ghost-dim) floats upward 40dp and fades 40%→0% over 400ms
6. NEW RECORD card slides up (spring 300ms): "NEW RECORD" (display/ink-primary), new value (display 56pt/ink-primary), "Previous: [old value]" (body/ghost-accent full opacity), "Saved to Hall of Fame" (body/ink-secondary), "Continue" ghost-pill button
7. New Ghost value fades in 0%→40% opacity over 400ms behind the card
8. `hall_of_fame` row already written by Story 3.3 transaction; "Saved to Hall of Fame" is accurate offline
9. No auto-dismiss — user controls when the moment ends
10. Tap "Continue" or anywhere outside the card: overlay fades out 200ms; input unlocks; focus returns to the Set Row that triggered the PR

**Given** system Reduced Motion preference is active
**When** PR Explosion fires
**Then** all animation is replaced by a 200ms full-screen pr-burst flash at 40% opacity; particles are omitted; Ghost retire and new Ghost materialize are instant; NEW RECORD card appears immediately without spring; all functional behavior (lock, dismiss, HoF write) is fully preserved (NFR-13)

**Given** VoiceOver or TalkBack is active
**When** the PR Explosion overlay appears
**Then** the screen reader announces: "New personal record: [value]. Previous: [old value]. Saved to Hall of Fame." before card content; `accessibilityViewIsModal = true` (iOS) / `importantForAccessibility="yes"` (Android); traversal order: announcement → "NEW RECORD" heading → new value → "Previous: [old value]" → "Saved to Hall of Fame" → "Continue"; on dismiss, focus returns to the Set Row that triggered the PR (UX-DR24)

**Given** iOS Smart Invert is active
**When** PR Explosion renders
**Then** Ghost icon illustrations, PR Explosion rings/particles, ghost-dim text, ghost-accent indicators, and pr-burst elements all have `accessibilityIgnoresInvertColors = true` so color semantics are preserved while the rest of the UI inverts (NFR-14, UX-DR23)

**Given** a Set that triggered a PR is within the 30-second edit window after the explosion dismisses
**When** the user swipe-deletes that Set
**Then** the `hall_of_fame` entry for that PR is retracted; the previous Ghost benchmark is restored silently; a toast appears: "Set deleted. PR removed from Hall of Fame." (no second PR Explosion fires) (UX-DR26)

**Given** "Save as Complete" is selected on a stale draft (Epic 1 Story 1.6)
**When** the draft is finalized
**Then** PR detection runs retroactively over all recovered Sets; PR Explosions fire sequentially for each qualifying Set before the Home tab loads; `hall_of_fame` is updated accordingly

**And** PR Badge renders outline-only (pr-burst border, transparent fill) in all list contexts; filled pr-burst background only in Hall of Fame Entry Rows — never orange fill in active session list rows (UX-DR5)

---

## Epic 4: Progress Visibility & Motivation

After every PR, Mason sees his next target auto-generated based on his rate of progress. He can track his weekly gym streak and has 2 Mercy Days per month for real life — so motivation is always forward-looking, never guilt-based. After this epic, the motivation flywheel is complete.

**FRs covered:** FR-16, FR-17, FR-18, FR-19

### Story 4.1: Infinite Goal Engine & Goal Display

As Mason,
I want a next training target auto-generated immediately after every PR,
So that I always know exactly what to aim for next — and the goal vacuum never exists.

**Acceptance Criteria:**

**Given** a PR is detected and the PR Explosion overlay renders
**When** the NEW RECORD card displays
**Then** an Infinite Goal Chip appears on the card: rounded-pill, pr-burst border 1.5px, transparent fill, arrow-up icon in pr-burst, label "Next target: [value]" in label-typography/pr-burst; the chip is dismissible by tapping it on the overlay

**Given** `calculateGoalTarget(prValue, prType, sessionCount, prVelocity)` runs
**When** determining the next target
**Then** the phase and increment is selected:
- `sessionCount < 10` → Beginner: 2.5% of `prValue`
- `sessionCount` 10–49 → Intermediate: 1.5% of `prValue`
- `prVelocity < 0.5%` per session over last 3 PRs → Plateau: 1.0% of `prValue`
- `sessionCount ≥ 50 AND prVelocity ≥ 0.5%` → Advanced: 2.0% of `prValue`

**And** all phase threshold constants live in `/src/constants/index.ts` — never hardcoded in the algorithm file (ARCH-15)

**Given** the calculated increment is determined
**When** it is applied to the PR value
**Then** it is rounded to the nearest valid plate increment (0.5 kg / 2.5 lb); if rounding produces 0, the minimum (0.5 kg / 1 lb) is used

**Given** a Reps-only PR (same weight, more reps)
**When** `calculateGoalTarget` runs
**Then** target = current reps + 1

**Given** a Cardio Pace PR
**When** `calculateGoalTarget` runs
**Then** target = current best pace − 5 sec/km (Beginner) or − 2 sec/km (Intermediate/Advanced/Plateau)

**Given** a Cardio Distance PR
**When** `calculateGoalTarget` runs
**Then** target = current best distance + 5%, rounded to nearest 0.5 km

**Given** fewer than 2 sessions exist for the exercise
**When** a goal is calculated
**Then** target is the next standard increment only (+2.5 kg or +1 rep for Strength); no estimated date is shown

**Given** the PR Explosion dismisses and a goal was calculated
**When** the Home tab Ghost Row renders for that exercise
**Then** the Infinite Goal Chip persists as a secondary line under the Ghost data

**Given** 5 or more consecutive sessions have passed for an exercise without a PR
**When** the Ghost Row renders
**Then** the Infinite Goal Chip is hidden; the chip re-appears on the next PR using the Plateau increment

**Given** the user breaks the target in a new session
**When** a PR fires
**Then** the chip updates to the new next target immediately after the PR Explosion

**Given** the user changes units (kg → lb)
**When** the Goal chip renders
**Then** the target recalculates from the stored canonical kg value and displays in the new unit; no historical re-evaluation

**And** `calculateGoalTarget.ts` is a pure function in `/src/lib/`; `calculateGoalTarget.test.ts` covers all phase branches, rounding edge cases, and plateau detection

---

### Story 4.2: Gym Streak & Mercy Days

As Mason,
I want to track my weekly gym consistency with a Streak and have Mercy Days for real-life interruptions,
So that I'm motivated by progress — not punished by missing a week.

**Acceptance Criteria:**

**Given** I complete at least one Session in a calendar week
**When** the week ends
**Then** the Gym Streak increments by 1; the Gym Streak Widget on the Home tab shows the updated count

**Given** a full calendar week passes with no completed Session
**When** the new week begins
**Then** the Gym Streak resets to 0; no push notification fires for the reset (no guilt framing)

**Given** the Gym Streak Widget renders
**When** it displays on the Home tab above the Ghost Row list
**Then** it shows streak count in `display / ink-primary` and "WEEK STREAK" label in `label / ink-secondary`; the count NEVER turns red regardless of streak state; tapping the widget for the first time shows a tooltip explaining weekly cadence, Mercy Day rules, and reset behavior

**Given** 2 Mercy Days per calendar month are allocated
**When** a secondary daily-log streak would otherwise break
**Then** a Mercy Day is consumed automatically; a push notification fires: "Mercy Day used — your streak is safe." (if notifications permitted); Mercy Day count resets on the 1st of each month; unused days do not carry over

**Given** a Mercy Day is consumed today
**When** the Gym Streak Widget renders
**Then** a small dot indicator is visible (not a count — just a presence indicator); the dot disappears when no Mercy Day is active today

**Given** the Gym Streak reaches a milestone (4, 8, 12, 26, or 52 weeks)
**When** the milestone is detected after a session completes
**Then** a push notification fires (only if notifications are opted in and permitted; disabled by default)

**Given** a session is finalized via "Save as Complete" on a stale draft
**When** the draft's session date falls in the correct calendar week
**Then** the Gym Streak is credited for that week using the original session date, not the finalization date

**And** `mercyDays.ts` is a pure function in `/src/lib/`; calculates remaining Mercy Days and next reset date from local session timestamps; no network call required

**And** the Gym Streak Widget has no share affordance, no "at risk" warning, and no streak-pressure messaging of any kind

---

## Epic 5: Cloud Backup & Account

Mason can optionally create an account to back up his training data securely to the cloud, access it from any device after signing in, and export his full data at any time. After this epic, Ghost Rival is ready for production release. Local-only mode remains fully functional with no features removed.

**FRs covered:** FR-20, FR-21, FR-22

### Story 5.1: Onboarding & Optional Account Creation

As Mason,
I want to choose between local-only mode and signing in to back up my data — with full feature access either way,
So that I'm never gated from training by an account requirement.

**Acceptance Criteria:**

**Given** I launch Ghost Rival for the first time
**When** the app opens
**Then** a single onboarding screen appears with "Local only — no account needed" and "Sign in to back up your data" (email / Apple / Google) options; no feature tour, no interstitials, no unsolicited permission prompts on this screen

**Given** I choose "Local only"
**When** onboarding completes
**Then** the Home tab loads immediately; all features are fully accessible with no restrictions; data is stored on-device only

**Given** I choose "Sign in with Apple"
**When** Apple Sign In completes via `expo-apple-authentication`
**Then** an account is created via Supabase Auth; I land on the Home tab; sync begins automatically (Story 5.2)

**Given** I choose "Sign in with Google"
**When** Google Sign In completes via `expo-auth-session`
**Then** an account is created via Supabase Auth; I land on the Home tab; sync begins automatically

**Given** I choose email/password sign-in
**When** I enter valid credentials and tap "Sign In" or "Create Account"
**Then** authentication completes via Supabase Auth email/password; I land on the Home tab

**Given** I skipped account creation during onboarding
**When** I open Settings → Account
**Then** the account prompt is re-accessible; I can sign in at any time and my existing local data begins syncing to the cloud

**Given** the onboarding screen was shown once
**When** I restart the app without creating an account
**Then** the onboarding screen does NOT appear again; the app goes directly to the Home tab

**And** no analytics SDK, no ad network SDK, and no third-party tracking is initialized at any point; Supabase is initialized with the sb_publishable_xxx key format (ARCH-3) (NFR-7)

---

### Story 5.2: Offline-First Sync Queue & Cloud Backup

As Mason,
I want my training data to sync automatically to the cloud whenever I'm connected, with no manual action required,
So that my data is safe regardless of device loss, failure, or upgrade.

**Acceptance Criteria:**

**Given** the Supabase project is set up with sb_publishable_xxx / sb_secret_xxx keys
**When** RLS policies are configured
**Then** each table (exercises, sessions, sets, ghosts, hall_of_fame, sync_queue) has RLS policies that enforce each user only accesses their own data; no server-side business logic logs user data

**Given** I perform any write operation (new Set, Session end, PR record, settings change, Exercise rename or deletion)
**When** the write succeeds locally in SQLite
**Then** an entry is enqueued in `sync_queue` with operation type, table name, payload, and `created_at` epoch timestamp; the write completes immediately regardless of connectivity

**Given** the device has internet connectivity and a user account is active
**When** the sync queue drainer runs in the background
**Then** writes are replayed to Supabase in chronological order; conflict resolution: last write wins per row using `logged_at` / `updated_at` timestamps; synced entries are marked `synced_at` in `sync_queue`

**Given** the device goes offline mid-sync
**When** connectivity is lost
**Then** the drainer stops gracefully; unsynced entries remain in `sync_queue`; on next reconnect the drainer resumes

**Given** I sign in on a second device
**When** cloud state downloads
**Then** cloud state merges with local state using last-write-wins; no data is lost; Hall of Fame entries superseded by higher records from the merged dataset are marked "Superseded by a higher record from another device" in ink-secondary (not deleted)

**Given** I navigate to Settings → Account
**When** the sync status renders
**Then** it shows one of: "Syncing…" / "Last synced: [relative time]" / "Offline — will sync when connected"; this indicator appears ONLY in Settings — never on Home, Session, or Hall of Fame tabs

**Given** I am in an active Session with no connectivity
**When** I log Sets, detect a PR, and end the Session
**Then** all features work identically to the online experience; "Saved to Hall of Fame" in the PR Explosion overlay is accurate (saved locally); no "pending sync" qualifier on the PR Explosion overlay

**Given** expo-sqlite with SQLCipher is configured
**When** the DB is initialized
**Then** the local database is encrypted at rest (NFR-6); all Supabase connections enforce TLS

**And** no sync status banner, offline warning, or reduced-functionality UI appears during Sessions regardless of connectivity

---

### Story 5.3: Data Export & Account Management

As Mason,
I want to export all my training data at any time and manage my account without friction,
So that my data is always mine — I can leave at any time without losing anything.

**Acceptance Criteria:**

**Given** I navigate to Settings → Account → Export Data and tap "Export as JSON" or "Export as CSV"
**When** the export runs
**Then** `/src/lib/exportData.ts` generates the file including all Sessions, Exercises, Sets, Hall of Fame entries, and Ghost history; the file downloads to the device (iOS Files / Android Downloads); no data is sent to any external service (ARCH-16, FR-22)

**Given** I am in local-only mode (no account)
**When** I export
**Then** the export runs identically — all local data is exported; no account is required

**Given** I tap "Delete Account" in Settings → Account
**When** the two-step confirmation begins
**Then** Step 1: a modal: "Delete your account? This will erase all local data and unlink your cloud account." with "Delete Account" CTA in `feedback-error` label and "Cancel"; Step 2 (on Step 1 confirm): "This cannot be undone. Type DELETE to confirm." with a text field using `feedback-error` border on focus; the delete CTA activates only when the field contains "DELETE" exactly (case-sensitive)

**Given** I confirm account deletion
**When** deletion completes
**Then** all local data is wiped; the Supabase account is unlinked; the app returns to the onboarding screen

**Given** EAS Submit is configured
**When** production builds are ready
**Then** `eas.json` production profile targets App Store (iOS) and Google Play (Android); no analytics or crash reporting SDKs are bundled in the production build (Sentry deferred post-MVP)

**And** the export, account deletion, and Settings screens have no share affordance, no rating prompt, and no upsell moment of any kind
