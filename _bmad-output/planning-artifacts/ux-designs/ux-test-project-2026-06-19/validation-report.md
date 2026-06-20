# Validation Report — Ghost Rival

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-test-project-2026-06-19/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-test-project-2026-06-19/EXPERIENCE.md`
- **Run at:** 2026-06-19T00:00:00+07:00

---

## Overall verdict

The spine pair is mechanically sound and ready to hand to architecture for the main implementation path. Token system is clean with zero broken cross-references; all 4 user journeys are present with named protagonists and climax beats; the PRD vocabulary is inherited correctly throughout. The rubric walker found no critical issues.

The adversarial and accessibility reviewers together surface a single dominant concern: **Ghost Rival's core visual mechanic (`ghost-dim` at 30% opacity) and its dark-only identity create real legibility and accessibility problems in the product's primary use environment — the gym.** This is not a cosmetic issue; it undermines the Ghost comparison feature the product is built around. The edge-case hunter found 7 critical unhandled cases, most of which will cause silent data corruption (phantom PRs, ghost referencing itself, unit mismatch on draft resume) rather than visible crashes.

Fourteen critical findings in total across all reviewers. Nine are structural — they need spine updates before story-dev begins. Five are implementation-layer issues that should be captured as engineering requirements in the architecture phase.

---

## Category verdicts

| Category | Verdict |
|---|---|
| Flow coverage | strong |
| Token completeness | strong |
| Component coverage | adequate |
| State coverage | adequate |
| Visual reference coverage | adequate |
| Bloat & overspecification | strong |
| Inheritance discipline | strong |
| Shape fit | strong |

---

## Findings by severity

### Critical (14)

**[Rubric — Token completeness]** — No error/validation color token (DESIGN.md Colors, missing)
No `feedback-error` token exists. Exercise Creator, weight/reps validation, and duplicate name error (FR-1) all need an error state color. `pr-burst` is reserved exclusively for PRs.
Fix: Add `feedback-error` token (e.g., `#ff4444`) to DESIGN.md frontmatter, scoped to form validation only.

---

**[Adversarial]** — `ghost-dim` 30% opacity unreadable under actual gym lighting
Calibrated on a design monitor, not under fluorescent gym overheads. The Ghost comparison mechanic becomes invisible in the product's primary use environment.
Fix: Test in an actual gym environment. Likely needs 40–45% opacity and a slightly lighter `surface-raised`. Consider making high-contrast mode the default.

---

**[Adversarial]** — No light mode is an operational liability for gym/outdoor use
Dark surfaces under bright overhead lighting produce glare. No Settings fallback. Users encounter a readability failure with no recourse.
Fix: Add "Bright Environment Mode" in Settings that raises surface levels ~30% luminance while preserving hue and color semantics.

---

**[Adversarial]** — Session lockout has no escape valve for mid-session Hall of Fame reference
Exercises are added mid-session, but the spec assumes all Ghost review happens pre-session. Users who add an exercise spontaneously cannot reference past lifts without ending the session.
Fix: Add read-only Hall of Fame panel accessible from within session, or add a "Review Ghosts" step to the session start flow.

---

**[Adversarial]** — Infinite Goal Engine algorithm is entirely unspecified
The formula, input signals, rounding rules, edge cases, and display format are absent. A developer reading these spines cannot implement this feature.
Fix: Add an "Infinite Goal Engine" section to EXPERIENCE.md specifying: input signals, calculation logic, rounding, display format, and edge cases (first PR, plateau, rapid beginner gains).

---

**[Edge-case]** — Swipe-to-delete within 30s edit window post-PR: phantom Hall of Fame entries, no rollback
Hall of Fame is written at PR detection time. Deleting the set within the 30s window does not retract the Hall of Fame entry. Phantom PRs accumulate.
Fix: Spec rollback behavior: if a PR-triggering set is deleted within 30s, retract the corresponding Hall of Fame entry and restore the previous Ghost.

---

**[Edge-case]** — PR detected at exact app force-close: PR silently lost
Draft recovery restores the session but does not re-run PR detection on recovered sets. The PR is lost with no indication to the user.
Fix: Spec that draft recovery re-evaluates all recovered sets for PR detection and fires retroactive PR Explosion if applicable.

