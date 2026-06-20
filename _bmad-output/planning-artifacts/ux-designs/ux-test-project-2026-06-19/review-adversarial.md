# Adversarial Review — Ghost Rival

## Verdict

The spec is visually coherent and unusually mature on accessibility and platform deltas, but has critical implementation gaps. The "invisible until it matters" philosophy breaks down in real gym lighting, and three of the four critical issues will require engineer re-work or ship broken. The most dangerous finding is that the Infinite Goal Engine — the differentiating feature after Ghost Rival itself — is named throughout the spines but never algorithmically specified. A developer reading these spines cannot implement it.

---

## Findings

### Critical

**C-1: `ghost-dim` at 30% opacity will be unreadable under actual gym lighting**

The DESIGN.md rationale for `ghost-dim` at 30% opacity reads: "At 20%, ghost data becomes invisible on `surface-raised` at typical ambient light. At 40%, it begins to compete with white `ink-primary` data. 30% is the threshold where 'present but subordinate' is reliably achieved."

This calibration was done on a design monitor in controlled lighting. Gyms have strong overhead fluorescents or LED banks with high color temperatures (5000–6500K). Under these conditions, screen luminance appears lower relative to ambient light, and low-opacity text loses perceptual contrast faster than the ratio math suggests. The core gameplay mechanic — live Ghost comparison — becomes invisible precisely when it matters most: mid-set, under gym lights, glancing at the screen for 1–2 seconds.

*Fix:* Test `ghost-dim` in an actual fluorescent or LED gym environment. The opacity may need to be raised to 40–45% and the `surface-raised` background may need a slight luminance increase (e.g., `#1a1a20` instead of `#141418`) to maintain the "present but subordinate" balance under real conditions. Alternatively, use the high-contrast mode as the default and make the subdued version opt-in, inverting the current assumption.

---

**C-2: "No light mode" is an operational liability, not just a brand stance**

DESIGN.md Brand & Style: "There is no light mode. This is not a dark mode toggle; it is the product's identity." This is a legitimate product position — but only if the product's primary use context supports it. Ghost Rival's primary use context is a gym.

Under bright overhead gym lighting, dark surfaces require higher screen brightness to remain legible, which increases battery drain and screen glare from pupil constriction. Outdoor training (parking lot, track, park) makes this significantly worse. The "dark = game identity" argument survives a pitch deck but not a parking-lot workout.

More practically: if the user encounters readability problems and discovers there is no light mode option anywhere in Settings, the first reaction is "this app is broken." The brand stance becomes a support ticket.

*Fix:* Either (a) add a "Bright Environment Mode" in Settings that raises all three surface levels by approximately 30% luminance while preserving the hue and all color semantics — this is not a light mode, it's a legibility accommodation; or (b) document explicitly in the product brief that Ghost Rival is designed for indoor gym use only and acknowledge the tradeoff. At minimum, add to DESIGN.md Do's and Don'ts: "Do test on-device in gym lighting conditions before shipping. Don't assume monitor calibration equals gym readability."

---

**C-3: Session lockout has no escape valve, but the flow assumes pre-session Ghost selection that doesn't exist**

EXPERIENCE.md Navigation rules: "There is no back navigation from the Session screen to the tab bar. The exit path is the End Workout flow only."

The problem: exercises in Ghost Rival are added mid-session (Exercise Creator bottom sheet), not pre-selected from a list. A user who adds "Romanian Deadlift" to their session for the first time and wants to check their Hall of Fame for historical lift data — to decide what Ghost to set — cannot. They must end the session, check Hall of Fame, start a new session.

UJ-4 describes Kenji reviewing his Ghost lineup "before a workout" on the Home tab. But what about exercises added spontaneously mid-session? The spec doesn't address this. The lockout assumes all Ghost review happens before session start, but the session flow doesn't enforce or facilitate that.

*Fix:* Either (a) allow a read-only Hall of Fame access from within the session (slide-in panel, not a tab navigation) so users can reference history mid-session without ending it; or (b) add a "Review Ghosts" step to the Session start flow that surfaces the Ghost lineup before the first exercise is added. Committing to one path and documenting it closes the gap.

---

**C-4: The Infinite Goal Engine is named and featured throughout the spines but never algorithmically specified**

DESIGN.md Components §infinite-goal-chip: "Outline pill, `pr-burst` border. Forward-looking target. Dismissible on overlay; persistent on Ghost Row."

EXPERIENCE.md PR Explosion Sequence Step 9: "Infinite Goal Engine computes next target. Infinite Goal chip appears."

That's it. The algorithm for computing the next target — the feature's entire value — appears nowhere. PRD §4.6 FR-16 mentions "average improvement rate over last 4 sessions" but the spines are supposed to own this decision, and they don't. A developer reading the spines has zero specification for: the formula, what happens when there are fewer than 4 sessions, what "improvement rate" means for a multi-metric PR (weight vs. volume vs. reps), how the target is phrased when the algorithm produces a non-standard increment (e.g., 1.3kg), or what the estimated date calculation looks like.

