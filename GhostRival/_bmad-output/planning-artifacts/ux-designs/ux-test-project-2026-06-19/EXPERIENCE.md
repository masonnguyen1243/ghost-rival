---
title: EXPERIENCE — Ghost Rival
status: final
created: 2026-06-19
updated: 2026-06-19T00:00:00+07:00
project: Ghost Rival
platform: mobile (iOS + Android, React Native)
cross-reference: DESIGN.md
---

## Foundation

Ghost Rival is a single-surface mobile app for solo gym-goers. It runs on iOS 16.1+ and Android 10+ via React Native. There is no web surface, no tablet-first layout, and no social layer. The product exists in two modes: **ambient** (the user is between sessions, or has left the app) and **active** (a session is in progress).

The governing philosophy is "invisible by design." The app does not send unsolicited notifications, does not surface prompts, does not ask for ratings, and does not run onboarding interstitials. The only unprompted interactions Ghost Rival initiates are:
1. The Rest Timer haptic pulse when the countdown reaches zero.
2. Opted-in streak milestone notifications (Gym Streak milestones only, disabled by default).

Everything else is pull, not push. The user opens the app when they want it. The Floating Bubble / Live Activity exists specifically to support returning to the app without having to navigate — but it does not pulse, notify, or demand anything beyond what the user has already consented to by starting a session.

**Platform parity:** iOS and Android share the same information architecture, navigation structure, component library, and interaction patterns. The meaningful platform delta is confined to the ambient-session surface (Floating Bubble on Android vs Live Activity on iOS) and permission models. See **Responsive & Platform** for the full delta.

**Data model:** All user data is stored on-device first, synced to a private cloud on reconnect. No data is shared with third parties. No analytics fingerprinting. No social graph.

---

## Information Architecture

**Key-screen mockups** (spines are authoritative; mockups are visual references):
- [Home tab](mockups/home-tab.html) — Ghost lineup, Gym Streak widget, FAB
- [Session screen](mockups/session-screen.html) — Set logging, Ghost comparison panel, Rest Timer Bar
- [PR Explosion overlay](mockups/pr-explosion.html) — Shockwave burst, NEW RECORD card, Infinite Goal chip
- [Floating Bubble — Android](mockups/floating-bubble.html) — Ambient session indicator, timer countdown

### Surface map

| Surface | Reached from | Purpose |
|---|---|---|
| Home tab | Tab bar (tab 1) | Ghost lineup per exercise; Gym Streak widget; Infinite Goal targets |
| Hall of Fame tab | Tab bar (tab 2) | All-time PRs per exercise (chronological); session history |
| Settings tab | Tab bar (tab 3) | Units (kg/lb); default rest timer; account; data export |
| Session (full-screen takeover) | "Start Workout" FAB on Home tab | Active gym session — set logging, rest timer, Ghost comparison |
| Ghost Type Selector (bottom sheet) | Tap any Ghost Row on Home | Switch Ghost benchmark (Last Week / Last Month / All-Time PR) |
| Session End Confirmation (modal) | "End Workout" within Session | Confirm end; prevents accidental dismissal |
| Session Summary (screen) | Confirm "End Workout" | Read-only post-session summary with PR highlights |
| PR Explosion (full-screen overlay) | Automatic — PR detected during Set confirm | PR celebration; Ghost retire; Infinite Goal; Hall of Fame confirmation |
| Exercise Creator (bottom sheet) | "Add Exercise" during Session | Name new exercise; select Strength or Cardio type |
| Draft Resume prompt (modal) | App open after force-close during session | Offer to resume saved draft session |
| Hall of Fame Slide-In Panel (read-only) | User-initiated from session header button | Read-only access to Hall of Fame per exercise from within an active session — does not interrupt or end the session |

### Navigation rules

- The bottom tab bar is **always hidden during an active Session**. There is no way to navigate to other tabs without ending the session.
- The FAB ("Start Workout") is only visible on the Home tab when no session is active.
- Deep links from Floating Bubble / Live Activity always route to the active Session screen.
- There is no back navigation from the Session screen to the tab bar. The exit path is the "End Workout" flow only.
- The **Hall of Fame Slide-In Panel** is accessible from within an active Session via a user-initiated tap in the session header. The panel is read-only and does not end or interrupt the session. The tab bar remains hidden while the panel is open. The panel slides in over the Session screen and can be dismissed by swipe-down or a close button.

---

## Voice and Tone

Ghost Rival's voice is that of a trusted training partner who talks only when it matters — direct, warm, never hyperbolic, and completely free of fitness-bro language. It treats the user as a capable adult who doesn't need motivation lectures.

**Ghost copy rule:** Ghost benchmarks are always described in self-narrative terms — as versions of the user's own past self, not as abstract data labels. Copy must read like self-reflection, not like a database field.

| Do | Don't |
|---|---|
| "you from last week" | "Last Week Ghost" |
| "the you that peaked in March" | "All-Time PR record" |
| "your best ever" | "All-Time PR Ghost value" |
| "come back next time to beat it" | "No data available for comparison" |
| "Your first Bench Press Ghost has been summoned." | "Ghost created successfully." |
| "No records yet. Every rep you do becomes history." | "No PRs found." |
| "2 reps ahead of you from last week" | "Delta: +2 reps vs Last Week Ghost" |

**Celebration register:** PR moments are genuine, not hyperbolic. "NEW RECORD" is the correct register — it states the fact. Not "INCREDIBLE!!!" or "YOU CRUSHED IT!" The weight of the moment comes from the visual system (PR Explosion), not from the copy shouting.

**Absence of guilt:** Empty states, missed sessions, and low-volume sets never receive negative framing. The app does not know if the user is injured, traveling, or having a bad week. It waits patiently and celebrates when they return.

**Microcopy economy:** Every label, button, and status message should be the minimum number of words required to communicate without ambiguity. If a label can be one word, it is one word. If a CTA can be a verb, it is a verb.

---

## Component Patterns

Cross-references use `{colors.token}` and `{typography.scale}` to reference DESIGN.md tokens.

