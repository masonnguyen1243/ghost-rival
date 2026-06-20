---
title: DESIGN — Ghost Rival
status: final
created: 2026-06-19
updated: 2026-06-19T00:00:00+07:00
project: Ghost Rival
platform: mobile (iOS + Android, React Native)

colors:
  surface-base: '#0d0d0f'
  surface-raised: '#141418'
  surface-overlay: '#1a1a22'
  ink-primary: '#ffffff'
  ink-secondary: '#8888a0'
  ink-disabled: '#3a3a50'
  ghost-accent: '#00e5ff'
  ghost-dim: 'rgba(0,229,255,0.40)'
  pr-burst: '#ff6b00'
  border-subtle: '#1e1e28'
  feedback-error: '#ff4444'

typography:
  display:
    family: 'DM Sans'
    weight: 800
    tracking: '-0.02em'
    note: 'Large numbers — weight lifted, rep counts, timers'
  heading:
    family: 'DM Sans'
    weight: 700
    tracking: '-0.01em'
    note: 'Exercise names, screen titles, section headers'
  label:
    family: 'DM Sans'
    weight: 500
    tracking: '+0.05em'
    transform: 'uppercase'
    note: 'Section labels, ghost type badges, tab labels'
  body:
    family: 'DM Sans'
    weight: 400
    note: 'Descriptions, ghost copy, microcopy, empty states'
  mono-data:
    family: 'DM Sans'
    weight: 600
    note: 'Sets logged in sequence, rest timer countdown'

rounded:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  pill: '999px'

spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '24px'
  '6': '32px'
  '7': '48px'
  '8': '64px'

components:
  - ghost-row
  - set-row
  - pr-badge
  - pr-explosion-overlay
  - floating-bubble
  - live-activity
  - session-summary-card
  - hall-of-fame-entry
  - tab-bar
  - empty-state
  - rest-timer-bar
  - infinite-goal-chip
  - gym-streak-widget
  - ghost-type-selector
  - session-end-confirmation
  - exercise-creator
  - draft-resume-prompt
  - undo-toast
  - hof-slide-in-panel
---

## Brand & Style

Ghost Rival is a game, not a health app. The visual language is dark, intense, and quiet — not in the sense of being dull, but in the sense of a fighter waiting at the top of the stairs. Everything on screen either earns its place or gets cut.

The central metaphor is the Ghost: a spectral version of the user's past self, rendered in translucent electric cyan, present on every exercise card but never shouting. The Ghost is always there, slightly faded, a little haunted — and then something happens, and the whole screen erupts.

This split personality is the design system's defining tension. Ninety-five percent of the time, Ghost Rival is invisible: near-black backgrounds, muted secondary type, information delivered without ceremony. The remaining five percent — when a PR is detected — the system drops all restraint. Color floods in. The shockwave fires. The Ghost retires. It has to feel earned because the rest of the app has been so restrained.

**Visual identity pillars:**

- **Dark-first, always.** There is no light mode. The surface palette is near-black graduating through three levels (base → raised → overlay). This is not a dark mode toggle; it is the product's identity.
- **Ghost as presence, not label.** Ghost data is rendered at ~30% opacity in electric cyan (`ghost-dim`). It sits behind current-session data visually and semantically. The ghost does not demand attention; it waits.
- **Current data is white and dominant.** The user's own lifts — the thing they are doing right now — are always rendered in `ink-primary` white at full opacity. There is no ambiguity about which number belongs to them.
- **Orange is reserved for one thing: PRs.** `pr-burst` orange appears only on PR badges, the PR Explosion shockwave core, and the Infinite Goal chip. It never decorates navigation, status, or any element that is not about a new record. This exclusivity is what makes the PR moment land.
- **Cyan is reserved for one thing: Ghost data.** `ghost-accent` and `ghost-dim` never appear on interactive controls, informational badges, or any UI that is not referencing a historical benchmark. Seeing cyan means: "this is your past self."
- **No borders for decoration.** The single border token (`border-subtle`) is used only for structural separation — card edges in stacked contexts, sheet dividers. It is not used for emphasis or visual interest.
- **Typography does the heavy lifting.** DM Sans at extreme weights (800 for display numbers, 700 for headings) creates hierarchy without requiring color differentiation. Weight contrast is the primary visual rhythm.
- **Motion is narrative, not decoration.** Every animation tells part of the story: the Ghost fading in, the shockwave ripple, the old Ghost visibly retiring before the new one appears. No motion is present purely for aesthetic delight.

