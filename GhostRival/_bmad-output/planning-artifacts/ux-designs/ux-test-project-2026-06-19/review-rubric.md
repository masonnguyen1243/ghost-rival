# Spine Pair Review — Ghost Rival

## Overall verdict

Solid pair, ready for architecture and most story-dev. The token system is clean with zero broken cross-references, all 4 UJ flows are present with climax beats, and the inherited vocabulary from the PRD is used consistently. Two missing component specs (Gym Streak widget, Ghost Type Selector) are the highest-priority fixes — both are referenced throughout the spines but never specced. One unresolved design decision (no error/validation color token) will block any form surface implementation.

---

## 1. Flow coverage — strong

Checked: UJ-1 (Kenji first workout), UJ-2 (logging while on Instagram), UJ-3 (Squat PR break), UJ-4 (Ghost lineup review pre-workout).

All 4 UJs present in EXPERIENCE.md Key Flows with named protagonist Kenji, numbered steps, climax beats, and failure paths where applicable. UJ-1 includes draft-recovery edge case. UJ-3 includes silent-device edge case.

### Findings
- **medium** Ghost Type Selector change UJ-4 Step 4 ("Taps Bench Press, switches Ghost type") implies a bottom-sheet interaction that has no spec. A developer implementing UJ-4 has no behavioral contract. (EXPERIENCE.md Key Flows §4). *Fix:* Add `ghost-type-selector` to Component Patterns and Information Architecture.
- **low** UJ-2 "long-press system notification to restore" edge case references a system behavior not specced in the Floating Bubble section. (EXPERIENCE.md Key Flows §2). *Fix:* Note "platform notification system behavior — no app-level spec required" to prevent over-engineering.

---

## 2. Token completeness — strong

Extracted all 10 color tokens from DESIGN.md frontmatter. Extracted all 5 typography scales. Traced all `{colors.*}` and `{typography.*}` references in EXPERIENCE.md Component Patterns, State Patterns, and Accessibility Floor.

Zero broken token references. All 10 color tokens defined with hex values. All 5 typography scales defined with family, weight, and notes.

### Findings
- **high** No error/validation color token exists. `pr-burst` is reserved exclusively for PRs. Exercise Creator, weight/reps input validation, and the duplicate exercise name error (FR-1 consequence) all require an error state color — and there is none. (DESIGN.md Colors, missing; EXPERIENCE.md State Patterns §"Validation error"). *Fix:* Add a `feedback-error` token (e.g., `#ff4444` or `#e53e3e`) in DESIGN.md frontmatter and specify its use scope — form validation only, never for body metrics or motivation.
- **medium** `ghost-accent` contrast on `surface-base` and `surface-raised` is stated as "7.2:1" in EXPERIENCE.md Accessibility Floor but not verified in DESIGN.md Colors. At `#00e5ff` on `#0d0d0f`, computed ratio is approximately 10.3:1; on `#141418` it is approximately 9.6:1 — both pass, so this is not a failure, but the stated value is wrong. (EXPERIENCE.md Accessibility Floor). *Fix:* Correct the stated ratio in the Accessibility Floor section.
- **low** `border-subtle` is used in "Floating Bubble border" in DESIGN.md Components but the Floating Bubble is a separate visual context (Android system window) — `border-subtle` may not apply. Note the ambiguity. (DESIGN.md Components §floating-bubble).

---

## 3. Component coverage — adequate

Extracted 12 component names from DESIGN.md frontmatter list. Verified all 12 have rows in both DESIGN.md Components and EXPERIENCE.md Component Patterns.

Two components referenced in prose and flows that are not in either spine.