| Component | Use | Behavioral rules |
|---|---|---|
| Ghost Row | One per exercise on Home; shows Ghost benchmark | Tap opens Ghost Type Selector sheet. Full-width tap target. Ghost data in `{colors.ghost-dim}`. Exercise name in `{typography.heading}`. |
| Set Row | One per logged set in Session | **Pre-fill hierarchy:** (1) Previous Set weight/reps within session — Sets 2+; (2) Ghost benchmark data — Set 1 when Ghost exists; (3) blank — Set 1, no Ghost. Ghost comparison delta shown inline. Tap to edit within 30s of logging (after 30s, row is locked; tap locked row shows toast: "Sets are locked after 30 seconds"). Edit window extends to 90s when VoiceOver or TalkBack is active. |
| PR Badge | Inline indicator on Ghost Row and Set Row | Outline-only (no fill) in list contexts. Filled `{colors.pr-burst}` in Hall of Fame only. |
| PR Explosion Overlay | Full-screen, fires on PR detection | Full-bleed, 0 corner radius. No auto-dismiss. User controls exit. Blocks all input except "Continue" or outside tap. |
| Floating Bubble | Android only; ambient session indicator | 56dp circle. One tap = route to Session with pre-filled Set. Long-press = edit sheet. Pulses on timer zero. |
| Live Activity | iOS only; Dynamic Island / lock screen | Read-only on lock screen (iOS constraint). Compact in DI, expanded on lock screen. |
| Session Summary Card | Post-session; shown after "End Workout" | Read-only. No share, no export, no rating prompt. First-Ghost callout if applicable. |
| Hall of Fame Entry Row | Per-PR record in Hall of Fame tab | Chronological, newest first. PR badge filled here. PR type label in `{typography.label}`. |
| Tab Bar | 3-tab bottom navigation | Hidden during Session. Icon-only when inactive. Icon + label when active. No badge indicators. |
| Empty State | Per-surface when no content exists | Centered layout. `{typography.heading}` headline. `{typography.body}` copy. Optional pill CTA. |
| Rest Timer Bar | Pinned bottom of Session screen | 3px height. Drains ghost-accent left-to-right. `{colors.pr-burst}` flash at zero. |
| Infinite Goal Chip | PR Explosion overlay + Ghost Row (persistent) | Outline pill, `{colors.pr-burst}` border. Forward-looking target. Dismissible on overlay; persistent on Ghost Row. Hidden from Ghost Row when plateau detected (no PR in 5+ sessions). |
| Gym Streak Widget | Home tab, above Ghost lineup | Displays current streak count in `{typography.heading}` with a flame icon. Mercy Day indicator shown as a small dot indicator on active mercy day (no count surfaced). Tap opens streak detail explanation (first interaction only — tooltip explaining weekly cadence, Mercy Day rules, and reset behavior). Milestone notification badge appears as a pulse on the widget icon on milestone days. Streak count does not turn red on break or near-break; widget uses `{colors.ink-primary}` always. |
| Ghost Type Selector | Bottom sheet — triggered by Ghost Row tap on Home | 4-option list (Last Session / Last Week / Last Month / All-Time PR) with radio-style selection. Current selection marked with `{colors.ghost-accent}` checkmark. Each option shows supplementary Ghost data (value + time reference). Options with no data in range show a footnote: "No session in this range." If selected, Ghost Row shows next-available Ghost with: "Showing your most recent session instead." Selection persists per exercise indefinitely. Accessibility: each option implements `accessibilityRole="radio"` and `accessibilityState={{ checked: isSelected }}`. Full label: "[Ghost type], [value], [time reference], [selected/not selected]." |
| Session End Confirmation | Modal — triggered by "End Workout" tap | Content: "End this workout?" / "[X exercises · Y sets logged]" in `{colors.ink-secondary}` / "End Workout" CTA in `{colors.pr-burst}` label / "Keep Going" CTA in `{colors.ink-secondary}`. If 0 sets logged, primary button changes to a warning state: "No sets logged — still end?" and the "End Workout" CTA is replaced with "End Anyway" to require explicit intent. |
| Exercise Creator | Bottom sheet — triggered by "Add Exercise" during Session | Text field: exercise name. Toggle: Strength / Cardio. Validation: name required; duplicate name within user's exercise library shows error in `{colors.feedback-error}`: "You already have an exercise with this name." CTA: "Add" / dismiss by swipe-down. On add: exercise appears in Session immediately; Sheet dismisses. |
| Draft Resume Prompt | Modal — fires on app open when draft session exists | Content: "Resume your [session exercise list]?" / session start time in `{colors.ink-secondary}`. Three CTAs: "Resume" (always visible), "Start Fresh" (always visible, requires second confirmation: "Discard this session?"), "Save as Complete" (promoted to primary CTA when draft is older than 2 hours — converts the draft into a completed session record without resuming). On "Save as Complete": draft is finalized as a completed session, PR detection runs retroactively on all recovered sets, PR Explosions fire if applicable before returning to Home. |
| Undo Toast | Appears at bottom of screen above tab bar (or above keyboard if active) | Appears after swipe-to-delete on Set Row. Content: "Set deleted" + "Undo" link. Duration: 4 seconds; 8 seconds when VoiceOver or TalkBack is active. `accessibilityLiveRegion` set on the toast container. After 4/8s, delete is permanent. Tapping "Undo" restores the Set Row in place. |
| Hall of Fame Slide-In Panel | Slides over Session screen from right | Read-only. Shows Hall of Fame per exercise (the exercise currently active in session is shown by default). Navigable across exercises via horizontal scroll. No input, no edit, no session interaction. Session continues uninterrupted in background. Dismiss: swipe-left or close button in panel header. |

---

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| No exercises, no history | Home tab | Empty state: ghost icon at 40% opacity, warm encouragement copy, FAB visible |
| Exercise exists, no Ghost yet | Ghost Row | Ghost data slot shows placeholder in `{colors.ink-secondary}`: "No ghost yet — come back after your first session" |
| Ghost loaded, no active session | Ghost Row | Full layout: Ghost data in `{colors.ghost-dim}`, Ghost type badge in `{colors.ghost-accent}` |
| Session active | All screens except Session | Tab bar hidden; FAB hidden; deep link routes to Session |
| Rest Timer running | Session screen | Rest Timer Bar draining; Floating Bubble / Live Activity showing countdown |
| Rest Timer at zero | Session screen | Bar flashes `{colors.pr-burst}`; device vibrates; Floating Bubble pulses once |
| PR detected | Session screen | PR Explosion overlay fires immediately; Session input blocked |
| PR Explosion active | Full screen | All session input blocked. Only dismiss interaction available. |
| Session ended | Session Summary | Read-only. "Done" or tap-anywhere routes to Home tab. |
| Draft session exists | App launch | Draft Resume prompt modal fires before Home tab loads. |
| Offline | Any surface | Core features work fully. Sync indicator in Settings only (not surfaced during session). See Offline-First Behavior. |
| Sync pending | Settings tab | Small inline indicator: "Syncing…" / "Synced" / "Sync failed — tap to retry". Not shown on other tabs. |
| First launch (no account) | Onboarding | Single screen: "Local only" vs "Sign in" choice. No interstitials, no feature tours. |
| Session: no exercises added yet | Session screen | Empty exercise list state: centered ghost icon at `{colors.ghost-dim}`, copy "Add your first exercise to get started." with "Add Exercise" pill CTA. "End Workout" is available but shows 0-set warning in the End Confirmation modal. |
| Home: session active in background | Home tab (unreachable normally — deep link edge case) | Tab bar is hidden; FAB is hidden; a persistent banner appears at top of Home: "Session in progress — tap to return." Tapping the banner routes back to active Session. |
| Hall of Fame: per-exercise filtered view | Hall of Fame tab | Tap on any exercise name in Hall of Fame shows all PR entries for that exercise in reverse chronological order. Filter pill shows the exercise name. "All PRs" pill returns to the full chronological feed. |
| Settings: account deletion confirmation | Settings tab | Two-step confirmation. Step 1 modal: "Delete your account? This will erase all local data and unlink your cloud account." CTAs: "Delete Account" (`{colors.feedback-error}` label) / "Cancel". Step 2 modal: "This cannot be undone. Type DELETE to confirm." Text field with `{colors.feedback-error}` border on focus. CTA activates only when field contains "DELETE" exactly. |

