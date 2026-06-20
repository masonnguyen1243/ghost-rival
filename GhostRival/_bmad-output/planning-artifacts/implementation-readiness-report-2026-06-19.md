---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
documentsInventoried:
  prd: planning-artifacts/prds/prd-test-project-2026-06-19/prd.md
  architecture: planning-artifacts/architecture.md
  epics: planning-artifacts/epics.md
  ux_design: planning-artifacts/ux-designs/ux-test-project-2026-06-19/DESIGN.md
  ux_experience: planning-artifacts/ux-designs/ux-test-project-2026-06-19/EXPERIENCE.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-19
**Project:** Ghost Rival (test-project)

---

## PRD Analysis

### Functional Requirements

| ID | Feature Area | Summary |
|----|---|---|
| FR-1 | Exercise Management | Create Exercise: name (max 60 chars, free text) + type (Strength/Cardio). Duplicate name/type rejected inline. Immediately available after creation. |
| FR-2 | Exercise Management | Rename Exercise. All historical Sets, Sessions, Ghost records reassociated. Type change out of scope. |
| FR-3 | Exercise Management | Delete Exercise with explicit confirmation. All data soft-deleted (cloud-retained; removed from all UI). |
| FR-4 | Session Lifecycle | Start, pause, end Session. One active Session at a time. Auto-saves draft on force-close; resume/discard prompt on next open. Session timer runs start→end. Summary on end: exercises, total Sets, total Volume, Ghost delta per Exercise. |
| FR-5 | Set Logging | Log Strength Set: weight (kg/lb, global setting) + reps (positive whole numbers). Pre-fill editable before confirm. |
| FR-6 | Set Logging | Log Cardio Set: duration (mm:ss) + optional distance. Pace auto-calculated if distance entered. Ghost comparison uses whichever fields populated. |
| FR-7 | Rest Timer | Auto-starts after each confirmed Set. Default 90s globally; configurable per Exercise. Surfaces on Floating Bubble (Android) or Live Activity (iOS). Haptic on completion. User can skip/extend from Bubble/LA without entering app. |
| FR-8 | Floating Bubble (Android) | Persistent overlay (SYSTEM_ALERT_WINDOW) during active Session. Shows: countdown, Exercise name, next Set pre-fill. Single tap confirms. Long press opens in-app editor. Persists across all apps until Session ends or dismissed. Falls back to persistent notification if permission denied. Only present during active Session. |
| FR-9 | Live Activity (iOS) | iOS 16.1+: Live Activity on Dynamic Island + lock screen. Shows: Rest Timer countdown, next Set pre-fill. Tap deep-links into active Session. Ends when Session ends or paused >8 hours. Lock screen only on non-Dynamic Island devices. |
| FR-10 | Ghost System | Set active Ghost type per Exercise (Last Week / Last Month / All-Time PR). Default: Last Week. Shows "No [type] Ghost yet" if no data. Type change takes effect on next Set. Persists until changed. |
| FR-11 | Ghost System | Live Ghost comparison during Session. Format: "You: 80 kg × 5 \| Ghost: 75 kg × 5 → +5 kg ahead". Extra Sets beyond Ghost history show "—". Updates in real time. Cardio: target pace shown live during Set; delta shown post-Set. |
| FR-12 | Ghost System | Ghost retirement/respawn on PR: All-Time PR Ghost retires → archived in Hall of Fame with date + Session context → new Ghost created from new PR, appears immediately after PR Explosion. Last Week/Last Month Ghosts update automatically as Sessions accumulate. |
| FR-13 | PR Detection | PR detected when confirmed Set exceeds all-time best on: weight, reps (at equal-or-higher weight), or Volume (weight × reps). Cardio: best pace (distance ÷ duration). Fires immediately after Set confirm. Multiple PR types can fire from one Set. Second PR on same metric/Exercise in same Session does not retrigger PR Explosion. |
| FR-14 | PR Explosion | Full-screen animation + haptic + "NEW RECORD" card (old vs. new record) + "View Hall of Fame" CTA. No sound if device silent. User must dismiss before returning to Session. Session not ended. Old Ghost must visibly retire before new one appears. |
| FR-15 | Hall of Fame | Permanent, chronological, read-only log of all PRs per Exercise. Each entry: date, Session date, PR type, previous record, new record. Accessible from home screen shortcut and Exercise detail view. |
| FR-16 | Infinite Goal Engine | After PR Explosion: calculates next target using average improvement over last 4 Sessions (all available if fewer). Target displays as "Next target: X — estimated by [date]." Estimated date from average inter-PR interval. If <2 Sessions: +2.5 kg or +1 rep; no date shown. Auto-updates after each PR. No manual override in MVP. |
| FR-17 | Infinite Goal Engine | Active goal for each Exercise visible on home/Ghost screen as secondary line under Ghost. If no goal yet: "Log more sessions to unlock your next target." |
| FR-18 | Gym Streak | Weekly Streak: increments +1 per calendar week with ≥1 completed Session. Displayed on home screen. Resets to 0 if full calendar week passes without completed Session. Push notification milestones at 4, 8, 12, 26, 52 weeks. |
| FR-19 | Mercy Days | 2 Mercy Days per calendar month. Auto-consumed when user would break secondary daily-log streak. Notification: "Mercy Day used — your streak is safe." Resets on 1st of month. Unused days do not carry over. |
| FR-20 | Account | Optional account via email/password, Apple Sign In, or Google Sign In. Skip = local-only, all features available. Prompt shown once at onboarding; dismissible, re-accessible from settings. |
| FR-21 | Cloud Sync | Bidirectional auto-sync: Sessions, Exercises, Sets, Ghosts, Hall of Fame. Offline-first; sync queues and drains on reconnect. Conflict resolution: most recent write wins per Set. Sync status (last synced timestamp) visible in settings. |
| FR-22 | Data Export | Export all data (Sessions, Exercises, Sets, Hall of Fame, Ghost history) as JSON or CSV from settings. Available with/without account. Downloaded to device only; no external service. |