---

**[Edge-case]** — Stale PR after multi-device sync: phantom PRs accumulate permanently
PR celebrated on Device A against a stale Ghost. After syncing Device B's newer data, the PR may not be valid against the merged dataset. No re-evaluation or retraction mechanism exists.
Fix: After sync, re-evaluate Hall of Fame entries against the merged dataset. Flag or retract entries that no longer qualify.

---

**[Edge-case]** — 0-set session end: undefined Summary content, potential 0-value Ghost
No spec for what happens when End Workout is confirmed with 0 sets. A 0-value Ghost would corrupt all future comparisons.
Fix: Block "End Workout" confirmation if 0 sets logged; show "No sets logged — are you sure?" warning. Alternatively, discard sessions with 0 sets entirely.

---

**[Edge-case]** — Draft resume after kg→lb unit change: stored values displayed in wrong unit
Draft weights are stored in original unit. No conversion on resume after unit change.
Fix: Store all weights internally in a canonical unit (kg). Convert for display only. Unit change is always a display preference, never a data transformation.

---

**[Edge-case]** — Ghost referencing in-progress session: Last Session type self-references current session
On first set of a new exercise in the current session, "Last Session" Ghost type would reference that same set, violating the invariant that Ghosts are always from past sessions.
Fix: Ghost candidates exclude the current session_id. "Last Session" is the most recent completed session, not the current one.

---

**[Edge-case]** — SYSTEM_ALERT_WINDOW revoked mid-session: Floating Bubble disappears with no auto-fallback
Notification fallback may not auto-activate on permission revocation. User loses the entire logging UX.
Fix: On permission revocation event, immediately promote to persistent notification fallback and surface a one-time toast: "Overlay permission removed — logging via notification instead."

---

**[Accessibility]** — Rest timer zero: no persistent signal for users who cannot feel haptics
Haptic + Bubble pulse are instantaneous. No persistent indicator when user is in another app.
Fix: Repeating haptic (2–3 cycles). Bubble sub-label changes to "Ready" persistently. Screen-reader live announcement pushed to foreground.

---

**[Accessibility]** — `ghost-dim` below WCAG AA; High Contrast Ghost not auto-triggered by system Increase Contrast flag
Low-vision users who express need via system flags still encounter illegible Ghost data.
Fix: Read `UIAccessibilityIsReduceTransparencyEnabled` / `isHighTextContrastEnabled`. Auto-apply High Contrast Ghost rendering when either flag is active.

---

### High (19)

**[Rubric — Component coverage]** — `gym-streak-widget` has no visual or behavioral spec
Referenced on Home tab and in Key Flows; blocks Home tab architecture and story-dev.
Fix: Add to both spines. Minimum: layout position, Streak count display, Mercy Day indicator, milestone notification trigger.

**[Rubric — Component coverage]** — `ghost-type-selector` has no spec
Referenced in IA and UJ-4; blocks UJ-4 story-dev.
Fix: Add to both spines. Minimum: bottom-sheet trigger, 3 options, selection state, supplementary Ghost data per option.

**[Rubric — Token completeness]** — `ghost-accent` contrast ratio stated incorrectly in Accessibility Floor
Stated as 7.2:1; actual ≈ 9.6:1 on `surface-raised`. Not a failure but the stated value is wrong.
Fix: Correct the stated ratio in EXPERIENCE.md Accessibility Floor.

**[Adversarial]** — 30s Set Row edit window has no visual timer affordance and no locked-row interaction spec
Developer must invent 3 behaviors the spec omits.
Fix: Spec the visual indicator for the edit window. Spec the locked-row tap behavior (toast).

**[Adversarial]** — Gym Streak mechanic never explained to users; first reset will feel like a bug
Weekly cadence (not daily), reset rules, and Mercy Day interaction are invisible.
Fix: Add tooltip spec for Streak widget's first interaction. Add State Pattern for the streak reset moment with specific copy.