---

## Interaction Primitives

- **Tap** — confirms a Set row (pre-filled values), selects a Ghost type, navigates tabs, dismisses PR Explosion, triggers FAB.
- **Long-press** — on Floating Bubble: opens edit sheet for weight/reps before logging. On Set Row: opens delete confirmation (destructive action, requires explicit confirmation).
- **Swipe down** — dismisses bottom sheets and modals (Ghost Type Selector, Exercise Creator).
- **Swipe to delete** — on Set Rows within 30s of logging: removes the set (with undo toast, 4s). After 30s, sets are locked.
- **No pinch, no zoom, no rotation.** Ghost Rival has no map, image, or zoomable content.
- **No horizontal swipe navigation.** Tabs are accessed via the tab bar only. There is no swipe-between-tabs gesture.
- **FAB tap** — starts a new Session. If a draft exists, offers resume-or-discard modal instead of starting fresh.
- **Haptic feedback:**
  - Light tap: Set confirmed.
  - Medium tap: PR detected (fires just before PR Explosion overlay appears).
  - Heavy tap: Rest timer reaches zero on Floating Bubble pulse.
  - Error tap: Duplicate set value warning.

---

## Accessibility Floor

- **VoiceOver (iOS) / TalkBack (Android):** All interactive elements have descriptive accessibility labels. Ghost Row label: "[Exercise name]. Ghost: [self-narrative description]. [Ghost type] [value]." Set Row label: "Set [number]. [Weight] by [reps]. [Ghost comparison delta]."
- **Dynamic Type (iOS) / Font Scale (Android):** All text scales with system font size settings. `{typography.display}` numbers reflow using auto-sizing down to a minimum of 28pt before truncating. No fixed-width containers clip text.
- **Minimum touch target:** 44×44pt/dp on all tappable elements. Ghost Rows, Set Rows, and Hall of Fame Entries are full-width tap targets.
- **Color independence:** No information is conveyed by color alone. Ghost data is distinguished from current data by both color (`{colors.ghost-dim}` vs `{colors.ink-primary}`) AND opacity AND position. PR badges have explicit "PR" text label.
- **Reduced Motion:** When the system reduced-motion preference is on, the PR Explosion shockwave animation is replaced by a static high-contrast flash (`{colors.pr-burst}` fill for 200ms) and the "NEW RECORD" card appears without the particle animation. The Ghost retire and new Ghost materialize animations are instant (no fade). All functional behavior is preserved.
- **Contrast ratio:** `{colors.ink-primary}` (#ffffff) on `{colors.surface-base}` (#0d0d0f) = 19.6:1. `{colors.ink-secondary}` (#8888a0) on `{colors.surface-raised}` (#141418) = 4.6:1 (passes AA). `{colors.ghost-accent}` (#00e5ff) on `{colors.surface-raised}` ≈ 9.6:1 (passes AAA). `{colors.ghost-dim}` (rgba 0,229,255 at 40%) on `{colors.surface-raised}` is intentionally below AA — this is by design, as Ghost data is always supplementary and never the primary communication channel. A full-opacity `{colors.ghost-accent}` alternative is available via Settings ("High contrast ghost data") and is automatically activated by system accessibility flags (see below).
- **High Contrast Ghost — auto-trigger:** When the user enables Increase Contrast on iOS (Settings → Accessibility → Increase Contrast, triggering `UIAccessibilityIsReduceTransparencyEnabled`) or the equivalent Android flag (`isHighTextContrastEnabled`), Ghost Rival automatically activates High Contrast Ghost rendering (`{colors.ghost-accent}` at full opacity for all Ghost data) without requiring the user to find the in-app Settings toggle. The in-app Settings toggle remains available as a manual override. No user action within Ghost Rival is required to benefit from the system accessibility setting.
- **Smart Invert compatibility (iOS):** Ghost Rival's color semantics (cyan = Ghost, orange = PR) would be destroyed by iOS Smart Invert without explicit flagging. The following elements must set `accessibilityIgnoresInvertColors = true` so Smart Invert users get inverted chrome (light backgrounds) while preserving color meaning: Ghost icon illustrations, PR Explosion rings and particles, all `{colors.ghost-dim}` text elements, all `{colors.ghost-accent}` indicators, all `{colors.pr-burst}` elements. This must be documented as an explicit implementation requirement.
- **Screen reader PR Explosion:** VoiceOver / TalkBack announce "New personal record: [value]. Previous: [old value]. Saved to Hall of Fame." before announcing the card content. Focus management: set `accessibilityViewIsModal = true` (iOS) / `importantForAccessibility="yes"` on the overlay container (Android). Traversal order: overlay announcement → "NEW RECORD" heading → new value → "Previous: [old value]" → "Saved to Hall of Fame" → Infinite Goal chip (if present) → "Continue" button. On dismiss, focus returns to the Set Row that triggered the PR.
- **Swipe-to-delete screen reader equivalent:** Swipe-to-delete on Set Rows must also be available via the VoiceOver rotor / TalkBack custom actions menu. Implement a "Delete" custom action on Set Row accessible elements via `accessibilityActions` (React Native) so screen reader users can trigger deletion without performing a swipe gesture.
- **Rest timer zero — persistent signal:** Timer zero fires: (1) a 2–3 cycle repeating haptic pattern (not a single pulse) for users who are not watching the screen; (2) on the Floating Bubble, the sub-label changes to "Ready" persistently (remains until next set is logged); the Bubble border changes from `{colors.ghost-accent}` to `{colors.pr-burst}` and persists; (3) a screen-reader live announcement is pushed: "Rest complete. Ready to log your next set." These signals persist until the user logs the next set, satisfying WCAG 1.3.3 for users who cannot feel instantaneous haptics or are in another app.

---

## Session Lifecycle

### Phase 1 — Session Start

The user taps the FAB ("Start Workout") on the Home tab. If no draft session exists, a new Session begins immediately — no confirmation dialog, no exercise pre-selection screen. The Session full-screen takeover slides up from the bottom (standard iOS modal presentation / Android bottom sheet to full-screen transition).

If a draft session exists (from a previous force-close), the Draft Resume prompt modal fires before the Session takeover:
- "Resume your last session?" — options: "Resume" / "Start Fresh"
- "Start Fresh" discards the draft after a second confirmation.

The tab bar is hidden once the Session takeover is visible.

### Phase 2 — Active Session

The user adds exercises and logs sets. Exercises are either:
- Selected from previously created exercises (shown in a searchable list within the session)
- Created new via the Exercise Creator sheet (name + Strength or Cardio type)

**Set entry pre-fill (when the Set entry form opens):**
- Sets 2 and onward: pre-fill with the weight and reps from the previous Set within this session.
- Set 1 (no prior Set in session): pre-fill from Ghost benchmark data if a Ghost is loaded for this exercise.
- Set 1 with no Ghost: blank fields.
A pre-fill indicator label appears below the fields in `{colors.ink-secondary}`: "Same as last set" (previous-Set pre-fill) or "From your ghost" (Ghost pre-fill). No label for blank.

Each logged Set immediately:
1. Saves to local storage (crash-safe).
2. Compares against the loaded Ghost for that exercise.
3. If PR detected → PR Explosion fires (see PR Explosion Sequence).
4. If no PR → Ghost comparison delta appears inline on the Set Row.
5. Rest Timer starts (duration from Settings default, or user-adjusted per session).

**Set entry validation:**
- Weight: must be greater than 0. If weight = 0 or negative, the "Log Set" button is disabled and a `{colors.feedback-error}` inline note appears below the weight field: "Weight must be greater than 0."
- Reps: must be 1 or greater. If reps = 0, the "Log Set" button is disabled with the same inline error pattern: "Enter at least 1 rep."
- Validation errors clear immediately when the user corrects the field value.

**Exercise deleted while session is active:** If an exercise is deleted from the library while a session containing that exercise is in progress, the session's sets for that exercise are preserved. The exercise name is marked "(deleted)" in the session exercise list. The session completes normally. After session end, the exercise's Hall of Fame entries are archived (not destroyed). The exercise does not appear in future session exercise pickers.

### Phase 3 — Leaving the App During a Session

When the user navigates away from Ghost Rival during an active Session:
- **Android:** Floating Bubble appears (if permission granted). If permission denied, a notification-style fallback appears in the notification shade (read-only, no action). **If SYSTEM_ALERT_WINDOW permission is revoked mid-session** (user revokes in system settings while session is active): Ghost Rival detects the revocation event and immediately promotes to the persistent notification fallback. A one-time toast is shown: "Overlay permission removed — logging via notification instead." The notification fallback activates without any gap in session continuity.
- **iOS:** Live Activity appears in the Dynamic Island or lock screen (if permission granted). If permission denied, no ambient indicator — the session continues in the background but the user must return to the app manually. **If a competing Live Activity relegates Ghost Rival to minimal state:** the minimal state shows the Ghost icon only. No fallback notification is triggered by minimal state — this is expected iOS platform behavior. If the Live Activity is entirely ended by the OS (rare, due to memory pressure), the session continues uninterrupted; the user must return to Ghost Rival manually.

The session never pauses automatically. The rest timer continues running in the background. The app remains in a "session active" state until explicitly ended.

### Phase 4 — Session End

The user taps "End Workout" within the Session. A confirmation modal appears:
```
"End this workout?"
[body, ink-secondary] "X exercises · Y sets logged"
[Button: "End Workout" — pr-burst label]  [Button: "Keep Going" — ink-secondary]
```

**0-set guard:** If 0 sets have been logged across all exercises, the "End Workout" button is not blocked — but the confirmation modal replaces the summary line with a warning: "No sets logged yet." The primary CTA changes to "End Anyway" to require conscious intent. A 0-set session is discarded after confirmation (not saved to history, does not affect Ghost data or Gym Streak).

On confirmation, the Floating Bubble / Live Activity is dismissed. The Session Summary screen appears. The tab bar returns.

### Phase 5 — Draft Recovery

If the app is force-closed (OS kill, crash, low-memory termination) during an active session:
- All logged Sets have already been saved to local storage (saved on every Set confirmation, not on session end).
- On next app open, the Draft Resume modal fires before Home tab loads.
- The draft contains: all exercises, all sets, session start time, active Ghost references.
- The Rest Timer state is not preserved (it resets to default on resume).
- **Draft unit safety:** All weights in the draft are stored in canonical kilograms regardless of the display unit at time of logging. If the user changes units (kg→lb) between force-close and resume, the draft displays values converted to the new unit. No data is transformed — only the display representation changes.
- **"Save as Complete" path:** When the draft is older than 2 hours, the Draft Resume modal promotes "Save as Complete" to primary CTA. Selecting "Save as Complete" finalizes the draft as a completed session without resuming it. After finalization, PR detection runs retroactively on all recovered sets; PR Explosions fire sequentially for any qualifying sets before returning to Home tab. The Gym Streak is credited for the finalized session date.
- **PR re-evaluation on recovery:** Whether the user taps "Resume" or "Save as Complete", PR detection runs over all recovered Sets against the Ghost data that was active at session time. If a PR is found that was not detected before the force-close, the PR Explosion fires and the Hall of Fame entry is written. This prevents silent PR loss at app force-close.

---

## Ghost Comparison Patterns

### Strength Ghost comparison

During a Strength session, each Set is compared to the Ghost benchmark set by set. The Ghost is the user's historical performance across the same exercise in a single session (Last Week / Last Month / All-Time PR — user's choice per exercise).