**Total FRs: 22**

---

### Non-Functional Requirements

| ID | Category | Requirement |
|----|---|---|
| NFR-1 | Privacy | No user data used for analytics, model training, or third-party sharing. Cloud storage encrypted at rest and in transit. Local-only mode fully functional; no feature requires an account. No sharing affordance in v1 UI — privacy is default and only state. |
| NFR-2 | User-Initiation | No app-initiated interaction except: Rest Timer completion haptic/pulse and opted-in Streak milestone notifications. No onboarding interstitials, no rating prompts, no upsell moments. |
| NFR-3 | Performance | Floating Bubble / Live Activity Set confirm response: ≤ 200 ms. |
| NFR-4 | Performance | App cold start to usable state: ≤ 3 seconds on mid-range device (≤3 years old). |
| NFR-5 | Performance | Floating Bubble additional battery drain: ≤ 2% per active hour. |
| NFR-6 | Offline | All core features (logging, Ghost comparison, PR detection, PR Explosion) work fully offline. Sync queues locally, drains on reconnect. |

**Total NFRs: 6**

---

### Additional Requirements & Constraints

- **Platform:** iOS 16.1+ and Android 10+ (API 29+), built in React Native (solo dev).
- **Platform priority:** Android first if launch deadline forces cut (Floating Bubble fidelity is core UX).
- **Aesthetic:** Dark-first UI. Ghost data rendered faintly/translucent; current-session data bold. PR Explosion high-contrast and dramatic.
- **Copy constraint:** All Ghost-related copy must use self-narrative language ("you from last week," "your best") — never data-label language. This is a discipline requirement, not a guideline.
- **Permanently free:** No monetization of any kind — not a phase decision, a product position.
- **No pre-built exercise library** — intentional design choice (not an omission).
- **Business rules from §9:** No social features, no AI plans, no Apple Watch/Wear OS (Phase 2), no HealthKit/Health Connect (Phase 2).

---

---

## Epic Coverage Validation

### Coverage Matrix