The emotional register is quiet confidence punctuated by genuine celebration. Not a fitness app that screams at you. Not a tracker that makes you feel bad about missing a day. A dark, focused companion that erupts exactly once per PR — and then gets out of the way.

---

## Colors

### Surface Scale

The three surface levels create spatial depth without shadows. Elevation is expressed by surface color, not drop-shadow.

| Token | Hex | Use |
|---|---|---|
| `surface-base` | `#0d0d0f` | Screen backgrounds, full-bleed areas. The darkest level. |
| `surface-raised` | `#141418` | Cards, panels, exercise rows, any floating content one level above the screen. |
| `surface-overlay` | `#1a1a22` | Modal sheets, bottom drawers, confirmation dialogs. Appears above `surface-raised`. |

The step between levels is intentionally small — approximately 7–8% luminance increase per level. This keeps the palette unified and avoids the "dark mode gray soup" problem where surfaces compete.

### Ink Scale

| Token | Hex | Use |
|---|---|---|
| `ink-primary` | `#ffffff` | Current-session data, exercise names, primary labels, all interactive CTA text. Full opacity white only. |
| `ink-secondary` | `#8888a0` | Secondary metadata, timestamps, supporting copy, units (kg/lb). |
| `ink-disabled` | `#3a3a50` | Disabled controls, placeholder text, fields not yet interactive. |

Never use `ink-secondary` for data the user is actively entering. The distinction between `ink-primary` (yours, now) and `ghost-dim` (theirs, past) must be immediate.

### Ghost Palette

| Token | Value | Use |
|---|---|---|
| `ghost-accent` | `#00e5ff` | Ghost type badges, "Ghost active" indicators, the dot on the ghost row that shows a Ghost is loaded. Used sparingly, at full opacity only in micro-indicators. |
| `ghost-dim` | `rgba(0,229,255,0.40)` | Ghost data text — the weight and reps the user is trying to beat. 40% opacity renders it as a clear but subordinate presence against current-session data. |

The 40% opacity value was chosen for gym-environment legibility. At 30%, ghost data loses perceptible contrast under fluorescent overhead lighting — the product's primary use environment. At 40%, ghost data remains visually subordinate to `ink-primary` white data on `surface-raised` while staying legible when the user glances at the screen mid-set. **Implementation note:** Test this value on-device in actual gym lighting before shipping; indoor light temperature and screen brightness settings affect perceived contrast more than lab ratios suggest.

### Signal Color

| Token | Hex | Use |
|---|---|---|
| `pr-burst` | `#ff6b00` | PR badges, PR Explosion shockwave core, Infinite Goal chip border. Exclusively PR-related. Never used for warnings, errors, or navigation states. |

There is no green, no red, no yellow in this palette. Ghost Rival does not use red/green for body metric judgments (weight loss/gain is not a concept in this app). The absence of a "bad" color is intentional.

### Form Feedback

| Token | Hex | Use |
|---|---|---|
| `feedback-error` | `#ff4444` | Inline form validation errors only — duplicate exercise name, invalid weight/reps input. Never used for body metrics, motivation, streaks, or any element outside a form input context. `pr-burst` orange is reserved for PRs; `feedback-error` red is reserved for form failures. |

**No Bright Environment Mode in v1.** Ghost Rival's dark identity is preserved. The primary mitigation for gym lighting is the `ghost-dim` 40% opacity (see above) and proper on-device testing. A Bright Environment Mode (raising surface levels ~30% luminance) is a v1.1 candidate if field testing reveals legibility problems that opacity alone cannot solve.

### Structural

| Token | Value | Use |
|---|---|---|
| `border-subtle` | `#1e1e28` | Card dividers in stacked lists, sheet separators. Not used for emphasis. |

---

## Typography

All text is set in DM Sans. There is no platform-native fallback. DM Sans is loaded as a custom font on both iOS and Android.

### Scale