**Live comparison logic (per Set logged):**

| Condition | Delta display |
|---|---|
| Same weight, same reps | "matches you from [ghost time]" |
| Same weight, more reps | "[n] reps ahead" |
| More weight, any reps | "[n]kg heavier — ahead" |
| Less weight, any reps | "[n]kg lighter" (no negative framing) |
| Same weight, fewer reps | "[n] reps behind" |

All delta copy uses `{colors.ghost-dim}` on the Set Row. Delta is always expressed as a self-narrative sentence, not a numeric delta with a +/- sign.

**More sets than Ghost had:** If the user logs more sets than the Ghost session contained, the Ghost comparison slot displays: "beyond your ghost's last set" in `{colors.ink-secondary}`. This is not a PR in itself — PR detection requires an actual weight/reps improvement. The copy acknowledges the extra effort without overplaying it.

**Ghost self-reference exclusion:** Ghost candidates always exclude the current in-progress session. The `session_id` of the active session is excluded from all Ghost candidate queries at session start and refreshed if the session ID changes. "Last Session" always refers to the most recently **completed** session; it can never point to the session currently being logged. This invariant is enforced at the data query level, not the display level.

**Set comparison granularity:** Ghost comparison is set-by-set only. The app does not attempt to match Set 3 of this session to Set 3 of the Ghost session. It compares each logged Set independently against the Ghost's best set. Volume comparison (total weight × reps for the session) is available on the Session Summary only, not inline.

### Cardio Ghost comparison

During a Cardio session (duration + distance sets), Ghost comparison works as follows:

**Live (during Set):** Target pace from the Ghost session is shown as a reference at the top of the Set entry form: "[n] min/km from [ghost time]". This is read-only; no live GPS pace is integrated in v1 (→ open question from PRD §11 item 1).

**Post-Set:** Delta is shown after the Set is confirmed: "X seconds per km faster" / "matched your ghost pace" / "X seconds per km slower". No negative framing beyond the descriptive delta.

**PR detection for Cardio:** A Cardio PR is triggered when the user achieves a new best pace (lower min/km) at equal or greater distance, or a new longest distance at equal or better pace. The PR Explosion fires the same sequence as Strength.

**Multiple PR types on the same Set:** A single Set can trigger Weight PR, Reps PR, and Volume PR simultaneously. In this case, a single PR Explosion fires for the highest-value PR by display hierarchy (Weight PR > Reps PR > Volume PR). A single Hall of Fame entry is written per Set, tagged with all applicable PR types. No second PR Explosion fires within the same Set confirmation.

