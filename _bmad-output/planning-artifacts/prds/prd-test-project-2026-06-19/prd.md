---
title: PRD — Ghost Rival
status: final
created: 2026-06-19
updated: 2026-06-19
---

# PRD: Ghost Rival

## 0. Document Purpose

This PRD is written for Mason (solo developer, and Ghost Rival's first user). It defines requirements for Ghost Rival v1 (MVP): a mobile workout tracker where the only competitor is yourself. Downstream artifacts — UX spec, architecture, epics, and stories — derive from this document. Source inputs were the product brief (`brief.md`) and brainstorming session; this PRD does not duplicate them, it supersedes them as the requirements contract. Vocabulary is defined in §3 Glossary and used verbatim throughout; introducing a synonym anywhere in the PRD is a discipline violation.

---

## 1. Vision

Ghost Rival is a mobile gym tracker for solo gym-goers who want to see their progress clearly — without complexity, social comparison, or a subscription paywall.

The core mechanic: every workout, you race your Ghost — a copy of yourself from last week, last month, or your best session ever. When you beat it, it retires. A new, harder Ghost takes its place. When you set a Personal Record, the app treats it like a real event — not a silent counter increment.

Ghost Rival is designed to be invisible until it matters. A Floating Bubble (Android) or Live Activity (iOS) lets you log a Set with a single tap while scrolling during your rest period, without leaving the app you're in. The app lives in the background — always there, never demanding.

The product is permanently free. Not freemium — permanently free. No subscription, no ads, no locked features, no plan to add them. This is the product position, not a phase decision. Privacy is non-negotiable: your data stays on your device and your private cloud. Cloud sync exists for backup and device transitions — not for sharing.

---

## 2. Target User

### 2.1 Jobs To Be Done

- Know whether I'm getting stronger, without a PT or training partner telling me
- Log a Set in under 2 seconds during a rest period, without losing my phone flow
- Feel genuine excitement when I break a personal record — not just see a number change
- Never wonder "what's my next goal?" — always have a Ghost waiting ahead
- Keep my training data across device changes without surrendering it to a social network

### 2.2 Non-Users (v1)

- Athletes training for sport-specific performance metrics (power output, sprint speed) — this is general gym tracking, not periodized programming
- Users who want social accountability, leaderboards, or to share workouts publicly
- Users who want AI-prescribed routines — Ghost Rival tracks your plan, it does not prescribe one
- Personal trainers or coaches managing other people's data

### 2.3 Key User Journeys

**UJ-1. Kenji starts his first workout — no history, no Ghost yet.**
- **Persona + context:** Kenji, 24, solo gym-goer, switches between apps every few months because nothing sticks. Downloaded Ghost Rival after 30 seconds on the App Store listing.
- **Entry state:** First launch, no account.
- **Path:** Optionally signs up (email / Apple / Google) or skips to local-only mode. Lands on empty home screen. Taps "Start Workout." Creates first Exercise: types "Bench Press," selects Strength type. Logs first Set: 80 kg × 5 reps. Rest Timer starts. Floating Bubble / Live Activity appears.
- **Climax:** Session ends. Summary screen: "Your first Bench Press Ghost has been summoned. Come back next time to beat it."
- **Resolution:** First Session saved. Ghost is set. Home screen now shows Bench Press Ghost for next visit.
- **Edge case:** App closed mid-session → auto-saved as draft; resume prompt on next open.

**UJ-2. Kenji logs sets while scrolling Instagram between rests.**
- **Persona + context:** Kenji, mid-workout, rest period. He's browsing Instagram.
- **Entry state:** Session active; Floating Bubble visible on top of Instagram.
- **Path:** Rest Timer counts down on the Bubble. Reaches zero; Bubble vibrates and pulses. Kenji taps once — next Set pre-filled with last Set's weight and reps. Single tap confirms. Timer restarts.
- **Climax:** Set logged. Kenji never opened Ghost Rival.
- **Resolution:** Session continues. Ghost comparison updates silently.
- **Edge case:** Bubble dismissed accidentally → long-press system notification to restore.

**UJ-3. Kenji breaks his all-time Squat PR.**
- **Persona + context:** Kenji, week 6. His current Squat All-Time PR is 100 kg × 3.
- **Entry state:** Session active. Squat Ghost is set to All-Time PR.
- **Path:** Logs 102.5 kg × 4. App compares against Hall of Fame. Detects new PR on weight and volume simultaneously.
- **Climax:** PR Explosion — full-screen animation, haptic, "NEW RECORD" card shows old vs. new. Old Squat Ghost shown retiring. New Ghost spawns. Moment saved to Hall of Fame.
- **Resolution:** New Ghost set at 102.5 kg × 4. Infinite Goal Engine surfaces next target. Kenji dismisses and continues the Session.
- **Edge case:** Device on silent → visual-only celebration, no sound.

**UJ-4. Kenji reviews his Ghost lineup before a workout.**
- **Persona + context:** Kenji, walking to the gym, mentally preparing.
- **Entry state:** App home screen. No active Session.
- **Path:** Opens Ghost tab. Sees each Exercise with its active Ghost: "Bench Press — Last Week: 80 kg × 5. Can you beat it?" Taps Bench Press, switches Ghost type to All-Time PR for today.
- **Climax:** Ghost type updated for the upcoming Session.
- **Resolution:** App closes. No Session started. Ghost selection persists.

---

## 3. Glossary

- **Ghost** — A historical workout record from a past Session used as in-session benchmark. Each Exercise has one active Ghost. Characterized by type (Last Week / Last Month / All-Time PR), date, and performance data (weight + reps for Strength; duration + distance/pace for Cardio).
- **PR (Personal Record)** — A new best performance on an Exercise: highest weight, most reps at equal-or-higher weight, or greatest Volume. Triggers PR Explosion and Ghost retirement.
- **Volume** — Weight × reps for a single Strength Set. Used as a composite PR metric.
- **PR Explosion** — The full-screen celebration sequence triggered when a PR is detected during an active Session.
- **Hall of Fame** — A permanent, read-only chronological log of all PRs ever set, per Exercise.
- **Infinite Goal Engine** — The algorithm that auto-generates the next target after a PR using the user's rate of progress.
- **Floating Bubble** — The persistent Android system overlay (`SYSTEM_ALERT_WINDOW`) that surfaces the Rest Timer and one-tap Set confirm during an active Session.
- **Live Activity** — The iOS Dynamic Island / lock screen widget that surfaces the Rest Timer and a deep-link tap into the active Session.
- **Session** — A single gym visit: from "Start Workout" to "End Workout." Contains one or more Exercises with logged Sets.
- **Set** — One logged entry. Strength Set: weight + reps. Cardio Set: duration + optional distance/pace.
- **Exercise** — A user-defined movement (e.g., "Bench Press," "5K Run"). Typed as Strength or Cardio at creation. Persistent across Sessions.
- **Gym Streak** — Count of consecutive calendar weeks each containing at least one completed Session.
- **Mercy Day** — A grace period (2 per calendar month) that preserves a secondary daily-log streak without requiring a full Session.
- **Rest Timer** — Countdown between Sets. Configurable per Exercise or globally. Surfaces on Floating Bubble / Live Activity.

---

## 4. Features

### 4.1 Exercise Management

**Description:** Users create and manage their own Exercises. There is no pre-built library — zero clutter, the user owns their vocabulary [ASSUMPTION: intentional design choice, not an omission]. Exercises are typed Strength or Cardio at creation, which determines available logging fields in a Session. Exercises persist indefinitely and accumulate Ghost history across all Sessions.

**Functional Requirements:**

#### FR-1: Exercise creation
User can create an Exercise by entering a name and selecting a type (Strength or Cardio). Realizes UJ-1.

**Consequences:**
- Duplicate name within the same type is rejected with an inline error.
- Name accepts free text, max 60 characters.
- Exercise is immediately available to add to a Session after creation.

#### FR-2: Exercise editing
User can rename an existing Exercise. Historical Sets, Sessions, and Ghost records are preserved and reassociated to the new name.

**Out of Scope:** Changing an Exercise's type after creation.

#### FR-3: Exercise deletion
User can delete an Exercise with explicit confirmation. All associated data is soft-deleted (retained in cloud backup; removed from all UI surfaces).

---

### 4.2 Workout Session & Set Logging

**Description:** The core logging loop. Users start a Session, add Exercises, and log Sets. The active Ghost is shown inline per Exercise as a live benchmark. Each new Set pre-fills with the previous Set's values from within the same Session (first Set pre-fills from Ghost data, or blank if no Ghost exists yet [ASSUMPTION]). Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-4: Session lifecycle
User can start, pause, and end a Session. Only one active Session at a time.

**Consequences:**
- Session auto-saves to draft if the app is force-closed mid-session; user is prompted to resume or discard on next open.
- Session timer runs from start to end.
- Session summary shown on end: exercises logged, total Sets, total Volume, Ghost delta per Exercise.

#### FR-5: Strength Set logging
Within a Session, user can log a Strength Set by entering weight and reps. Realizes UJ-2.

**Consequences:**
- Weight field supports kg or lb; unit is set globally in app settings and persists.
- Reps are positive whole numbers.
- Pre-fill values are editable before confirmation.

#### FR-6: Cardio Set logging
Within a Session, user can log a Cardio Set by entering duration and optionally distance.

**Consequences:**
- Duration format: mm:ss.
- If distance is entered, pace is calculated and displayed automatically.
- Ghost comparison uses duration and/or distance, whichever fields are populated.

#### FR-7: Rest Timer
After each confirmed Set, the Rest Timer starts automatically.

**Consequences:**
- Default duration: 90 seconds globally [ASSUMPTION]; configurable per Exercise from the Exercise detail screen in settings (MVP scope).
- Timer surfaces on Floating Bubble (Android) or Live Activity (iOS).
- Completion triggers haptic feedback.
- User can skip or extend the timer from the Bubble/Live Activity without opening the app.

---

### 4.3 Floating Bubble (Android) / Live Activity (iOS)

**Description:** The mechanism for keeping an active Session interactable while the user is in another app. On Android: a system floating overlay. On iOS: a Live Activity on the Dynamic Island and lock screen. Both show the Rest Timer countdown and enable one-tap Set confirmation. Realizes UJ-2.

**Functional Requirements:**

#### FR-8: Android Floating Bubble
On Android, user can enable a persistent Floating Bubble (`SYSTEM_ALERT_WINDOW` permission) during an active Session.

**Consequences:**
- Bubble displays: countdown timer, current Exercise name, next Set pre-fill (weight × reps or cardio target).
- Single tap: confirms next Set with pre-filled values.
- Long press: opens in-app editor to adjust values before confirming.
- Bubble persists across all apps until Session ends or user dismisses it.
- If permission is denied: falls back to a persistent notification with the same confirm action.
- Bubble is only present during an active Session.

**Out of Scope:** Floating Bubble on iOS.

#### FR-9: iOS Live Activity
On iOS 16.1+, an active Session launches a Live Activity on the Dynamic Island (supported devices) and lock screen.

**Consequences:**
- Live Activity shows: Rest Timer countdown, next Set pre-fill.
- Tap deep-links directly into the active Session screen in the app.
- Live Activity ends when the Session ends or is paused for more than 8 hours [ASSUMPTION].
- On devices without Dynamic Island: lock screen only.

**Out of Scope:** System-wide overlay on iOS.

---

### 4.4 Ghost Rival System

**Description:** Each Exercise has one active Ghost — a benchmark record from a past Session. Three Ghost types available: Last Week (most recent session in past 7 days), Last Month (most recent in past 30 days), All-Time PR. User selects Ghost type per Exercise; selection persists between Sessions. Ghost data is shown inline during logging: each logged Set is compared live to the corresponding Ghost Set. Realizes UJ-3, UJ-4.

**Functional Requirements:**

#### FR-10: Ghost type selection
User can set the active Ghost type per Exercise. Default: Last Week [ASSUMPTION].

**Consequences:**
- If no data exists for the selected type, UI shows: "No [type] Ghost yet — complete a session to set one."
- Ghost type selection changes take effect on the next Set logged for that Exercise in the current Session (or immediately, outside a Session).
- Ghost type persists until the user changes it.

#### FR-11: Live Ghost comparison
During a Session, each logged Set is displayed alongside the corresponding Ghost Set for that Exercise.

**Consequences:**
- Display: "You: 80 kg × 5 | Ghost: 75 kg × 5 → +5 kg ahead"
- If user has logged more Sets than the Ghost had in its session, remaining Ghost slots show "—" (Ghost ended here).
- Comparison updates in real time after each Set is confirmed.
- **Cardio live-comparison:** During a Cardio Set (duration is unknown until the Set ends), the Ghost target pace is shown as a live reference benchmark. Actual vs. Ghost pace delta is calculated and displayed after Set confirmation [ASSUMPTION: target pace shown during Set; delta shown post-Set].

#### FR-12: Ghost retirement and respawn
When a PR is detected (see FR-13), the All-Time PR Ghost retires and a new Ghost is created from the new PR.

**Consequences:**
- Retired Ghost is archived in Hall of Fame with date and Session context.
- New Ghost appears in Ghost lineup immediately after the PR Explosion sequence completes.
- Last Week and Last Month Ghosts update automatically as Sessions accumulate; no explicit retirement event.

---

### 4.5 PR Detection & PR Explosion

**Description:** After each Strength Set is confirmed, the app compares it against the user's all-time best for that Exercise. A PR triggers on: highest weight, most reps at equal-or-higher weight, or highest Volume. When a PR is detected, the PR Explosion sequence plays immediately. Realizes UJ-3.

**Functional Requirements:**

#### FR-13: PR detection
System detects a PR when a confirmed Set exceeds the all-time best on any of: weight, reps (at equal or higher weight), or Volume (weight × reps). For Cardio: best pace (distance ÷ duration) is the PR metric [ASSUMPTION].

**Consequences:**
- PR detection fires immediately after Set confirmation.
- Multiple PR types (e.g., new weight and new Volume) can trigger from a single Set; all are recorded.
- A second PR on the same metric for the same Exercise in the same Session does not retrigger PR Explosion — only the first instance per Session per Exercise.

#### FR-14: PR Explosion sequence
On PR detection, the PR Explosion plays: full-screen animation, haptic feedback, "NEW RECORD" card showing old record vs. new record, and a "View Hall of Fame" CTA.

**Consequences:**
- If device is silent: animation only, no sound.
- User must dismiss (single tap anywhere) before returning to the Session.
- Session is not ended by the PR Explosion; logging continues after dismissal.
- **Qualitative bar:** See §8 — the sequence is held to a felt-event standard, not a modal-dismissal standard. The old Ghost must visibly retire on screen before the new one appears.

#### FR-15: Hall of Fame
User can view a permanent, chronological log of all PRs per Exercise.

**Consequences:**
- Each entry: date, Session date, PR type, previous record, new record.
- Hall of Fame is read-only.
- Accessible from: home screen shortcut and Exercise detail view.

---

### 4.6 Infinite Goal Engine

**Description:** After a PR, the Infinite Goal Engine auto-generates the next target for that Exercise based on the user's average rate of progress. The target is surfaced on the home screen alongside the active Ghost. There is never a goal vacuum. Realizes UJ-3.

**Functional Requirements:**

#### FR-16: Goal generation
After a PR Explosion, system calculates next target weight/reps (or Cardio metric) using the user's average improvement rate over the last 4 Sessions [ASSUMPTION: 4 sessions, or all available if fewer exist].

**Consequences:**
- Target displays as: "Next target: 105 kg × 4 — estimated by [date]."
- Estimated date calculated from average time between PRs for that Exercise.
- If fewer than 2 Sessions exist: target is next standard increment (+2.5 kg or +1 rep for Strength); no estimated date shown.
- Goal auto-updates after each PR. User cannot manually override the goal in MVP [ASSUMPTION].
- Known edge cases (plateau behavior, rapid beginner gain projection): see addendum §Infinite Goal Engine — Algorithm Notes.

#### FR-17: Goal display
Active goal for each Exercise is visible on the home/Ghost screen alongside the active Ghost.

**Consequences:**
- Goal shown as a secondary line under the Ghost; does not replace Ghost display.
- If no goal exists yet (not enough history): goal slot shows "Log more sessions to unlock your next target."

---

### 4.7 Gym Streak & Mercy Days

**Description:** Ghost Rival tracks weekly gym consistency via a Streak. Streak increments for each calendar week containing at least one completed Session. Mercy Days exist at the daily level — 2 per calendar month — as a grace mechanism that preserves a secondary daily-log streak without requiring a full Session. Realizes UJ-1.

**Functional Requirements:**

#### FR-18: Weekly Gym Streak
System increments Streak by 1 for each calendar week containing at least one completed Session.

**Consequences:**
- Streak is displayed on the home screen.
- Streak resets to 0 if a full calendar week passes without a completed Session.
- Streak milestone push notifications at: 4, 8, 12, 26, and 52 weeks.

#### FR-19: Mercy Days
User receives 2 Mercy Days per calendar month. A Mercy Day is consumed automatically when the user would otherwise break a secondary daily-log streak [ASSUMPTION: daily streak is an internal metric used to power Mercy Days; it is not prominently surfaced in the UI].

**Consequences:**
- Mercy Day notification: "Mercy Day used — your streak is safe."
- Mercy Day count resets on the 1st of each month.
- Unused Mercy Days do not carry over.

---

### 4.8 Cloud Sync & Account

**Description:** User data syncs to a cloud backend for backup and multi-device access. Account creation is optional — local-only use is fully supported. For users who create an account, sync is automatic and bidirectional. Privacy: data is stored encrypted; it is never shared, sold, or analyzed. Realizes UJ-1.

**Functional Requirements:**

#### FR-20: Account creation
User can create an account via email/password, Apple Sign In, or Google Sign In. Account creation is optional.

**Consequences:**
- Users who skip account creation can use all features; data is local-only and not backed up.
- Account prompt shown once during onboarding; dismissible and re-accessible from settings.

#### FR-21: Cloud sync
Sessions, Exercises, Sets, Ghosts, and Hall of Fame data sync bidirectionally between device and cloud.

**Consequences:**
- Sync is automatic when connected; no manual action required.
- All core features function fully offline; sync queues and drains on reconnect.
- Conflict resolution: most recent write wins per Set [ASSUMPTION].
- Sync status (last synced timestamp) visible in settings.

#### FR-22: Data export
User can export all data as JSON or CSV from settings.

**Consequences:**
- Export includes all Sessions, Exercises, Sets, Hall of Fame entries, and Ghost history.
- Available with or without a cloud account.
- Export is downloaded to device; not sent to any external service.

**Out of Scope (MVP):** HealthKit / Health Connect integration, sharing with third parties.

---

## 5. Non-Goals (Explicit)

- No pre-built exercise library or workout prescription
- No social features: no leaderboards, no friend activity, no public sharing
- No AI-generated or coach-prescribed workout plans
- No coaching, form feedback, or nutrition advice
- No monetization of any kind — no ads, no premium tier, no data sales — in v1 or beyond
- No Apple Watch / Wear OS auto-detection (Phase 2)
- No Recovery Score or biometric inputs (Phase 2)
- No Progress Mirror / body photo time-lapse (Phase 2)
- No Snap & Eat / food recognition (Phase 2+)
- No HealthKit or Health Connect integration (Phase 2)
- No Ghost Composition (body fat / muscle tracking) (Phase 2)
- No Gym Coach Personality / adaptive tone engine (Phase 2) — see addendum

---

## 6. MVP Scope

### 6.1 In Scope

- User-defined Exercise creation (Strength and Cardio types)
- Session logging: Strength Sets (weight + reps), Cardio Sets (duration + distance/pace)
- Rest Timer (configurable per Exercise or globally)
- Floating Bubble (Android) — one-tap Set confirm, works across all apps
- Live Activity (iOS 16.1+) — Rest Timer + deep-link into active Session
- Ghost Rival system — Last Week, Last Month, All-Time PR Ghost types; live in-session comparison
- PR Detection (weight, reps, Volume for Strength; pace for Cardio)
- PR Explosion animation + haptic + Hall of Fame entry
- Infinite Goal Engine — next target auto-generated after each PR
- Gym Streak (weekly) + Mercy Days (2/month)
- Cloud sync with optional account (email, Apple Sign In, Google Sign In)
- Offline-first: all core features function without connectivity
- Data export (JSON / CSV)

### 6.2 Out of Scope for MVP

- Pre-built exercise library
- Social features of any kind
- Apple Watch / Wear OS integration [NOTE FOR PM: high-friction user ask; revisit if core loop validates cleanly]
- HealthKit / Health Connect
- Recovery Score / biometric data
- Progress Mirror
- Ghost Composition
- Snap & Eat / nutrition
- For You Workout / AI plan generation
- Routine / program templates

---

## 7. Platform

**Target:** iOS 16.1+ and Android 10+ (API 29+), React Native (solo dev).

| Feature | Android | iOS |
|---|---|---|
| Overlay logging widget | Floating Bubble (`SYSTEM_ALERT_WINDOW`) | Live Activity (Dynamic Island + lock screen) |
| Permission model | Explicit user opt-in on first Session | Automatic with active Session |
| Fallback (permission denied / unsupported) | Persistent notification with confirm action | Lock screen only (no Dynamic Island on older devices) |

**Platform priority:** If deadline pressure forces a cut, ship Android first [ASSUMPTION: aligns with brief's "prioritize one platform" directive; Android chosen for Floating Bubble fidelity — the core invisible-logging UX].

---

## 8. Aesthetic and Tone

**Visual:** Dark-first UI. Ghost metaphor expressed visually — Ghost data rendered faintly/translucent, current-session data bold. PR Explosion moments are high-contrast and dramatic, not flat notifications.

**Voice:** Direct and warm. No fitness-bro language. Quiet confidence — the app trusts the user knows what they're doing. Celebration is genuine, not hyperbolic. Encouragement on empty states, not pressure.

**Ghost copy framing:** All Ghost-related copy must use self-narrative language — "you from last week," "your best," "the you that peaked in March" — not data-label language ("Last Week Ghost," "All-Time PR type"). The user must feel they are racing a version of themselves, not querying a database field.

**PR Explosion qualitative bar:** The PR Explosion must feel like the app *stopped everything* to acknowledge the user. The old Ghost should visibly retire on screen. This is a life event, not a notification.

**Anti-references:** Avoid cluttered dashboards, notification spam, gamification that feels manipulative, fitness clichés (green = good / red = bad for body metrics).

---

## 9. Constraints and Guardrails

**Privacy**
- No user data used for analytics, model training, or third-party sharing.
- Cloud storage encrypted at rest and in transit.
- Local-only mode is fully functional; no features require an account.
- No sharing affordance of any kind in v1 UI — no "share this PR" CTA, no export-to-social, no implicit share surfaces. Privacy is not a settings toggle; it is the default and only state.

**Invisible by design**
- No feature may initiate an interaction the user did not start, except: Rest Timer completion haptic/pulse, and opted-in Streak milestone notifications. All other app-initiated contact is prohibited. No onboarding interstitials, no rating prompts, no upsell moments.

**Performance**
- Floating Bubble / Live Activity Set confirm must respond within 200 ms.
- App cold start to usable state: under 3 seconds on a mid-range device (3 years old).
- Floating Bubble must not exceed 2% additional battery drain per active hour [ASSUMPTION: benchmark to be established during development].

**Offline**
- All core features (logging, Ghost comparison, PR detection, PR Explosion) work fully offline.
- Sync queues locally and drains on reconnect.

---

## 10. Success Metrics

**Primary**
- **SM-1:** Mason completes a full gym session using Ghost Rival without logging friction — no Set skipped because the app got in the way. Target: 100% of Sessions in month 1. Validates FR-4, FR-5, FR-8, FR-9.
- **SM-2:** At least 1 correctly detected PR per 4 Sessions within the first 30 days. Validates FR-13, FR-14.

**Secondary**
- **SM-3:** Gym Streak ≥ 4 consecutive weeks by end of month 1. Validates FR-18.
- **SM-4:** At least 3 Hall of Fame entries logged by end of month 1. Validates FR-15.
- **SM-5:** Floating Bubble / Live Activity used in ≥ 80% of Sessions (not bypassed for in-app logging). Validates FR-8, FR-9.

**Month 3 targets (qualitative)**
- **SM-6:** Mason can look back over 3 months and see clearly that he is stronger — without guessing, without reconstructing manually. The data tells the story on its own.
- **SM-7:** At least 3 distinct PRs logged across 3 different exercises by end of month 3.

**Pivot gate**
If after 30 days of self-use either of these is true, stop adding features and re-examine core mechanics before continuing:
- Logging still feels inconvenient in practice (any Set skipped because of the app)
- Ghost Rival does not create a felt sense of motivation or progress visibility

**Counter-metrics (do not optimize)**
- **SM-C1:** App screen-time during a Session should not increase. If Ghost Rival causes more time in-app instead of lifting, the "invisible" design philosophy has failed.
- **SM-C2:** Do not optimize for notification volume. Fewer notifications that still drive streak behavior are strictly better than more.

---

## 11. Open Questions

1. **Cardio Ghost comparison during a live session:** Duration is only known at Set end — how does the live Ghost comparison surface for Cardio before the Set is complete? Consider: show target pace as a live reference rather than a post-Set delta. [NOTE FOR PM: UX decision needed before architecture.]
2. **Cloud backend:** No backend specified. Architecture phase will determine sync conflict resolution detail and export schema. To resolve in `bmad-create-architecture`.
3. **Android Floating Bubble edge case:** Behavior when the user rapidly switches between multiple apps — does the Bubble persist correctly across all contexts without re-requesting permission or losing state?
4. **Mercy Days UX surface:** Daily-log streak is internal. Should Mercy Day consumption be shown in the UI at all beyond the notification, or remain entirely silent?
5. **Account deletion data handling:** When a user deletes their account, is Hall of Fame and Session history deleted immediately or after a 30-day grace window?

---

## 12. Assumptions Index

- **§4.1** — No pre-built exercise library is an intentional design choice.
- **§4.2 / FR-5** — First Set pre-fills from Ghost data; blank if no Ghost exists yet for that Exercise.
- **§4.2 / FR-7** — Default global Rest Timer is 90 seconds.
- **§4.4 / FR-10** — Default Ghost type per Exercise is Last Week.
- **§4.5 / FR-13** — Cardio PR metric is best pace (distance ÷ duration).
- **§4.6 / FR-16** — Infinite Goal Engine uses last 4 Sessions for rate calculation (all available if fewer).
- **§4.6 / FR-17** — User cannot manually override the auto-generated goal in MVP.
- **§4.7 / FR-19** — Mercy Days apply to a secondary daily-log streak (internal metric); weekly Gym Streak is the primary user-facing metric.
- **§4.8 / FR-21** — Cloud sync conflict resolution: most recent write wins per Set.
- **§7** — Android prioritized if launch deadline forces a platform cut.
- **§9** — Floating Bubble battery baseline to be established during development.
- **§4.3 / FR-9** — Live Activity ends if Session is paused for more than 8 hours.
- **§4.4 / FR-11** — Cardio live-Ghost comparison: target pace shown as live reference during Set; actual vs. Ghost delta calculated and shown post-Set.