### Findings
- **high** `gym-streak-widget` — referenced on Home tab in Information Architecture ("Gym Streak widget") and Key Flows (UJ-1 session summary shows Streak). No visual spec (DESIGN.md) and no behavioral spec (EXPERIENCE.md) exists anywhere. Blocks Home tab story-dev. (EXPERIENCE.md IA surface map, Key Flows §1). *Fix:* Add to DESIGN.md Components and EXPERIENCE.md Component Patterns. Minimum spec: layout position on Home tab, Streak count display type/token, Mercy Day indicator (or deliberate omission), milestone notification trigger.
- **high** `ghost-type-selector` — referenced in Information Architecture surface map and UJ-4. No visual or behavioral spec exists. Blocks UJ-4 story-dev. (EXPERIENCE.md IA §Ghost Type Selector). *Fix:* Add to both spines. Minimum: bottom-sheet trigger, 3 options (Last Week / Last Month / All-Time PR), selection state visual treatment, supplementary Ghost data shown per option.
- **medium** `session-end-confirmation` — listed in IA surface map but absent from Component Patterns. *Fix:* Add a row: "Bottom sheet or modal, 'End Workout?' confirm/cancel, destructive confirm button."
- **medium** `exercise-creator` — listed in IA surface map as "bottom sheet." No visual spec and no validation error state. FR-1 specifies duplicate name rejection with inline error. No inline error component exists. *Fix:* Add to DESIGN.md and EXPERIENCE.md; include validation error state using `feedback-error` token (once added).
- **medium** `draft-resume-prompt` — listed in IA surface map. No component spec. *Fix:* Add: "Modal on cold start. Two CTAs: 'Resume' (primary) and 'Discard' (destructive). Staleness: show session date and exercise count. No 'Save as complete' option (see adversarial finding H-4)."

---

## 4. State coverage — adequate

Walked all 10 surfaces in the IA map. Identified required states per surface (empty, cold-load, offline, permission-denied, error, focus, active).

### Findings
- **medium** Hall of Fame tab: per-exercise view state unspecced. The IA shows Hall of Fame as a flat chronological list, but the only way to find all Squat PRs is to scroll — no filter or exercise grouping exists. If the list grows long, the empty-per-exercise state (new exercise, no PRs yet) is not handled. (EXPERIENCE.md IA §Hall of Fame). *Fix:* Spec a "no PRs for this exercise yet" state or clarify the list is global (no per-exercise filter in MVP).
- **medium** Settings tab: account deletion confirmation state unspecced. PRD §11 OQ-5 deferred to architecture, but the UX of the deletion confirmation (destructive action, data warning) needs a state spec. *Fix:* Add to State Patterns: "Account deletion → confirmation modal with data warning in `ink-primary`, destructive confirm in `feedback-error`."
- **medium** Session screen: "no exercises added yet" state (session started, zero exercises) not in State Patterns. What does the session screen show before the first exercise is added? *Fix:* Add empty session state: instruction copy + "Add Exercise" CTA prominent.
- **low** Home tab: "session active in background" state (user has left an active session and returned to Home) not specced. Does the FAB change to "Resume Session"? Does a banner appear? *Fix:* Add state: "FAB replaced by 'Resume Session' button in `ghost-accent`; no tab bar navigation away from Home during this state."
- **low** Ghost Type Selector sheet: "only 1 session ever" state — all 3 Ghost types would show the same data. No dedup or collapse behavior specified.
- **low** Floating Bubble / Live Activity: "session paused for > 8 hours" end state not surfaced in UI. Live Activity ends (per PRD FR-9 assumption) but the Bubble state on Android is unspecified.

---

## 5. Visual reference coverage — adequate

Files in `.working/`: `color-themes.html`, `typography-directions.html`. No `mockups/` or `wireframes/` directory exists yet (pending key-screen mock step in Finalize).

Spines note "→ mockup pending" appropriately where applicable.

### Findings
- **low** DESIGN.md and EXPERIENCE.md do not inline-link to the `.working/` creative artifacts. At Finalize, keepers should be promoted to `mockups/` with relative links at relevant spine sections. (Pending Finalize key-screen step).
- **low** Color themes and typography direction files in `.working/` are decision artifacts, not mockups — they can be archived post-finalize but are not mockup references.