**PR rollback after swipe-to-delete:** If the user deletes a Set within the 30s edit window (or 90s for screen reader users) after that Set triggered a PR Explosion: the Hall of Fame entry for that PR is retracted and the previous Ghost benchmark is restored. The PR Explosion sequence is not re-shown for the rollback — the retraction is silent. A toast appears: "Set deleted. PR removed from Hall of Fame." The Ghost Row returns to its prior state.

**Multi-device sync PR re-evaluation:** After cloud sync merges data from two devices, Hall of Fame entries are re-evaluated against the merged dataset. If a PR recorded on one device no longer qualifies against the merged historical record, it is flagged as "Superseded" in the Hall of Fame (visually distinguished with `{colors.ink-secondary}` copy: "Superseded by a higher record from another device") but not deleted. No retroactive PR Explosion fires for the corrected record. Ghost benchmarks update to reflect the merged dataset on next app open.

### Self-narrative copy rules

Ghost time references follow a consistent hierarchy:
- Within the last 7 days → "you from [day]" (e.g. "you from Tuesday")
- 8–30 days ago → "you from last week" or "you from [N] weeks ago"
- 31–90 days ago → "you from last month" or "you from [month]"
- 90+ days ago → "the you that peaked in [month + year]"
- All-time PR → "your best ever"

These phrases are used in Ghost Row copy, Set Row delta text, PR Explosion "Previous ghost" line, and Session Summary Ghost comparison. They are never abbreviated or truncated to data-label format in user-facing copy.

---

## Infinite Goal Engine

The Infinite Goal Engine generates the next performance target after each PR. Its output appears as an Infinite Goal Chip on the PR Explosion overlay and persists on the Ghost Row until the next PR for that exercise.

### Input signals

| Signal | Definition |
|---|---|
| `pr_value` | The just-set PR value (weight in canonical kg, reps count, or pace in sec/km) |
| `pr_type` | Weight PR \| Reps PR \| Volume PR \| Cardio Pace PR \| Cardio Distance PR |
| `session_count` | Total completed sessions for this exercise |
| `pr_velocity` | Average PR improvement rate over the last 3 PRs for this exercise (0.0 if fewer than 3 PRs exist) |

### Target calculation

| Phase | Condition | Increment |
|---|---|---|
| Beginner | `session_count` < 10 | 2.5% of `pr_value` |
| Intermediate | `session_count` 10–49 | 1.5% of `pr_value` |
| Plateau | `pr_velocity` < 0.5% per session over last 3 PRs | 1.0% of `pr_value` |
| Advanced | `session_count` ≥ 50 and `pr_velocity` ≥ 0.5% | 2.0% of `pr_value` |

All calculated increments are rounded to the nearest valid plate increment (0.5 kg / 2.5 lb). Minimum increment: 0.5 kg / 1 lb (if rounding produces 0, use the minimum).

**Reps-only PRs** (same weight, more reps): target = current reps + 1.

**Cardio Pace PRs**: target = current best pace − 5 sec/km (beginner) or − 2 sec/km (intermediate/advanced/plateau).

**Cardio Distance PRs**: target = current best distance + 5% rounded to nearest 0.5 km.

### Display format

| PR type | Chip label |
|---|---|
| Weight PR | "Next target: [value] kg" (or lb per Settings) |
| Reps PR | "Next target: [reps] reps at [weight]" |
| Volume PR | Displayed as weight + reps combination that achieves the target volume, not raw volume number |
| Cardio Pace PR | "Next target: [min:sec] /km" |
| Cardio Distance PR | "Next target: [distance] km" |

### Edge cases

- **First PR ever for an exercise (`session_count` = 1):** Algorithm runs normally with beginner phase.
- **Plateau state (no PR in 5+ consecutive sessions for this exercise):** Infinite Goal Chip is removed from the Ghost Row. The user does not need a forward target they are not currently reaching. The chip re-appears on the next PR using the plateau increment.
- **Rapid beginner gains (user beats target within 1 session):** Target recalculates from the new PR immediately using the same formula. No cap on recalculation frequency.
- **Unit change (kg → lb):** Target recalculates from the stored canonical kg value, displayed in the new unit. No historical re-evaluation.
- **Multiple simultaneous PR types:** One Infinite Goal Chip is generated per PR Explosion (one per Set). The chip targets the highest-priority PR type (Weight > Reps > Volume for Strength; Pace > Distance for Cardio).

---

## PR Explosion Sequence

The PR Explosion is the most important moment in Ghost Rival. It must feel like the app stopped everything for this. The sequence is:

### Step 1 — Detection (0ms)
A Set is confirmed. The comparison engine detects a new PR (new best weight, new best reps at equal/higher weight, or new best Volume). Detection happens synchronously on Set confirmation — there is no delay between confirm and explosion.

### Step 2 — Haptic (0ms)
Medium haptic fires on the device at the exact moment of detection. This happens before the visual sequence begins. The user feels it before they see it.

### Step 3 — Screen lock (0ms)
All session input is locked. The user cannot log another Set, end the workout, or navigate away while the PR Explosion is active.

### Step 4 — Shockwave burst (0–800ms)
Three ripple rings expand from the screen center point:
- Ring 1 (0ms): `{colors.ghost-accent}` at 60% opacity, expands to full screen width in 400ms
- Ring 2 (80ms delay): `{colors.pr-burst}` at 80% opacity, same expansion
- Ring 3 (160ms delay): `{colors.pr-burst}` at 40% opacity, same expansion

Simultaneously, cyan and orange particles scatter from the center point. 12–20 particles, randomized trajectory, each fades out over 600ms.

On reduced-motion: all animation replaced by a 200ms full-screen `{colors.pr-burst}` flash at 40% opacity. Particles omitted.

### Step 5 — Background dim (200ms)
`{colors.surface-base}` at 90% opacity fades in over 200ms behind the NEW RECORD card. The session content is now effectively covered.

### Step 6 — Ghost retire (300–700ms)
The old Ghost's benchmark value (displayed in `{colors.ghost-dim}`) floats upward 40dp and fades from 40% opacity to 0% over 400ms. This animation communicates: the old Ghost is gone. It served its purpose and has retired. The Ghost is not deleted — it is archived to Hall of Fame — but its visual presence departs.

### Step 7 — NEW RECORD card appears (700ms)
The card slides up from the bottom of the screen (spring animation, 300ms) and centers:
- "NEW RECORD" — `{typography.display}`, `{colors.ink-primary}`, centered
- New value — `{typography.display}` at 56pt, `{colors.ink-primary}`
- "Previous: [old value]" — `{typography.body}`, `{colors.ghost-accent}` at full opacity (this is the one place ghost data renders at full opacity — the comparison point must be legible at the moment of celebration)
- "Saved to Hall of Fame" — `{typography.body}`, `{colors.ink-secondary}`
- Infinite Goal chip — `{colors.pr-burst}` border, forward target
- "Continue" — ghost button (outline pill, `{colors.ink-primary}`)

### Step 8 — New Ghost materializes (900ms)
Behind the card, the new Ghost value (equal to the just-set PR) fades in from 0% to 40% opacity over 400ms. The new Ghost has been summoned. The user can see it forming behind the "Continue" button — a hint that the cycle has reset.