| Scale | Weight | Size (suggested) | Tracking | Transform | Use |
|---|---|---|---|---|---|
| `display` | 800 | 40–64sp/pt | -0.02em | none | Large stat numbers: weight on Set rows, rep counts, rest-timer countdown, PR detected weight |
| `heading` | 700 | 20–24sp/pt | -0.01em | none | Exercise names on Ghost rows and session; screen titles; session summary headline |
| `label` | 500 | 11–12sp/pt | +0.05em | UPPERCASE | Section headers, ghost type badges (LAST WEEK / ALL-TIME PR), tab labels on active tab |
| `body` | 400 | 14–16sp/pt | 0 | none | Ghost copy (self-narrative sentences), empty state prose, settings descriptions |
| `mono-data` | 600 | 16–18sp/pt | 0 | none | Set number in sequence ("Set 3"), incremental counters, rest timer seconds |

### Usage rules

- **Never mix weights within a single data pair.** The weight the user lifted and the Ghost's weight are always the same scale (both `display`) but differ by opacity/color. Mixing weights implies hierarchy; here, the difference is color alone.
- **`display` is for numbers only.** Do not use `display` weight on prose copy. It reads as shouting.
- **`label` is always uppercase.** This is a hard rule. Mixed-case label text breaks the visual badge register.
- **`body` for all Ghost copy.** Ghost self-narrative sentences ("you from last week", "the you that peaked in March") are always `body` weight 400. They should feel like a whisper.
- **`mono-data` for countable sequence.** When displaying "Set 1 of 3" or a running count, use `mono-data`. The 600 weight distinguishes sequential data from static labels without reaching for `heading`.

---

## Layout & Spacing

### Grid

Single-column layout throughout. No multi-column grids except Hall of Fame on tablet (→ mockup pending).

- **Horizontal gutters:** 16px (`spacing.4`) from screen edge on all list content. 24px (`spacing.5`) for modal sheet content.
- **Safe area:** All tap targets respect OS safe area insets. Bottom tab bar sits above home indicator on iPhone; above navigation bar on Android.

### Spacing rhythm

The spacing scale is 4px-based. Common values in context:

| Context | Token | Value |
|---|---|---|
| Between list items (Ghost rows, Set rows, Hall of Fame entries) | `spacing.2` | 8px |
| Internal card padding (horizontal) | `spacing.4` | 16px |
| Internal card padding (vertical) | `spacing.3` | 12px |
| Section gap (between exercise blocks in session) | `spacing.5` | 24px |
| Screen-level vertical rhythm (top of content below nav) | `spacing.4` | 16px |
| PR Explosion overlay internal padding | `spacing.6` | 32px |
| Empty state vertical centering offset | `spacing.7` | 48px |

### Touch targets

Minimum 44×44pt/dp on all interactive elements. Ghost rows are full-width tap targets (no inline tap zones competing within the row).

---

## Elevation & Depth

Ghost Rival uses surface color to express depth, not drop shadows. There are three elevation levels:

| Level | Surface token | Used for |
|---|---|---|
| 0 — Ground | `surface-base` | Screen background |
| 1 — Raised | `surface-raised` | Cards, rows, exercise panels |
| 2 — Overlay | `surface-overlay` | Bottom sheets, modals, confirmation dialogs |

Drop shadows are used in exactly two places:
1. **Floating Bubble (Android):** A soft dark shadow behind the circular overlay so it lifts off any background content.
2. **PR Explosion overlay:** No shadow — it is full-bleed, so depth is irrelevant.

No card in the list UI has a drop shadow. The contrast between `surface-base` and `surface-raised` is sufficient to read the card as raised.

---

## Shapes

Corner radii follow a strict purpose hierarchy. Mixing radii within a context is not permitted.

| Token | Value | Use |
|---|---|---|
| `rounded.xs` | 4px | PR badge pill on Hall of Fame entries; inline micro-tags |
| `rounded.sm` | 8px | Set row inner counter chip; rest-timer progress capsule |
| `rounded.md` | 12px | Ghost rows; session summary card; Hall of Fame card |
| `rounded.lg` | 16px | Bottom sheet top corners; session end confirmation modal |
| `rounded.xl` | 24px | Floating Bubble container (Android) |
| `rounded.pill` | 999px | Infinite Goal chip; tab bar active indicator; FAB (Start Workout) |

The FAB (Start Workout button) is always `rounded.pill`. It is the most inviting element on the home screen and the only interactive element on a screen that is otherwise read-only.