| FR | Requirement Summary | Epic Coverage | Story | Status |
|----|---|---|---|---|
| FR-1 | Exercise creation (name/type, 60-char, duplicate validation) | Epic 1 | Story 1.2 | ✓ Covered |
| FR-2 | Exercise rename (history preserved) | Epic 1 | Story 1.2 | ✓ Covered |
| FR-3 | Exercise soft-delete with confirmation | Epic 1 | Story 1.2 | ✓ Covered |
| FR-4 | Session lifecycle (start/pause/end, draft auto-save, summary) | Epic 1 + Epic 3 | Stories 1.3, 1.6, 3.5 | ✓ Covered |
| FR-5 | Strength Set logging (weight/reps, unit, pre-fill) | Epic 1 | Story 1.4 | ✓ Covered |
| FR-6 | Cardio Set logging (duration/distance, pace) | Epic 1 | Story 1.5 | ✓ Covered |
| FR-7 | Rest Timer (auto-start, configurable, haptic, skip/extend) | Epic 2 | Stories 2.1, 2.4 | ✓ Covered |
| FR-8 | Android Floating Bubble (overlay, one-tap, fallback) | Epic 2 | Story 2.2 | ✓ Covered |
| FR-9 | iOS Live Activity (Dynamic Island, deep-link, auto-end) | Epic 2 | Story 2.3 | ✓ Covered |
| FR-10 | Ghost type selection (3 types + Last Session, default Last Week, persists) | Epic 3 | Story 3.1 | ✓ Covered |
| FR-11 | Live Ghost comparison inline, Cardio target pace | Epic 3 | Story 3.2 | ✓ Covered |
| FR-12 | Ghost retirement/respawn on PR | Epic 3 | Story 3.4 | ✓ Covered |
| FR-13 | PR detection (weight/reps/Volume/Cardio pace, transaction isolation) | Epic 3 | Story 3.3 | ✓ Covered |
| FR-14 | PR Explosion (10-step sequence, dismiss, old Ghost retires visibly) | Epic 3 | Story 3.5 | ✓ Covered |
| FR-15 | Hall of Fame (permanent, read-only, chronological, per-exercise) | Epic 3 | Story 3.4 | ✓ Covered |
| FR-16 | Infinite Goal Engine (rate-of-progress, estimated date, 4-session basis) | Epic 4 | Story 4.1 | ✓ Covered |
| FR-17 | Goal display on Ghost Row (secondary line, placeholder) | Epic 4 | Story 4.1 | ✓ Covered |
| FR-18 | Weekly Gym Streak (cadence, reset, milestone notifications) | Epic 4 | Story 4.2 | ✓ Covered |
| FR-19 | Mercy Days (2/month, auto-consume, notification, monthly reset) | Epic 4 | Story 4.2 | ✓ Covered |
| FR-20 | Optional account (email/Apple/Google, local-only parity) | Epic 5 | Story 5.1 | ✓ Covered |
| FR-21 | Bidirectional cloud sync (offline-first queue, conflict resolution, sync status) | Epic 5 | Story 5.2 | ✓ Covered |
| FR-22 | Data export (JSON/CSV, all data, device-local) | Epic 5 | Story 5.3 | ✓ Covered |

### Coverage Statistics

- **Total PRD FRs:** 22
- **FRs covered in epics:** 22
- **Coverage percentage: 100%**

### Notable Observations

**1. Scope Expansion — "Last Session" Ghost type added (not a gap, but a change)**
FR-10 defines 3 Ghost types: Last Week, Last Month, All-Time PR. The epics introduce a 4th type: **Last Session** (as the first option in the GhostTypeSelector). This is an undocumented scope addition — not in the PRD or Glossary. Intentional or oversight?

**2. Gap — No dedicated Settings screen story**
Multiple FRs reference "app settings" (weight unit from FR-5, global Rest Timer default from FR-7, sync status from FR-21), and multiple stories reference Settings sub-screens (Settings → Session, Settings → Account, Settings → Exercise Management). However, no story explicitly builds the Settings screen layout, the weight unit toggle, or the global Rest Timer duration preference UI. This functionality is implied but unassigned.

**3. Gap — Per-Exercise Rest Timer configuration UI**
FR-7 states: "configurable per Exercise from the Exercise detail screen in settings (MVP scope)." Story 2.1 covers the configurable rest timer behavior, but no story explicitly creates the Exercise detail screen UI or the ACs for setting a per-exercise Rest Timer duration. The behavior is assumed without implementation steps.

**4. Open Question resolution (PRD §11 Q5 unresolved)**
PRD Open Question #5: "When a user deletes their account, is Hall of Fame and Session history deleted immediately or after a 30-day grace window?" — Story 5.3 resolves this as **immediate deletion** ("all local data is wiped") without documenting this was a deliberate design decision. Recommend noting this resolution in the PRD addendum.