### Step 9 — Hall of Fame write (background, any time during sequence)
The PR is written to Hall of Fame storage immediately on detection. If offline, it is queued. The "Saved to Hall of Fame" copy is shown regardless of connectivity — it will be there when sync occurs.

### Step 10 — Dismiss
The user taps "Continue" or taps anywhere outside the card. The PR Explosion overlay dismisses (fade out, 200ms). Session input unlocks. The user is returned to exactly where they were in the Session, with the new Ghost data now shown on the exercise panel.

There is no auto-dismiss timer. The PR Explosion waits as long as the user needs.

---

## Floating Bubble & Live Activity

### Android — Floating Bubble

**Permission model:** The Floating Bubble requires the "Draw over other apps" (SYSTEM_ALERT_WINDOW) permission on Android. This is a sensitive permission that requires the user to grant it in system settings (cannot be requested via runtime dialog on Android 10+).

**Permission request flow:**
1. First time the user starts a Session, Ghost Rival shows a contextual explanation screen before the session begins: "Stay in your flow — the Ghost Bubble lets you log sets without leaving Instagram, Spotify, or wherever you are. Tap 'Enable' to go to settings." Two options: "Enable (Recommended)" / "Skip for now".
2. "Enable" opens the Android system settings screen for Draw Over Other Apps for Ghost Rival.
3. If skipped: the session proceeds without a Floating Bubble. A notification-shade fallback is used (read-only rest timer notification).
4. The prompt is shown only once. After that, a small "Enable Ghost Bubble" link appears in Settings → Session.

**Permission denied fallback:** A persistent notification in the notification shade shows: "Session active — [exercise] in progress. [Rest timer countdown or 'Ready to log']." Tapping the notification routes to the Ghost Rival Session screen. The notification does not offer a "log set" action — Android requires Draw Over Other Apps for that level of interaction outside the notification shade.

**Floating Bubble behavior:**
- Appears when the user leaves Ghost Rival during an active Session.
- Disappears when the user returns to Ghost Rival or ends the Session.
- Draggable by the user to any position on screen.
- Persists across app switches, home screen visits, and lock/unlock cycles (it is a system overlay).
- Does not appear on lock screen (OS restriction for system overlays on Android).
- Battery impact: ≤2% additional drain per active session hour (requirement from PRD §9).

**One-tap confirm flow:**
1. Rest timer reaches zero. Bubble pulses with a single radial `{colors.ghost-accent}` ring. Device vibrates (heavy haptic).
2. User taps bubble.
3. Ghost Rival is brought to foreground, Session screen. The next Set entry is pre-filled with the previous Set's weight and reps.
4. A single tap on "Log Set" (or the pre-filled row itself) confirms the Set. The user has performed two taps total.
5. Ghost Rival moves back to background automatically if the user switches away without further interaction.

**Long-press to edit:**
1. User long-presses the Floating Bubble.
2. A minimal edit sheet appears anchored near the Bubble position: weight field + reps field + "Log Set" button.
3. The user changes values and taps "Log Set." Ghost Rival does not come to foreground.
4. The edit sheet dismisses automatically.

### iOS — Live Activity

**Permission model:** Live Activities require the "Live Activities" permission, which is part of the Push Notifications permission group on iOS 16.1+. The first time a session is started, Ghost Rival requests permission using the standard iOS notification permission dialog. The user can grant or deny.

**Permission denied fallback:** No ambient session indicator on iOS when permission is denied. The session continues in the background; the user must manually return to Ghost Rival to log sets. A note in Settings → Session: "Enable Live Activities to see your rest timer from any screen." This links to iOS Settings for Ghost Rival.

**Dynamic Island behavior (iPhone 14 Pro+):**
- Compact: Ghost icon (leading) + rest timer countdown or "Active" label (trailing).
- Minimal: Ghost icon only when another Live Activity competes.
- Expanded (long-press on DI): Full panel with exercise name, Ghost data, rest timer, and "Tap to log next set" prompt.
- Tapping the DI routes to Ghost Rival Session screen. No action can be performed from the DI itself.

**Lock screen behavior (all iPhone models):**
- Live Activity widget shows: exercise name, Ghost data, rest timer countdown.
- Tapping the widget routes to Ghost Rival and triggers Face ID / Touch ID authentication.
- No "log set" action from lock screen — this is an iOS platform constraint, not a UX choice. The lock screen widget is read-only.

**iOS vs Android behavioral delta summary:**

| Behavior | Android (Floating Bubble) | iOS (Live Activity) |
|---|---|---|
| Can log set without opening app | Yes (long-press edit sheet) | No (routes to app, requires auth) |
| Visible on lock screen | No (system overlay restriction) | Yes (Live Activity widget) |
| Shows during other apps | Yes (floating overlay) | Yes (Dynamic Island / notification bar) |
| Disappears when session ends | Yes (immediately) | Yes (immediately) |
| Permission type | SYSTEM_ALERT_WINDOW (system settings) | Notifications permission (runtime dialog) |
| Permission prompt timing | Before first session start | Before first session start |
| Fallback if denied | Notification shade (read-only) | No ambient indicator |
| Battery constraint | ≤2% per active hour | Managed by iOS (no explicit constraint) |

---

## Offline-First Behavior

Ghost Rival is designed to function fully offline. The gym is a notoriously poor connectivity environment (Faraday cage effect of steel frames, basement locations, crowded Wi-Fi). Every core feature works without an internet connection.

### What works fully offline

- Starting, logging, and ending Sessions
- PR detection and PR Explosion
- Viewing Ghost lineup on Home tab
- Hall of Fame browsing
- Ghost Type selection
- All settings changes
- Gym Streak calculation (based on local session timestamps)

### What requires connectivity

- Initial account sign-up (email / Apple / Google)
- Cloud sync of session data to private cloud
- First-time sign-in on a new device

### Sync queue behavior

All writes (new sets, new exercises, ended sessions, new PRs, settings changes) are written to a local sync queue. When the device reconnects to the internet, the queue drains automatically in background. The user does not need to trigger sync manually.

**Sync queue ordering:** Writes are replayed in chronological order. Conflict resolution uses "last write wins" with a timestamp from the local device clock. There is no multi-device conflict scenario in v1 — the app is single-device-primary. If a user signs in on a second device, the cloud state is downloaded and merges with local state using the same last-write-wins rule.

### Offline UI posture

Ghost Rival does not surface an "offline mode" banner, warning overlay, or reduced-functionality state during Sessions. Surfacing offline warnings during an active workout would be disruptive and counterproductive.

The only offline indicator is in **Settings tab → Account → Sync status**: "Syncing…" / "Last synced: [time]" / "Offline — will sync when connected." This is visible only when the user actively navigates to Settings. It is not surfaced on Home, Session, or Hall of Fame tabs.

**PR written offline:** When a PR is detected and saved offline, the Hall of Fame entry is created locally immediately. The "Saved to Hall of Fame" copy on the PR Explosion overlay is accurate — it has been saved locally. It will appear in the cloud-synced Hall of Fame when connectivity is restored. There is no "pending sync" qualifier on the PR Explosion overlay (it would undercut the moment).

---

## Inspiration & Anti-patterns