The PR Explosion overlay is full-bleed with 0 corner radius. It occupies the entire screen to signal that the normal frame of the app has been suspended.

---

## Components

### Ghost Row (Home screen exercise card)

The primary card on the Home tab. One row per exercise the user has logged at least once.

**Structure:**
```
[surface-raised, rounded.md, padding: spacing.3 × spacing.4]
  Left column:
    Exercise name             heading, ink-primary
    Ghost self-narrative      body, ink-secondary  (e.g. "you from last week")
  Right column:
    Ghost data (weight × reps)  display, ghost-dim  (cyan 30%)
    Current PR badge         [pr-badge component if all-time loaded]
  Trailing edge:
    Ghost type badge         label, ghost-accent   (LAST WEEK / ALL-TIME PR / LAST MONTH)
```

**States:**
- **No Ghost yet (first session):** Ghost data slot shows `body` text in `ink-disabled`: "No ghost yet — come back after your first session." No badge.
- **Ghost loaded:** Full layout as above.
- **Active in session:** Ghost row transforms into a Set entry surface (see Set Row). The same exercise's Ghost data is pinned at the top of the set-logging panel as a reference.

**Interaction:** Tap opens a Ghost type selector sheet (Last Week / Last Month / All-Time PR). Selection persists. No edit affordance for the exercise name itself from this row (editing is in Settings → Exercise Management → → mockup pending).

---

### Set Row (Active session)

Displayed inside the Session full-screen takeover, one row per logged set.

**Structure:**
```
[surface-raised, rounded.sm, padding: spacing.2 × spacing.4]
  Left:
    Set number             mono-data, ink-secondary   ("Set 3")
  Center:
    Weight                 display, ink-primary
    × Reps                 display, ink-primary
  Right:
    Ghost comparison delta  body, ghost-dim           ("vs 80kg × 5 last week")
    PR badge               [pr-badge, visible if set beats Ghost]
```

**Ghost comparison delta:** Never shown as a raw number difference. Shown as a contextual sentence using `ghost-dim` color. Example: "matches your ghost" / "2 reps ahead" / "2.5kg heavier". See EXPERIENCE.md Ghost Comparison Patterns for copy rules.

**Empty (pre-entry):** The weight and reps fields show placeholder values in `ink-disabled`. Weight pre-fills from the last set of the same exercise in any previous session.

---

### PR Badge

A small inline badge appearing on Ghost Rows (home) and Set Rows (session) when a PR has been detected or is currently held.

```
[rounded.xs, border: 1px solid pr-burst, background: transparent]
  Text:  "PR"  label, pr-burst, uppercase
```

The PR badge is outline-only (no fill) in list contexts. The filled orange is reserved for the PR Explosion. Using a filled badge in-list would desensitize the user to the PR color.

---

### PR Explosion Overlay

Full-screen takeover. Fires when a PR is detected during a Set confirmation.

**Layer stack (bottom to top):**
1. **Shockwave layer (full-bleed):** Animated ripple rings expanding from screen center. First ring: `ghost-accent` at 60% opacity. Second ring: `pr-burst` at 80% opacity. Third ring: `pr-burst` at 40% opacity. Rings fire in 80ms staggered sequence. Cyan + orange particles scatter from center point.
2. **Background dim:** `surface-base` at 90% opacity over the session content.
3. **Ghost retire animation:** The old Ghost number (cyan) floats upward and fades out over 400ms.
4. **NEW RECORD card (centered, surface-overlay, rounded.lg, padding: spacing.6):**
   - "NEW RECORD" — display, ink-primary, centered
   - New weight × reps — display, ink-primary, large (56sp/pt)
   - "Previous: [old value]" — body, ghost-accent (full opacity — legibility is critical on this card; ghost-dim is too faint for comparative data in the PR Explosion context)
   - "Saved to Hall of Fame" — body, ink-secondary
   - Infinite Goal chip — [see Infinite Goal Chip component]
   - Dismiss button — "Continue" — label, ink-primary, pill shape, no fill (ghost button style)
5. **New Ghost materialize animation:** After the retire animation, the new Ghost value fades in from 0% to 30% opacity (ghost-dim). The Ghost has been updated.

**Dismiss:** Tap anywhere outside the card, or tap "Continue". No auto-dismiss timer. The user controls when the moment ends.

---

### Floating Bubble (Android)