**5. Push notification permission flow not explicitly scoped**
FR-18 requires Streak milestone push notifications. Story 4.2 references "only if notifications are opted in and permitted; disabled by default" — but no story covers the permission request UX (when and how the app asks for notification permission). Story 2.3 covers Live Activity (which uses notifications on iOS) but Android notification permission (required since Android 13 / API 33) is unaddressed.

**6. PRD NFRs all addressed; epics add 11 additional NFRs**
The 6 PRD NFRs map to epics NFR-1 through NFR-8. The epics additionally define NFR-9 through NFR-17 (accessibility: VoiceOver/TalkBack, Dynamic Type, 44dp touch targets, color-not-sole-indicator, Reduced Motion, Smart Invert, High Contrast; plus platform targets and permanently-free constraint). These additions are aligned with PRD §8 Aesthetic and §9 Constraints.

---

---

## UX Alignment Assessment

### UX Document Status

**Found — 2 documents (both status: final):**
- `planning-artifacts/ux-designs/ux-test-project-2026-06-19/DESIGN.md` — visual design system, component specifications, do/don't rules (30 KB)
- `planning-artifacts/ux-designs/ux-test-project-2026-06-19/EXPERIENCE.md` — interaction patterns, copy rules, accessibility flows (60 KB)

Both documents were used as explicit inputs to the epics and architecture documents.

---

### UX ↔ PRD Alignment

**Overall: Strong.** The UX documents extend the PRD without contradicting it.

| Check | Status | Note |
|---|---|---|
| Dark-first UI (PRD §8) | ✓ | DESIGN.md §Brand: "no light mode; it is the product's identity" |
| Ghost copy as self-narrative (PRD §8) | ✓ | DESIGN.md: Ghost data "body, ink-secondary"; copy rules in EXPERIENCE.md UX-DR22 |
| PR Explosion qualitative bar (PRD §8) | ✓ | DESIGN.md: 10-step full-bleed sequence; old Ghost "visibly" retires |
| Orange reserved for PRs only (PRD §8 anti-reference) | ✓ | DESIGN.md: pr-burst "Exclusively PR-related. Never used for warnings…" |
| No share/export/rating prompts on Session Summary (PRD §9) | ✓ | DESIGN.md: "No share button. No export prompt. No rating prompt." |
| No app-initiated interactions (PRD §9 NFR-2) | ✓ | Tab bar has "no badge indicators, no notification dots" |
| FR-10 Ghost types: Last Week / Last Month / All-Time PR | ⚠️ **DISCREPANCY** | DESIGN.md GhostTypeSelector shows 3 options; epics add "Last Session" as 4th — not in PRD or DESIGN.md |

---

### UX ↔ Architecture Alignment

**Overall: Excellent.** Architecture document was co-authored with UX as an explicit input.

| Check | Status | Note |
|---|---|---|
| DM Sans font loading (UX-DR1) | ✓ | ARCH-1/Story 1.1: font loaded in `_layout.tsx` before any screen renders |
| Full token system (UX-DR2) | ✓ | Story 1.1: all tokens in `/src/constants/index.ts` including `GHOST_DIM_OPACITY = 0.40` |
| Floating Bubble ≤200ms SLA (UX-DR7 + NFR-3) | ✓ | Architecture: async SLA pattern with warning log if exceeded |
| Live Activity read-only on lock screen (UX-DR8) | ✓ | Architecture constraint documented; taps route to app |
| PR detection transaction isolation (UX-DR6) | ✓ | Architecture: inner try/catch isolates PR failure from Set write |
| Ghost candidate active-session exclusion (ARCH-9) | ✓ | Enforced at SQL level in `ghosts.queries.ts` |
| Accessibility component requirements (UX-DR23–DR26) | ✓ | Architecture: Reduced Motion, Smart Invert, screen reader support all documented |

---

### Alignment Issues Found