### Inspiration references

**Strava's segment comparison (positive):** The concept of comparing your current effort against a past recorded effort on the same route shaped the Ghost live-comparison model. The key decision from Strava's design: the comparison reference is always a specific past performance, not an aggregate or average. Ghost Rival adopts this specificity. The design divergence: Strava shows the segment ghost as a live position on a map; Ghost Rival shows it as a set-by-set text delta. Ghost Rival's context (weight room, not running) makes a positional map irrelevant.

**Alto's Odyssey ambient aesthetic (positive):** The "game that doesn't demand anything" register. Alto's Odyssey runs in the background, rewards presence over performance, and celebrates progress without scorekeeping pressure. Ghost Rival's "invisible by design" philosophy is directly informed by this aesthetic: the app should feel like a companion, not a coach.

**Dark Souls "you died" moment as PR inversion (structural):** The PR Explosion is structurally opposite to the Dark Souls death screen — instead of stopping everything to tell the player they failed, Ghost Rival stops everything to tell the player they succeeded. The design principle is the same: interrupt the flow only for the most significant event, make the interruption feel weighty and permanent. The PR Explosion is the "you won" moment, and it earns the interruption.

**Monument Valley restraint (positive):** Extreme constraint on color use — color is meaning, not decoration. Ghost Rival's color policy (orange = PRs only, cyan = Ghost data only) is informed by this restraint.

### Anti-patterns this design explicitly rejects

**MyFitnessPal dashboard clutter:** Dense data tables, multiple competing charts, calorie ring prominences. Ghost Rival has no dashboard. The Home tab is a list of exercises with one number visible per exercise. Density is the enemy.

**Fitbit streak guilt:** Green streak counters, red broken-streak warnings, notification pressure to maintain streaks. Ghost Rival has a Gym Streak widget but it does not turn red, does not send "your streak is at risk" notifications, and does not emphasize the streak as the primary motivation frame. Mercy Days exist to absorb real life without penalizing the user.

**Nike Run Club coach interruptions:** Mid-workout audio coaching, motivational pushes, pace challenges during runs. Ghost Rival never initiates interaction during a Session except the rest timer haptic. No pop-ups, no coaching cards, no nudges during active exercise.

**Apple Fitness+ ring gamification:** Closing rings as primary UX metaphor. Gamification that makes the user feel incomplete when they don't hit a daily goal. Ghost Rival does not have daily goals. The only target is the next Infinite Goal — always achievable at the user's own pace, generated by the algorithm, never externally imposed.

**Whoop subscription upsell posture:** PRO badges, feature gates, "unlock with subscription" friction inside the core loop. Ghost Rival is permanently free with no paywalls.

---

## Responsive & Platform

Ghost Rival is phone-first and phone-only in v1. No tablet layout is specified. The iOS and Android experiences share the same navigation, IA, and component library with the following meaningful platform deltas:

### Platform delta

| UX area | iOS 16.1+ | Android 10+ |
|---|---|---|
| Ambient session surface | Live Activity (Dynamic Island / lock screen) | Floating Bubble (SYSTEM_ALERT_WINDOW overlay) |
| Permission model | Notifications permission (runtime dialog) | Draw Over Other Apps (system settings, manual) |
| Lock screen session info | Yes — read-only Live Activity widget | No — system overlays cannot appear on lock screen |
| Log set without opening app | No — routes to app (requires auth) | Yes — Floating Bubble long-press edit sheet |
| Haptic vocabulary | UIImpactFeedbackGenerator (light / medium / heavy) | VibrationEffect.createOneShot / createWaveform |
| Navigation gesture | Swipe from left edge = system back (not suppressed — no back nav in Session) | Predictive back gesture (Android 13+) intercepted for End Workout confirmation |
| Bottom tab bar clearance | Above home indicator (safe area) | Above navigation bar or gesture bar depending on device |
| PR Explosion animation | Core Animation (CAKeyframeAnimation) | Android Animator / Jetpack Compose animation |
| Font loading | Custom font loaded via iOS font registration | Custom font loaded via Android asset |
| DM Sans availability | Bundled with app | Bundled with app |

### Android predictive back gesture handling

On Android 13+, the predictive back gesture (swipe from screen edge) previews the destination. During an active Session, a back gesture must be intercepted to show the "End Workout?" confirmation modal instead of navigating away silently. React Native's `BackHandler` API handles this. The predictive back preview (the OS-level destination peek) is suppressed during an active Session — the peek would show the Home tab, implying the user can navigate away freely, which is misleading.

### iOS home indicator behavior

The home indicator (bottom swipe bar on modern iPhones) is not hidden during the Session. Hiding the home indicator requires aggressive use of `prefersHomeIndicatorAutoHidden`, which creates a jarring UI that fights with the OS. Instead, the Session screen content is designed with sufficient bottom padding above the safe area so the home indicator does not overlap the Rest Timer Bar or any interactive element.

---

## Key Flows

### Flow 1 — UJ-1: Kenji's first workout (no history, no Ghost yet)

**Protagonist:** Kenji, first launch.

**Preconditions:** App installed. No account. No session history.