A persistent circular system overlay that appears when the user leaves Ghost Rival during an active session.

```
[rounded.xl = 24px, diameter: 56dp]
  Background:  surface-overlay
  Border:      1.5px solid ghost-accent
  Drop shadow: 0 4px 16px rgba(0,0,0,0.6)
  Center icon: Ghost icon (custom SVG) in ghost-accent
  Sub-label:   Rest timer countdown in mono-data, ink-primary (when timer active)
               "Active" in label, ink-secondary (when no timer)
```

**Expanded state (timer at zero):** The bubble pulses — the `ghost-accent` border animates a single radial pulse outward — and the device vibrates. Pulse does not loop; it fires once per timer expiry.

**Tap behavior:** One tap opens Ghost Rival directly to the Set entry pre-filled with the last set's values.

**Long-press behavior:** Opens a minimal edit sheet to change weight/reps before confirming.

→ mockup pending: collapsed vs expanded bubble states

---

### Live Activity (iOS)

Displayed in the Dynamic Island (iPhone 14 Pro+) or as a lock screen widget (iPhone 14 and below, and lock screen during session).

**Compact (Dynamic Island):**
```
  Leading:  Ghost icon (ghost-accent, 14pt)
  Trailing: Rest timer countdown or "Active" label (mono-data, ink-primary, 13pt)
```

**Expanded (lock screen / Dynamic Island expanded):**
```
  Left column:
    Exercise name    heading, ink-primary (truncated to 1 line)
    Ghost data       body, ghost-dim
  Right column:
    Rest timer       display, ink-primary (56pt when active, 0 when inactive)
  Bottom row:
    "Tap to log next set" — body, ink-secondary
```

**No tap-to-confirm on lock screen.** iOS requires biometric/passcode authentication to perform actions from lock screen widgets. The Live Activity is read-only on lock screen; it links to the app on tap (which triggers Face ID/Touch ID). This is an intentional platform constraint, not a UX failure.

---

### Session Summary Card

Shown on the Session End screen after the user confirms "End Workout".

```
[surface-raised, rounded.md, padding: spacing.5]
  Header:
    "Session Complete" — heading, ink-primary
    Date + duration  — body, ink-secondary
  Exercise blocks (one per exercise logged):
    Exercise name    — heading, ink-primary
    Sets logged      — body, ink-secondary  ("4 sets")
    Volume total     — mono-data, ink-primary  ("1,200 kg total")
    Ghost comparison — body, ghost-dim  ("vs your ghost: 1,100 kg")
    PR badge         — [pr-badge] if any PR was set
  First-Ghost callout (if first session on any exercise):
    Full-width panel in surface-overlay:
    "Your first [Exercise] Ghost has been summoned. Come back next time to beat it."
    — body, ink-secondary
```

No share button. No export prompt. No rating prompt. The session summary is read-only content.

---

### Hall of Fame Entry Row

One row per PR in the Hall of Fame tab. Entries are chronological, newest first.

```
[surface-raised, rounded.md, padding: spacing.3 × spacing.4]
  Left:
    Exercise name   — heading, ink-primary
    Date achieved   — body, ink-secondary
  Center:
    Record value    — display, ink-primary  (e.g. "102.5 kg × 4")
  Right:
    PR badge        — [pr-badge, pr-burst fill for Hall of Fame context — here fill is permitted]
    PR type label   — label, ink-secondary  ("VOLUME" / "WEIGHT" / "REPS")
```

Note: In the Hall of Fame, the PR badge is filled (background: pr-burst) rather than outline-only. This is the one context where the filled orange is used in a list, because Hall of Fame entries are inherently celebratory and permanent. The desensitization risk is lower here since the user is already in a retrospective frame.

---

### Tab Bar

Three tabs, icon-only when inactive, icon + label when active.

```
[background: surface-raised, top border: border-subtle 1px]
  Tab 1 — Home        icon: ghost silhouette SVG
  Tab 2 — Hall of Fame  icon: trophy SVG
  Tab 3 — Settings    icon: sliders SVG
  Active state: icon in ink-primary, label in label typography, ink-primary color
  Inactive state: icon in ink-disabled, no label
```

No badge indicators on tabs. No unread counts. No notification dots. The tab bar is purely navigational.