**[Adversarial]** — Set pre-fill hierarchy contradicts PRD
PRD §4.2: "First Set pre-fills from Ghost data." EXPERIENCE.md: "Pre-fills from previous set within session." Conflict on Set 1.
Fix: Define explicit hierarchy: (1) previous Set within session, (2) Ghost data (Set 1), (3) blank (Set 1, no Ghost).

**[Adversarial]** — Draft recovery: no "Save as Complete" path
Users returning hours later must choose between resuming or discarding. No middle path.
Fix: Add "Save as Complete" as a third CTA — becomes primary when draft is older than 2 hours.

**[Adversarial]** — Tab bar uses `ghost-accent` for active state, violating cyan exclusivity rule
DESIGN.md explicitly reserves cyan for Ghost data only.
Fix: Use `ink-primary` (white) for active tab state; `ink-secondary` for inactive.

**[Edge-case]** — Exercise deleted while session is active: undefined behavior
**[Edge-case]** — Weight = 0 or negative: no validation rules
**[Edge-case]** — Reps = 0: no validation rules
**[Edge-case]** — Rest Timer reaches zero while PR Explosion blocks input: user misses timer signal entirely
**[Edge-case]** — Android predictive back gesture during PR Explosion: unclear if blocked
**[Edge-case]** — iOS Live Activity relegated to minimal state by competing Live Activity: no fallback
**[Accessibility]** — PR Explosion focus management unspecified for screen readers
**[Accessibility]** — Ghost Type Selector lacks accessible selection state
**[Accessibility]** — 30s edit window insufficient for screen reader users (needs 90s)
**[Accessibility]** — Swipe-to-delete has no screen reader equivalent

### Medium (27)

Key medium findings (see individual review files for complete list):

- [Rubric] `session-end-confirmation` missing component spec
- [Rubric] `exercise-creator` missing component spec + validation error state
- [Rubric] `draft-resume-prompt` missing component spec
- [Rubric] Hall of Fame per-exercise view state unspecced
- [Rubric] Settings account deletion confirmation state unspecced
- [Rubric] Session screen "no exercises added yet" state missing
- [Adversarial] Hall of Fame newest-first ordering buries meaningful PRs with no filter
- [Adversarial] Ghost mechanic never explained to first-time users
- [Adversarial] Infinite Goal Chip layout on Ghost Row: three competing elements, no spatial spec
- [Edge-case] Ghost Type Selector with only 1 session ever: all types show identical data
- [Edge-case] Last Week and Last Month Ghost pointing to same session: no dedup
- [Edge-case] Two PRs on same set (weight + volume): unclear if 1 or 2 Hall of Fame entries
- [Edge-case] Session synced from two devices: session-level conflict not addressed
- [Accessibility] `ink-secondary` contrast on `surface-overlay` unverified (≈4.3:1, may be below AA)
- [Accessibility] "No ghost yet" placeholder in `ink-disabled` (1.5:1) for meaningful text
- [Accessibility] PR Explosion "Previous ghost" line in `ghost-dim` (sub-AA) for comparative data
- [Accessibility] Empty state ghost icon opacity not specified in High Contrast mode
- [Accessibility] Dynamic Island compact mode has no accessibility label defined

### Low (24)

See individual review files for full list. Key low-priority items:

- [Rubric] Unresolved `sources` frontmatter path (not absolute)
- [Adversarial] "Ghost button" naming collides with Ghost mechanic vocabulary
- [Adversarial] "No ghost yet" copy inaccurate when Ghost exists for another type
- [Adversarial] Undo toast component entirely unspecced
- [Adversarial] Dynamic Island compact Ghost icon: no clarity guidance at 14pt
- [Edge-case] Home tab "session active in background" state: FAB state change unspecced
- [Accessibility] DM Sans: no fallback font specified
- [Accessibility] Undo toast 4s duration insufficient for screen reader users

---

## Reviewer files

- `review-rubric.md` — Mechanical rubric walker
- `review-adversarial.md` — Adversarial reviewer
- `review-edge-cases.md` — Edge-case hunter (57 cases)
- `review-accessibility.md` — Accessibility reviewer