*Fix:* Add an "Infinite Goal Engine" invented section to EXPERIENCE.md that specifies: the input signals (last N PRs, their dates, their values), the calculation logic (even if simplified: "linear regression over last 4 PR values, extrapolated to next standard increment"), rounding rules, the display format ("Next target: 105kg × 4 — est. [date]"), and edge cases (first PR, plateau behavior, rapid beginner gains producing unrealistic projections).

---

### High

**H-1: The 30-second Set Row edit window has no visual timer affordance and no locked-row interaction spec**

EXPERIENCE.md Component Patterns: "Tap to edit within 30s of logging (after 30s, row is locked)."

There is no spec for: what visual treatment indicates the 30-second window is active (does a progress indicator appear on the row?), what happens when the user taps a locked row (no spec — does it do nothing? Show a toast?), and what the transition from editable to locked looks like. A developer implementing this component has to invent three behaviors the spec omits.

*Fix:* Add a secondary visual indicator on the Set Row when it's in the 30s edit window (e.g., the row border animates from `ghost-accent` to `border-subtle` over 30 seconds). Specify the locked-row tap behavior: a single dismissible toast "This set is locked. Set logging is final after 30 seconds." in `ink-secondary`.

---

**H-2: The Gym Streak mechanic is never explained to the user**

The Gym Streak widget on the Home tab shows a number. The user is told this number, but nowhere in the spines is the mechanic explained: that it's weekly (not daily), that it resets on a missed calendar week (not a missed day), or that Mercy Days exist and interact with a secondary daily streak. The first time a user's streak resets to zero after missing one day mid-week and not understanding the weekly calendar boundary, they will feel the app is broken.

EXPERIENCE.md Voice and Tone has excellent copy guidance but no worked example for the Streak widget or first-streak-reset experience.

*Fix:* Add a tooltip or info callout specced for the Streak widget's first interaction — explaining "one gym week = one streak point." Add a State Pattern for the streak reset moment: "Streak resets to 0 on [date] — copy: 'A new week, a new streak. Start today.'" This is the app's only persistent gamification mechanic and it needs copy protection.

---

**H-3: Set pre-fill hierarchy is contradictory between PRD and EXPERIENCE.md**

PRD §4.2: "First Set pre-fills from Ghost data, or blank if no Ghost exists yet."

EXPERIENCE.md Component Patterns §Set Row: "Pre-fills weight/reps from previous set [within the session]."