**⚠️ Issue 1 — Ghost Type Selector option count (Low severity)**
- **DESIGN.md:** GhostTypeSelector component shows 3 option rows (LAST WEEK / LAST MONTH / ALL-TIME PR)
- **Epics/UX-DR16:** 4 options listed (Last Session / Last Week / Last Month / All-Time PR)
- **Impact:** Implementation will build 4 options per epics. DESIGN.md is out of date. No functional risk — clarify which is source of truth before Story 3.1.

**⚠️ Issue 2 — Gym Streak Widget Mercy Day display (Low severity)**
- **DESIGN.md:** Widget shows "2 mercy days left" count in the right column (hidden when full)
- **UX-DR15/Epics:** "small dot indicator visible only on active Mercy Day (no count surfaced)"
- **Impact:** Implementation agents will follow the epics (dot only). DESIGN.md should be updated to match. Minor UX decision — confirm intended behavior before Story 4.2.

**⚠️ Issue 3 — New Ghost materialize opacity in PR Explosion (Low severity)**
- **DESIGN.md (narrative):** "new Ghost value fades in from 0% to **30%** opacity"
- **DESIGN.md (token definition):** `ghost-dim = rgba(0,229,255,0.40)` = **40%**
- **Epics UX-DR6:** "fade in 0→**40%** over 400ms"
- **Architecture constants:** `GHOST_DIM_OPACITY = 0.40`
- **Impact:** 40% is consistent across token definition, epics, and architecture. The 30% in DESIGN.md narrative is an error. Implementation should use 40% (aligned with token system).

---

### Warnings

**⚠️ Live Activity Update Frequency Limit (not in Architecture)**
The PRD addendum notes: "iOS limits Live Activity update frequency to prevent battery abuse. The Rest Timer countdown should update via background timer with graceful degradation." This constraint is documented in PRD addendum but not explicitly addressed in the Architecture document or in Story 2.3. Recommend adding a note to Story 2.3 ACs about graceful timer degradation behavior.

**No missing UX documentation.** Both required documents exist and are comprehensive. The 30 UX Design Requirements (UX-DR1 through UX-DR30) in the epics demonstrate full extraction from the UX source documents.

---

---

## Epic Quality Review

### 1. Epic Structure Validation

#### User Value Focus

| Epic | Title / Goal | User Value? | Verdict |
|---|---|---|---|
| Epic 1 | "Mason can create exercises, log sets, view summary — fully functional offline logger" | ✓ User can track a complete gym session | ✅ Pass |
| Epic 2 | "Mason can log from Instagram/Spotify via Floating Bubble or Live Activity" | ✓ Core "invisible" UX mechanic live | ✅ Pass |
| Epic 3 | "Mason races past self, sees live Ghost comparison, PR celebration saved in Hall of Fame" | ✓ Core competitive mechanic live | ✅ Pass |
| Epic 4 | "Mason sees next target auto-generated after every PR; Streak tracked with Mercy Days" | ✓ Motivation flywheel complete | ✅ Pass |
| Epic 5 | "Mason can back up securely, access from any device, export at any time" | ✓ Production-ready with data safety | ✅ Pass |

**No technical-milestone epics found.** All 5 epics are user-outcome framed and independently deliver value.

---

#### Epic Independence

| Test | Result |
|---|---|
| Epic 1 stands alone | ✅ Full offline workout logger after Epic 1 |
| Epic 2 uses only Epic 1 output | ✅ Requires sessions (Epic 1) — no forward dependency |
| Epic 3 uses Epics 1–2 | ✅ Requires set logging + rest timer — sequential ✓ |
| Epic 4 uses Epics 1–3 | ✅ Requires PRs (Epic 3) for goal generation — sequential ✓ |
| Epic 5 uses Epics 1–4 | ✅ Requires all data to sync — terminal epic ✓ |

No circular dependencies. No epic requires a later epic to function.

---

### 2. Starter Template Check

Architecture specifies: `npx create-expo-app@latest GhostRival --template blank-typescript`

**Story 1.1 correctly fulfills this requirement** — it is explicitly titled "Project Foundation & Navigation Shell" and its first AC is the initialization command. ✅

Greenfield project checklist:
- [x] Project setup story (Story 1.1)
- [x] Dev environment configuration (EAS Build profiles)
- [x] CI/CD setup (`.github/workflows/ci.yml` defined in Story 1.1)

---

### 3. Story Quality Assessment

#### Epic 1 Stories