The Session full-screen takeover hides the tab bar entirely. There is no way to navigate away from a Session without explicitly choosing "End Workout" or force-closing the app.

---

### Empty States

Empty states appear when a surface has no content yet. Ghost Rival empty states use encouragement, never pressure.

**Common structure:**
```
[centered vertically with spacing.7 offset from top]
  Illustration: Simple ghost icon (ghost-accent, 40–48pt, 40% opacity) — → mockup pending
  Headline:     heading, ink-primary  (direct, one line)
  Body copy:    body, ink-secondary  (2–3 lines max, warm, no urgency)
  CTA (optional): pill button, ghost-accent border, ink-primary text
```

**Empty state copy by surface:**

| Surface | Headline | Body copy |
|---|---|---|
| Home (no exercises) | "No exercises yet." | "Start a workout to create your first exercise. Your ghosts will find you once you've been here before." |
| Home (exercises exist, no Ghost) | "Your ghost is forming." | "Come back after your next session and you'll have a ghost to chase." |
| Hall of Fame (no PRs) | "No records yet." | "Every rep you do becomes history. Break a PR and it lives here forever." |
| Session (no sets logged) | "Log your first set." | "Tap the exercise to get started." |

---

### Rest Timer Bar

A thin progress bar pinned to the bottom of the Session screen (above the tab bar position, but the tab bar is hidden during sessions).

```
[height: 3px, full-width]
  Background:     border-subtle
  Filled portion: ghost-accent  (drains left-to-right as time elapses)
  At zero:        switches to pr-burst for one 600ms flash, then resets
```

No numeric countdown on the bar itself — the countdown is in the Floating Bubble / Live Activity. In-app, a separate numeric display shows the remaining time in `mono-data, ink-primary` above the bar.

---

### Infinite Goal Chip

Displayed on the PR Explosion overlay after a PR is confirmed, and on the Ghost Row as a persistent target once set.

```
[rounded.pill, border: 1.5px solid pr-burst, background: transparent, padding: spacing.2 × spacing.4]
  Leading icon: arrow-up SVG in pr-burst
  Text: "Next target: [value]" — label, pr-burst
```

The Infinite Goal chip is dismissible on the PR Explosion overlay. On the Ghost Row, it persists until the target is beaten (at which point it updates to the next goal). It never uses `ghost-accent`; it is strictly a forward-looking PR-colored element.

---

### Gym Streak Widget (Home screen)

Displayed at the top of the Home tab, above the Ghost Row list.

```
[surface-raised, rounded.md, padding: spacing.3 × spacing.4, full-width]
  Left:
    Streak count       display, ink-primary  (e.g. "7")
    Label              label, ink-secondary  ("WEEK STREAK")
  Right:
    Mercy Days remaining  body, ink-secondary  ("2 mercy days left")  — hidden if full (2/2)
```

No milestone animation on the widget itself — milestone celebrations are handled via push notification only. The widget is purely informational.

---

### Ghost Type Selector (Bottom sheet)

Opens when the user taps any Ghost Row on the Home tab. Allows switching the active Ghost benchmark for that exercise.

```
[surface-overlay, rounded.lg top corners, drag handle at top center]
  Header:
    Exercise name     heading, ink-primary
    "Choose your ghost"  body, ink-secondary
  Option rows (3):
    [rounded.md, surface-raised, padding: spacing.3 × spacing.4]
    Left:
      Ghost type label  label, ink-primary  ("LAST WEEK" / "LAST MONTH" / "ALL-TIME PR")
      Ghost data value  body, ghost-dim  (e.g. "80 kg × 5 — last Tuesday")
    Right:
      Selection checkmark: ghost-accent SVG icon (visible on selected item only)
```

Selected item has a `ghost-accent` left border (2px). Unselected items have no left border.
If a Ghost type has no data (e.g., no session in the past 7 days), the value line shows `body, ink-disabled`: "No data — try another ghost type."

---

### Session End Confirmation (Modal)

Triggered by tapping "End Workout" during an active session.

```
[surface-overlay, rounded.lg, centered, padding: spacing.5]
  Heading:    "End this session?"  — heading, ink-primary
  Body:       "[N] sets logged · [duration]"  — body, ink-secondary
  CTAs (stacked):
    Primary:   "End Workout"  — pill, background: pr-burst, text: ink-primary
    Secondary: "Keep going"   — pill, border: border-subtle, text: ink-secondary
```