---

## 6. Bloat & overspecification — strong

DESIGN.md prose carries editorial voice without restating PRD content. EXPERIENCE.md uses tables throughout component and state sections. No pixel specs outside of spacing tokens. No persona restatement. Key Flows are concise with climax beats, not narrative retelling of the PRD.

### Findings
- **low** EXPERIENCE.md Ghost Comparison Patterns §Cardio re-states PRD §4.4 FR-11 ASSUMPTION almost verbatim ("target pace shown during Set; delta shown post-Set"). The spine should own the decision, not reference the PRD assumption. *Fix:* State as a committed decision, not an inherited assumption.
- **low** EXPERIENCE.md Offline-First §Sync queue ordering contains implementation detail ("queue processes in FIFO order") that belongs in architecture, not the UX spine. *Fix:* Remove the FIFO note; replace with "Sync processes queued items in background with no user-visible ordering."

---

## 7. Inheritance discipline — strong

PRD glossary terms used verbatim throughout: Ghost, PR, PR Explosion, Hall of Fame, Infinite Goal Engine, Floating Bubble, Live Activity, Session, Set, Exercise, Gym Streak, Mercy Day. No synonyms introduced.

UJ names (UJ-1 through UJ-4) referenced correctly. Protagonist name (Kenji) consistent.

### Findings
- **medium** EXPERIENCE.md Component Patterns uses "Ghost Row" but DESIGN.md Components uses "ghost-row" (kebab-case). In prose, DESIGN.md uses "Ghost Row" (title case). The mismatch between the frontmatter component list (kebab-case) and prose references (title case) is not an error, but the convention should be stated once. *Fix:* Add a note in DESIGN.md frontmatter: "Component names in prose use Title Case; frontmatter list uses kebab-case identifiers."
- **medium** "PR badge" appears as "pr-badge" in DESIGN.md frontmatter, "PR Badge" in DESIGN.md Components prose, and "PR Badge" in EXPERIENCE.md Component Patterns — consistent in prose, consistent in frontmatter. No issue, but the frontmatter vs. prose convention note above would cover this.
- **low** EXPERIENCE.md PR Explosion Sequence uses "dismiss" and "Continue" interchangeably for the same action. Pick one and use it throughout.
- **low** "Set Row" in EXPERIENCE.md vs "set-row" in DESIGN.md frontmatter — same convention note as Ghost Row.

---

## 8. Shape fit — strong

DESIGN.md sections are in canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. All present, none dropped without reason.

EXPERIENCE.md: Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows all present. Invented sections (Session Lifecycle, Ghost Comparison Patterns, PR Explosion Sequence, Floating Bubble & Live Activity, Offline-First) earn their place. Inspiration & Anti-patterns and Responsive & Platform present and triggered correctly (dual-surface, reference products cited in decision log).

### Findings
- **low** EXPERIENCE.md Interaction Primitives includes the note "Banned: drag-and-drop to reorder exercises within session." No reordering feature is in scope or implied — this ban is speccing a non-existent concern. *Fix:* Remove.
- **low** DESIGN.md Do's and Don'ts table has 10 rows. Row 8 ("Do: DM Sans at 800 weight for any displayed number / Don't: mix weight scales within a single component") is a typography rule, not a Do/Don't design decision — it belongs in Typography. *Fix:* Move to Typography section; replace with a visual identity Do/Don't.

---

## Mechanical notes

- EXPERIENCE.md sources frontmatter references `{planning_artifacts}/prds/...` — not resolved to an absolute path. Acceptable for a spine (source tracking, not file dependency), but note for downstream consumers.
- DESIGN.md frontmatter `components` is a list of kebab-case slugs, which is correct per spec conventions.
- No Mermaid diagrams present — not required.
- Both files' `status` fields currently read `final` (per the system modification noted). Correct.