| Story | User-Centric? | ACs Format | Dependencies | Issues |
|---|---|---|---|---|
| 1.1 Project Foundation & Navigation Shell | ⚠️ Partly technical | ✓ Given/When/Then | None (first story) | DB schema concern (see below) |
| 1.2 Exercise Management (CRUD) | ✓ | ✓ | 1.1 (backward) | None |
| 1.3 Session Lifecycle | ✓ | ✓ | 1.1, 1.2 (backward) | None |
| 1.4 Strength Set Logging | ✓ | ✓ | 1.1–1.3 (backward) | Ghost pre-fill reference (minor) |
| 1.5 Cardio Set Logging | ✓ | ✓ | 1.1–1.3 (backward) | None |
| 1.6 Draft Session Recovery | ✓ | ✓ | 1.1–1.4 (backward) | "Save as Complete" incomplete until Epic 3 (documented) |

#### Epic 2 Stories

| Story | User-Centric? | ACs Format | Dependencies | Issues |
|---|---|---|---|---|
| 2.1 Rest Timer Bar | ✓ | ✓ | Epic 1 (backward) | None |
| 2.2 Android Floating Bubble | ✓ | ✓ | Epic 1, 2.1 | None |
| 2.3 iOS Live Activity | ✓ | ✓ | Epic 1, 2.1 | Ghost data referenced before Epic 3 (see below) |
| 2.4 Rest Timer Skip & Extend | ✓ | ✓ | 2.1, 2.2 | None |

#### Epic 3 Stories

| Story | User-Centric? | ACs Format | Dependencies | Issues |
|---|---|---|---|---|
| 3.1 Ghost Type Selection | ✓ | ✓ | Epic 1 | None |
| 3.2 Live Ghost Comparison | ✓ | ✓ | 3.1 | None |
| 3.3 PR Detection Engine | ⚠️ Partly technical | ✓ | Epic 1, 3.2 | Delivers clear user value but reads technical |
| 3.4 Hall of Fame & Ghost Retirement | ✓ | ✓ | 3.3 | None |
| 3.5 PR Explosion Animation | ✓ | ✓ | 3.3, 3.4 | None |

#### Epic 4 Stories

| Story | User-Centric? | ACs Format | Dependencies | Issues |
|---|---|---|---|---|
| 4.1 Infinite Goal Engine & Display | ✓ | ✓ | Epic 3 | None |
| 4.2 Gym Streak & Mercy Days | ✓ | ✓ | Epic 1 | Push notification permission UX unaddressed |

#### Epic 5 Stories

| Story | User-Centric? | ACs Format | Dependencies | Issues |
|---|---|---|---|---|
| 5.1 Onboarding & Account Creation | ✓ | ✓ | Epic 1 | None |
| 5.2 Offline-First Sync Queue | ⚠️ Partly technical | ✓ | Epic 5.1 | Borderline technical — but delivers data safety value |
| 5.3 Data Export & Account Management | ✓ | ✓ | 5.1, 5.2 | None |

---

### 4. Violations & Findings

#### 🔴 Critical Violations
**None found.**

---

#### 🟠 Major Issues

**Issue M1 — Story 2.3 forward reference to Ghost data in Live Activity**
- Story 2.3 (iOS Live Activity) describes the expanded lock screen layout including "Ghost data (body/ghost-dim)" in the left column.
- Ghost data is not available until Epic 3 (Story 3.1).
- As written, Story 2.3's Live Activity expanded view will show a Ghost data slot that is always empty during Epic 2 testing, and will only populate after Epic 3 is implemented.
- **Recommendation:** Add a clarifying AC to Story 2.3: "Given Epic 3 is not yet implemented, the Ghost data slot shows 'No ghost yet' in ink-disabled." This prevents implementation confusion.

**Issue M2 — No dedicated Settings screen story (structural gap)**
- Settings screen is referenced in: Story 1.2 (Exercise Management), Story 2.1 (per-Exercise rest timer config), Story 2.2 (Settings → Session), Story 4.2 (Settings → Account / sync status), Story 5.1 (Settings → Account), Story 5.3 (Settings → Account → Export / Delete Account).
- No story builds the Settings screen scaffold, the weight unit toggle, or the global Rest Timer default setting — all required by FR-5 and FR-7.
- **Recommendation:** Either add a Settings screen story to Epic 1 (Story 1.7) or ensure Story 1.1 explicitly includes the Settings screen scaffold. Otherwise implementation agents will make inconsistent assumptions about Settings screen structure.