These conflict. In the PRD, the first Set pre-fills from Ghost. In EXPERIENCE.md, pre-fill comes from the previous Set within the session (which doesn't exist for Set 1). The developer will implement one or the other and be right 50% of the time.

*Fix:* Define the pre-fill hierarchy explicitly: (1) Previous Set within current session (Sets 2+). (2) Ghost data (Set 1, if Ghost exists). (3) Blank (Set 1, no Ghost). Make this a named component rule in EXPERIENCE.md Component Patterns §Set Row.

---

**H-4: Draft recovery offers only Resume or Discard — no "Save as Complete" path**

EXPERIENCE.md Session Lifecycle §Phase 5: "Offer to resume or discard." A user who force-closed the app at the end of their session (but before tapping "End Workout") and doesn't want to re-enter the session has no way to save the session as complete. They must choose between resuming (reopening the session) or discarding (losing the data). The correct answer for most users returning hours later is "save what was logged."

*Fix:* Add a third option to the draft resume modal: "Save as Complete" — saves the session up to the force-close point as a completed session (triggers Session Summary) without resuming. This path should be the primary CTA when the draft is older than 2 hours.

---

### Medium

**M-1: Tab bar uses `ghost-accent` (cyan) for active tab state, violating the "cyan = Ghost data only" exclusivity rule**

DESIGN.md Brand & Style: "Cyan is reserved for one thing: Ghost data. `ghost-accent` and `ghost-dim` never appear on interactive controls, informational badges, or any UI that is not referencing a historical benchmark."

DESIGN.md Components §Tab Bar implies `ghost-accent` is used for the active tab indicator (following standard design system patterns). If the active tab icon/label renders in `ghost-accent`, this directly violates the stated exclusivity rule. A user who learns "cyan = my Ghost" will be confused when cyan marks a tab as active.

*Fix:* Use `ink-primary` (white) for the active tab state. Use `ink-secondary` (muted) for inactive tabs. The visual differentiation of active vs. inactive tab should come from weight, opacity, or a non-cyan indicator mark — not cyan.

---

**M-2: Hall of Fame newest-first ordering buries meaningful PRs as history accumulates**

EXPERIENCE.md IA §Hall of Fame: "chronological, newest first." After 6 months of training, a user's Hall of Fame for Bench Press contains 15 entries. The most recent PR is at the top — but the user may want to see "my all-time best Bench Press" or "all my Squat PRs." Flat newest-first chronological ordering with no filter buries history.

*Fix:* Either (a) add a per-exercise filter (tap exercise name to see only those PRs) as an MVP feature, since FR-15 says Hall of Fame is accessible from "Exercise detail view" — suggesting per-exercise grouping was intended; or (b) explicitly call out in EXPERIENCE.md IA that flat global ordering is the MVP choice and per-exercise view is Phase 2.

---

**M-3: The Ghost mechanic is never explained to first-time users**

UJ-1 ends with: "Your first Bench Press Ghost has been summoned. Come back next time to beat it." This assumes the user understands what the Ghost is and why they should want to beat it. But the session flow has no moment where the Ghost mechanic is introduced. Users who didn't read the App Store description before downloading arrive at the Session screen with no context.

EXPERIENCE.md Session Lifecycle Phase 1 (session start) has no first-session orientation step. The "invisible" philosophy justifies not prompting — but the Ghost metaphor is unfamiliar enough that one moment of orientation would significantly improve the mechanic's emotional landing.

*Fix:* After the first session completes (UJ-1 climax), the Summary screen should include a one-time contextual explanation: "You just summoned your Bench Press Ghost — a record of you from today. Next time, you'll race it." This is not an interstitial or an onboarding flow. It's part of the session summary for first-time users only.

---

**M-4: Infinite Goal Chip layout on Ghost Row creates three competing elements**

The Ghost Row currently contains: Exercise name (heading weight), Ghost data (ghost-dim), and Infinite Goal chip (pr-burst outline pill). This is three distinct visual elements with different weights, colors, and semantic purposes on a single card. The layout spec for how these three elements are arranged spatially is absent — which element is primary, how the chip wraps, and what happens when the goal text is long ("Next target: 102.5kg × 4") is unspecified.

*Fix:* Spec the Ghost Row layout explicitly: Exercise name at top (full width), Ghost data as secondary line, Infinite Goal chip as tertiary line. Define max-width for the chip text (truncate at 24 characters with ellipsis) and clarify that the chip only appears after a PR exists — not on the first session.

---

### Low

**L-1: "Ghost button" informal naming collides with Ghost mechanic vocabulary**

Somewhere in the component patterns, the pill-style CTA used on the PR Explosion and elsewhere is described as a "ghost button" (industry term for an outline-style button). This directly collides with the product's central "Ghost" vocabulary. A developer reading "ghost button" in the implementation will not know whether it means "a button styled as an outline" or "a button associated with the Ghost mechanic."

*Fix:* Replace "ghost button" with "outline button" or "pill-outline button" throughout the spines.

---

**L-2: "No Ghost yet" copy is ambiguous when Ghost exists but not for selected type**

"No ghost yet — come back after your first session" is shown when no Ghost exists. But if Last Week Ghost is empty (haven't trained this week) while All-Time PR Ghost exists, the copy is inaccurate. The spec does not differentiate between "no Ghost for any type" (truly first user) and "no Ghost for the selected type" (trained but not recently).

*Fix:* Two distinct empty states: (a) "Your first session will summon your Ghost." (no sessions at all) vs. (b) "You haven't trained this week — try Last Month or your All-Time best." (no data for selected type only).

---

**L-3: Undo toast is unspecced**

The 30-second Set Row edit window implies undo is possible within that window. But there is no undo toast component in the Component Patterns, no visual spec for it in DESIGN.md, no placement guidance (does it appear above the Rest Timer Bar?), and no collision resolution if the toast appears simultaneously with the Rest Timer Bar completing.

*Fix:* Add `undo-toast` as a component: 36pt height, full-width minus 32pt margins, `surface-overlay` background, "Undo" tappable text in `ghost-accent` on the right. Stacked above the Rest Timer Bar. Auto-dismisses after 4 seconds (or 30s if VoiceOver active per accessibility finding).

---

**L-4: Dynamic Island compact Ghost icon at 14pt has no clarity guidance**

DESIGN.md Components §Live Activity: "compact: ghost icon (14pt), rest timer countdown or 'Ready'." A Ghost icon at 14pt on the Dynamic Island will render as a ~10px icon after density scaling. Most icon libraries lose detail at this size. The spec provides no guidance on how the Ghost icon should be simplified for compact mode — whether it's a simplified glyph, the app icon, or an abstract shape.

*Fix:* Specify the compact-mode icon explicitly: "Use the app monogram (abstract 'G' glyph at 14pt, 1px stroke, `ghost-accent` on transparent) or the app icon at 14pt. Test on device before implementation."