The destructive action ("End Workout") is in `pr-burst` — the only place outside PR moments where orange fills a button, because ending a workout is a significant intentional act. This is not a mistake; it is deliberate weight.

---

### Exercise Creator (Bottom sheet)

Opens during an active session via "Add Exercise" CTA.

```
[surface-overlay, rounded.lg top corners]
  Text input:
    Placeholder: "Exercise name"  — body, ink-disabled
    Active:      body, ink-primary
    Error:       body, feedback-error + 1px border feedback-error below input
    Error copy:  "Already have an exercise with this name."  — body, feedback-error
  Type selector (two pill buttons):
    "Strength"  [selected: pr-burst border, ink-primary text]
    "Cardio"    [unselected: border-subtle border, ink-secondary text]
  CTA:
    "Add"  — pill, ghost-accent border, ink-primary text (enabled only when name ≥ 1 char and no error)
```

---

### Draft Resume Prompt (Modal)

Appears on cold start if an auto-saved session draft exists.

```
[surface-overlay, rounded.lg, centered, padding: spacing.5]
  Heading:   "Unfinished session"  — heading, ink-primary
  Body:      "[Exercise list summary] · saved [time ago]"  — body, ink-secondary
  CTAs:
    Primary (draft < 2h old):    "Resume"        — pill, ghost-accent border, ink-primary
    Primary (draft ≥ 2h old):    "Save as Complete"  — pill, ghost-accent border, ink-primary
    Secondary:                   "Discard"       — body, ink-secondary, no border (low visual weight)
```

"Save as Complete" becomes the primary CTA when the draft is older than 2 hours, because returning to an old session is less common than closing it out.

---

### Undo Toast

Appears above the Rest Timer Bar when a Set Row is deleted within the 30-second edit window.

```
[surface-overlay, rounded.md, padding: spacing.2 × spacing.4, margin: spacing.3 from Rest Timer Bar]
  Left:   "Set deleted"  — body, ink-secondary
  Right:  "Undo"         — body, ghost-accent (tappable)
```

Auto-dismisses after 4 seconds (or 8 seconds when VoiceOver/TalkBack is active). If the Rest Timer Bar is completing simultaneously, the toast appears above it with `spacing.3` gap.

---

### Hall of Fame Slide-In Panel (Session)

Accessible from within an active Session via a "History" icon button in the session header. Read-only reference — the user can look up past lifts without ending the session.

```
[surface-overlay, slides in from bottom, height: 60% of screen, rounded.lg top corners]
  Handle bar at top
  Header:
    "Your history"  — heading, ink-primary
    Close icon      — ink-secondary
  Content:
    Exercise filter tabs (horizontal scroll): [All] [Exercise names...]
    Hall of Fame Entry Rows (read-only, same as Hall of Fame tab)
```

No actions available from within this panel — no Ghost type changes, no editing. It is a reference surface only. The session remains active and the Rest Timer continues while the panel is open.

---

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `ghost-dim` (cyan 40%) for all Ghost benchmark data in rows | Use `ghost-accent` full opacity for Ghost data text in list rows — full opacity is reserved for PR Explosion card only |
| Use `pr-burst` exclusively for PR-related elements | Use orange for warnings, errors, or any non-PR status |
| Use `ink-primary` white for everything the user is actively doing | Dim the user's current data to create contrast with Ghost |
| Let `surface-base` show through as the default background | Add texture, gradients, or imagery to background surfaces |
| Use `display` weight only for numbers | Use 800-weight DM Sans on prose or labels |
| Keep the PR Explosion full-bleed and corner-radius 0 | Round the PR Explosion overlay (it is not a card) |
| Use `rounded.pill` exclusively for the FAB and goal chip | Apply pill corners to cards or list rows |
| Show Ghost type badge in `label` uppercase | Write Ghost types in sentence case |
| Use empty-state copy that is warm and patient | Write empty states with urgency, streaks pressure, or guilt |
| Reserve tab badge dots for zero functional use | Add notification badges, unread counts, or nudges to tabs |
| Fill PR badge (orange) only in Hall of Fame entries | Use filled orange PR badges in active session list rows |
| Name Ghost in self-narrative terms | Use data-label language like "Last Week Ghost" in copy |