---

#### 🟡 Minor Concerns

**Issue m1 — Story 1.1 creates all 6 DB tables upfront**
- Best practice: "each story creates tables it needs." Story 1.1 defines all 6 tables (exercises, sessions, sets, ghosts, hall_of_fame, sync_queue) at once.
- However: For a mobile SQLite + Drizzle app with a well-defined schema and solo developer, this is the correct pragmatic approach. Drizzle migrations are schema-wide; creating tables story-by-story would require managing 6+ incremental migrations with complex rollback risk.
- **Assessment:** Acceptable intentional deviation from the principle. Document in Story 1.1 as a deliberate decision, not oversight.

**Issue m2 — Story 1.4 references Ghost pre-fill before Ghost system exists**
- Story 1.4 AC: "Ghost benchmark values with label 'From your ghost' if Set 1 and Ghost exists."
- Ghost system is Epic 3. Before Epic 3, this AC leg is always false (no Ghost exists).
- The "if Ghost exists" condition handles it gracefully — the empty branch is the expected behavior in Epic 1–2.
- **Assessment:** No code change needed. Minor documentation clarity — add a note that the Ghost pre-fill branch is intentionally dormant until Epic 3.

**Issue m3 — Story 1.6 "Save as Complete" is incomplete until Epic 3**
- Story 1.6 explicitly states: "retroactive PR detection on the recovered Sets is deferred to Epic 3." Story 3.5 completes this.
- This is a known, documented forward dependency with a clear resolution story.
- **Assessment:** Well-handled. No change needed.

**Issue m4 — Push notification permission flow unaddressed**
- Story 4.2 references Streak milestone notifications being "opted in and permitted; disabled by default."
- No story covers when or how the app requests OS-level push notification permission (Android 13+ requires runtime permission POST_NOTIFICATIONS).
- **Recommendation:** Add a note to Story 4.2 or 5.1 to handle the notification permission request flow (Android 13+ and iOS combined request pattern).

**Issue m5 — Story 3.3 title reads as technical**
- "PR Detection Engine" sounds like a technical milestone. The user story starts correctly: "I want the app to detect when I break a personal record immediately after each Set."
- The ACs are user-value-driven.
- **Assessment:** Rename consideration only — "Personal Record Detection" or "Instant PR Detection" would be more user-centric without requiring content changes.

---

### 5. Best Practices Compliance Summary

| Epic | Delivers User Value | Independent | Stories Sized Right | No Forward Deps | ACs Testable | FR Traceability |
|---|---|---|---|---|---|---|
| Epic 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 2 | ✅ | ✅ | ✅ | ⚠️ M1 | ✅ | ✅ |
| Epic 3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Summary: 0 critical violations, 2 major issues, 5 minor concerns. All issues are addressable without re-scoping epics or stories.**

---

### PRD Completeness Assessment

The PRD is thorough and well-structured. Key strengths:
- All 22 FRs carry clear consequences/acceptance criteria.
- 13 explicit ASSUMPTIONs indexed in §12 for architecture follow-up.
- 5 open questions documented in §11 (especially Cardio live-Ghost comparison and account deletion).
- Addendum cleanly separates deferred concepts from MVP scope.

Potential gaps verified against epics:
- Onboarding flow: ✓ Covered by Story 5.1
- Settings screen: ⚠️ Referenced in 5+ stories but no dedicated story builds the scaffold (Major Issue M2)
- Push notification permission: ⚠️ Handled implicitly in Story 4.2 and 2.3, but no explicit UX for Android 13+ permission request
- Account deletion flow: ✓ Covered by Story 5.3 (resolved as immediate deletion)

---

## Summary and Recommendations

### Overall Readiness Status

## ✅ READY FOR SPRINT PLANNING

(with 2 recommended fixes before the first implementation story begins)

---

### Issues by Severity