1. App launches. Single-screen choice: "Save to cloud (sign in with Apple / Google / email)" or "Stay local (no account)." No feature gating — both paths access identical functionality. Kenji chooses "Stay local."
2. Home tab loads. Empty state: ghost icon at `{colors.ghost-dim}` opacity, headline "No exercises yet.", body copy "Start a workout to create your first exercise. Your ghosts will find you once you've been here before." FAB visible at bottom.
3. Kenji taps FAB. Session full-screen takeover appears. "Add your first exercise" prompt.
4. Kenji taps "Add Exercise." Exercise Creator sheet: text field "Exercise name", toggle "Strength / Cardio". Kenji types "Bench Press", selects Strength. Taps "Add."
5. Bench Press appears in the Session exercise list. Kenji taps the "+" to log the first Set. Set entry: weight field (blank, no pre-fill — no history), reps field. Kenji enters 80kg × 5. Taps "Log Set."
6. Set Row appears: "Set 1 — 80kg × 5". No Ghost comparison delta (no Ghost exists). Rest Timer starts. Rest Timer Bar begins draining.
7. Android: Floating Bubble appears (if permission was granted in step 1 — permission is requested before step 3 for Kenji's first session). iOS: Live Activity appears.
8. Kenji completes the session. Taps "End Workout." Confirmation modal. Confirms.
9. **Climax:** Session Summary screen appears. First-Ghost callout panel: "Your first Bench Press Ghost has been summoned. Come back next time to beat it." No PR badge (no PR is possible on a first session for an exercise with no history). `{colors.surface-overlay}` panel, `{typography.body}`, `{colors.ink-secondary}`.
10. Kenji taps "Done." Home tab loads. Bench Press Ghost Row now shows Ghost data (80kg × 5) in `{colors.ghost-dim}`. Ghost type badge: "TODAY" (or "LAST SESSION" — this is the only Ghost available). The cycle has begun.

**Edge: app force-closed mid-session.** All Sets logged before force-close are saved. On next app open, Draft Resume modal: "Resume your Bench Press session?" Kenji taps "Resume." Session reopens with all logged Sets preserved. Rest Timer resets to default.

---

### Flow 2 — UJ-2: Kenji logs sets while on Instagram

**Protagonist:** Kenji, active session, mid-rest-period.

**Preconditions:** Active session in progress. Bench Press set logged. Rest Timer running (90 seconds). Android device. Floating Bubble granted.

1. Rest timer has ~60 seconds remaining. Kenji switches to Instagram. Floating Bubble appears over Instagram.
2. Bubble shows: Ghost icon + "1:00" countdown in `{typography.mono-data}`.
3. Timer reaches zero. Bubble pulses — single radial `{colors.ghost-accent}` ring animates outward and fades. Device vibrates (heavy haptic). Countdown replaced by "Ready" in `{typography.label}`, `{colors.ghost-accent}`.
4. Kenji taps the Bubble (one tap).
5. Ghost Rival comes to foreground, Session screen. Next Set entry is pre-filled: 80kg × 5 (same as last set). A pre-fill indicator: "Same as last set" in `{colors.ink-disabled}` below the fields.
6. A single tap on "Log Set" (large tap target, full-width) confirms. **Climax: Set logged. Kenji never opened Instagram's menu or typed anything. Two taps total.**
7. Ghost Rival moves to background automatically (system behavior after the foreground action completes — this is OS-managed, not app-initiated).
8. Bubble resets: Ghost icon + new rest timer countdown.

**Variant: Kenji wants to change the weight.** Instead of tapping the Bubble, Kenji long-presses. A minimal edit sheet appears anchored near the Bubble: weight stepper (80kg → 82.5kg), reps stepper (5 → 5), "Log Set" button. Kenji adjusts, taps Log Set. Edit sheet dismisses. Ghost Rival does not come to foreground.

---

### Flow 3 — UJ-3: Kenji breaks his all-time Squat PR

**Protagonist:** Kenji, mid-session.

**Preconditions:** Active session. Squats in progress. Current all-time Ghost: 100kg × 3. Kenji logs Set 4: 102.5kg × 4.

1. Kenji enters 102.5kg × 4 on the Set entry form. Ghost data shown above: "your best ever — 100kg × 3" in `{colors.ghost-dim}`.
2. Kenji taps "Log Set."
3. **Detection (0ms):** 102.5kg > 100kg → new weight PR. 4 reps at heavier weight → also new reps-at-this-weight PR. Volume: 102.5 × 4 = 410kg vs 100 × 3 = 300kg → new Volume PR. All three PR types detected simultaneously. The PR Explosion fires for the highest-value PR (Weight PR, as it is the most significant by display hierarchy).
4. **Haptic (0ms):** Medium haptic.
5. **Shockwave burst (0–800ms):** Three ripple rings from center — `{colors.ghost-accent}` ring 1, `{colors.pr-burst}` rings 2 and 3. Cyan and orange particles scatter.
6. **Ghost retire (300–700ms):** "100kg × 3" floats upward and fades from `{colors.ghost-dim}` to 0% opacity. The old Kenji is gone.
7. **NEW RECORD card (700ms):** Slides up.
   - "NEW RECORD" — `{typography.display}`, `{colors.ink-primary}`
   - "102.5 kg × 4" — `{typography.display}` 56pt, `{colors.ink-primary}`
   - "Previous: 100 kg × 3 — your best ever" — `{typography.body}`, `{colors.ghost-accent}` at full opacity
   - "Saved to Hall of Fame" — `{typography.body}`, `{colors.ink-secondary}`
   - Infinite Goal chip: "Next target: 105 kg" — `{colors.pr-burst}` border
   - "Continue" button — ghost pill
8. **New Ghost materializes (900ms):** "102.5 × 4" fades in at `{colors.ghost-dim}` behind the card.
9. Kenji reads the card. Takes a breath. **Climax: This is his best ever Squat. The app stopped everything for this moment.** He taps "Continue."
10. PR Explosion fades out. Session resumes. Hall of Fame entry is written (locally; synced when connected). The Squat Ghost Row now shows 102.5 × 4 as the new benchmark. Infinite Goal chip persists on the Squat Ghost Row.

---

### Flow 4 — UJ-4: Kenji reviews Ghost lineup before workout

**Protagonist:** Kenji, pre-workout, browsing Home tab.

**Preconditions:** No active session. Home tab showing Ghost lineup. Bench Press currently showing "Last Week" Ghost.

1. Kenji opens Ghost Rival. Home tab. He can see the Ghost lineup: Bench Press (80kg × 5, "you from last week"), Squat (102.5kg × 4, "your best ever"), Deadlift (140kg × 1, "you from 3 weeks ago").
2. Kenji taps the Bench Press Ghost Row.
3. Ghost Type Selector bottom sheet appears:
   ```
   "Choose your Ghost for Bench Press"
   ○ Last Session    (most recent — "80kg × 5, 3 days ago")
   ● Last Week       (current — "80kg × 5, last Tuesday")  [ghost-accent checkmark]
   ○ Last Month      ("75kg × 5, 4 weeks ago")
   ○ All-Time PR     ("82.5kg × 3, 6 months ago")
   ```
4. Kenji taps "All-Time PR." The sheet updates the selection indicator. A brief transition: the Ghost data on the Bench Press row (visible behind the sheet) updates from "80kg × 5" to "82.5kg × 3" in `{colors.ghost-dim}`.
5. Kenji swipes the sheet down. Sheet dismisses.
6. **Climax:** Bench Press Ghost Row now shows: "82.5kg × 3 — your best ever" in `{colors.ghost-dim}`. Ghost type badge updates to "ALL-TIME PR" in `{colors.ghost-accent}`. Kenji closes the app.
7. Next time Kenji opens Ghost Rival, Bench Press still shows the All-Time PR Ghost. Selection persists indefinitely.

**Edge: the user selects a Ghost type for which no data exists.** For example, "Last Month" has no session in the past 30 days. The Ghost Type Selector shows the option but with a footnote: "No session in this range." If selected, the Ghost Row displays the next-available Ghost with a note: "Showing your most recent session instead." The user's selection is respected; the fallback is transparent.

---

## Open Questions (from PRD §11)

**OQ-1 — Cardio Ghost live comparison during Set (PRD §11 item 1):**
The current spec shows target pace as a read-only reference at the top of the Set entry form (not a live GPS pace). This decision is provisional. If GPS integration is added in v2, the Ghost comparison model would shift from "target pace as reference" to "live pace delta vs Ghost pace at this point in the run/ride." The UX pattern would change significantly (live delta updating at 1Hz vs. post-Set summary). This is flagged as a v2 architectural decision — no UX changes required for v1.

**OQ-4 — Mercy Day UX surface (PRD §11 item 4):**
The current spec is: Mercy Day consumption is shown only as a notification when the day is consumed (opted-in), with no persistent UI surface. The Gym Streak widget on the Home tab shows the streak count but does not display remaining Mercy Days. Rationale: surfacing Mercy Day count would increase anxiety around the streak mechanic rather than reducing it. If user research reveals confusion about why the streak didn't break, an explanation can be added to the streak detail view (tap on the Gym Streak widget). This is flagged as a post-launch UX evaluation item.