| # | Severity | Description | Story Affected |
|---|---|---|---|
| M1 | 🟠 Major | Story 2.3 Live Activity expanded view references Ghost data before Epic 3 — implementation agents will need to know the Ghost slot is empty/placeholder until Epic 3 | Story 2.3 |
| M2 | 🟠 Major | No Settings screen story — Settings scaffold, weight unit toggle, global Rest Timer config, and Settings → Session navigation are all referenced across 5+ stories but never explicitly built | Stories 1.2, 2.1, 2.2, 4.2, 5.1–5.3 |
| m1 | 🟡 Minor | Story 1.1 creates all 6 DB tables upfront (acceptable pragmatic deviation) | Story 1.1 |
| m2 | 🟡 Minor | Story 1.4 Ghost pre-fill branch dormant until Epic 3 (handled by "if Ghost exists" condition) | Story 1.4 |
| m3 | 🟡 Minor | Story 1.6 "Save as Complete" intentionally incomplete until Epic 3 — well-documented | Story 1.6 |
| m4 | 🟡 Minor | Push notification permission flow (Android 13+/iOS) not explicitly scoped in any story | Story 4.2 |
| m5 | 🟡 Minor | Story 3.3 title "PR Detection Engine" reads as technical; content is user-value-driven | Story 3.3 |
| d1 | 🔵 Discrepancy | DESIGN.md shows 3 Ghost types; epics define 4 (added "Last Session") — confirm source of truth | Story 3.1 |
| d2 | 🔵 Discrepancy | DESIGN.md shows Mercy Day count in Streak Widget; epics specify dot-only indicator | Story 4.2 |
| d3 | 🔵 Discrepancy | DESIGN.md narrative says 30% Ghost opacity in PR Explosion; token and epics say 40% — follow the token | Story 3.5 |
| d4 | 🔵 Discrepancy | PRD addendum: Live Activity update frequency limit not reflected in Architecture or Story 2.3 | Story 2.3 |
| oq | 🔵 Open Q | PRD Open Question #5 (account deletion timing) resolved as immediate in Story 5.3 — not formally closed in PRD | PRD §11 |

**Total: 0 Critical, 2 Major, 5 Minor, 4 Discrepancies, 1 Open Question closure**

---

### Recommended Actions Before Sprint Planning

**Action 1 (Major M2) — Add a Settings screen story to Epic 1**
Create Story 1.7: Settings Screen Scaffold covering: 3-tab Settings layout, weight unit toggle (kg/lb), global Rest Timer default field, Settings → Session, Settings → Account stubs. This unblocks Stories 2.1, 2.2, 4.2, 5.1, and 5.3 from making inconsistent Settings UI assumptions.

**Action 2 (Major M1) — Add a note to Story 2.3 about Ghost data placeholder**
Add one AC to Story 2.3: "Given Epic 3 is not yet complete, Ghost data slots in the Live Activity expanded view show 'No ghost yet' in ink-disabled." Prevents an implementation agent from hardcoding "assume Ghost exists."

**Action 3 (Discrepancy d1) — Confirm 4th Ghost type ("Last Session")**
Decide: Is "Last Session" in scope for Epic 3? If yes, update PRD FR-10 and DESIGN.md to document it. If no, remove from epics. Confirm before Story 3.1 begins.

**Action 4 (Discrepancy d2) — Clarify Mercy Day display: count vs dot**
DESIGN.md says "2 mercy days left" count; epics say dot-only. Decide once and update the other. Confirm before Story 4.2 begins.

**Action 5 (Minor m4) — Scope push notification permission UX**
Add to Story 4.2 or Story 5.1: an AC covering the OS notification permission request (iOS runtime dialog + Android 13+ POST_NOTIFICATIONS runtime permission), including the timing (first Streak milestone approaching, not on cold start).

---

### Final Note

This assessment validated Ghost Rival across 5 dimensions: document inventory, PRD analysis (22 FRs / 6 NFRs), epic FR coverage (100%), UX alignment (3 minor discrepancies), and epic quality (0 critical violations). The planning artifacts are cohesive and production-quality. The 2 major issues and 5 minor concerns are all resolvable in-place — none require epic re-scoping or PRD revision.

Ghost Rival is ready to proceed to Sprint Planning after addressing Actions 1–5 above.

**Report generated:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-06-19.md`
**Assessor:** BMad Implementation Readiness skill
**Date:** 2026-06-19.
