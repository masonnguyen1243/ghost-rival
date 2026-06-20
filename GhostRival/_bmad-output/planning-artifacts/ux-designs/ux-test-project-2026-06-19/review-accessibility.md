# Accessibility Review — Ghost Rival

**Reviewed:** 2026-06-19
**Sources:** DESIGN.md (final), EXPERIENCE.md (final)
**Platform:** iOS 16.1+ / Android 10+ (React Native)

---

## Verdict

Ghost Rival's accessibility floor is more deliberate than most fitness apps: Reduced Motion, High Contrast Ghost mode, VoiceOver/TalkBack labels, and Dynamic Type reflow are all meaningfully specified. The critical gaps are the cost of two deliberate product decisions — dark-only identity and `ghost-dim` at 30% opacity — that were never fully reconciled with the accessibility guarantees those decisions undercut. Three issues represent real WCAG failures or durable user harm; fixing them does not require abandoning the product's visual identity.

---

## What's Well Specced

**Color independence is genuinely enforced.** Ghost data is distinguished from current data by color, opacity, and position simultaneously. PR badges carry the text "PR" — the orange border is not the only signal. Ghost type badges use uppercase text labels, not color alone.

**VoiceOver/TalkBack labels are composited correctly.** The Ghost Row label pattern — "[Exercise name]. Ghost: [self-narrative]. [Ghost type] [value]." — gives screen-reader users a coherent sentence. The PR Explosion announcement fires before the card content is announced, which is the correct ordering.

**Reduced Motion is structurally accounted for.** The PR Explosion shockwave is replaced by a static 200ms `pr-burst` flash; particles are omitted; Ghost retire/materialize animations are made instant. All functional behavior is preserved.

**Dynamic Type reflow is specified with a real floor.** `display` numbers reflow using auto-sizing down to a minimum of 28pt before truncating. No fixed-width containers clip text.

**Touch targets meet the standard.** 44×44pt/dp minimum across all interactive elements, with Ghost Rows, Set Rows, and Hall of Fame entries specified as full-width tap targets.

**Haptic vocabulary is defined per event.** Light/medium/heavy/error distinctions give developers a coherent spec.

---

## Findings

### Critical — WCAG failure or likely durable user harm

**1. Rest timer zero: haptic + Floating Bubble pulse are the only durable signals — no persistent indicator for users who cannot feel haptics**

Three signals fire at rest timer zero: a 600ms `pr-burst` flash on the Rest Timer Bar, a single radial pulse on the Floating Bubble, and a heavy haptic. All three are instantaneous and non-repeating. When the user is in another app (the explicitly designed use case), the bar flash is invisible and the Bubble pulse is gone in under a second.

For deaf-blind users or any user who is not watching the screen at the exact moment of expiry, there is no persistent indication the timer has expired. This implicates **WCAG 1.3.3 (Sensory Characteristics)** — the timer-zero event is communicated by transient sensory signals only.

*Fix:* Add a 2–3 cycle repeating haptic pattern on timer zero rather than a single pulse. On the Floating Bubble, change the sub-label to "Ready" persistently and add a visible badge state (`ghost-accent` border changes to `pr-burst`, persists until next set is logged). Add a screen-reader live announcement ("Rest complete. Ready to log your next set.") via platform accessibility notification.

---

**2. `ghost-dim` knowingly below WCAG AA, but High Contrast Ghost setting is never auto-triggered by system Increase Contrast flag**

EXPERIENCE.md acknowledges `ghost-dim` (rgba(0,229,255,0.30)) on `surface-raised` (#141418) is "intentionally below AA" and describes a "High contrast ghost data" setting in Settings. Computed contrast ratio ≈ 1.6:1 against `surface-raised`. WCAG AA requires 4.5:1 for normal text, 3:1 for large text.

The critical gap: neither spine specifies that High Contrast Ghost is automatically activated when the user enables **Increase Contrast** on iOS (Settings → Accessibility → Increase Contrast) or equivalent Android flags. These are the platform signals that a user explicitly needs higher contrast. Requiring the user to find Ghost Rival's own Settings toggle means low-vision users who rely on system-level accessibility flags will encounter illegible Ghost data — the core mechanic — with no automatic remedy.

This implicates **WCAG 1.4.3 (Contrast Minimum)** for users who need it and have expressed that need via platform accessibility settings.

*Fix:* Read `UIAccessibilityIsReduceTransparencyEnabled` (iOS) and `isHighTextContrastEnabled` (Android) at app startup. When either flag is active, automatically apply High Contrast Ghost rendering (`ghost-accent` at full opacity) without requiring the Settings toggle. The Settings toggle remains as a manual override. Add a note to the onboarding/first-session experience that the High Contrast option exists.

---

**3. No light mode, with no documented mitigation for low-vision users in bright environments and no Smart Invert compatibility specification**

Dark interfaces in bright gym environments require higher screen brightness, producing glare from pupil constriction. Low-vision users in bright environments are the most likely group to struggle with contrast on a dark surface.

Additionally, iOS Smart Invert — the accessibility feature low-vision iOS users rely on to force light-like experiences from dark apps — inverts the display except for images and media. Without `accessibilityIgnoresInvertColors = true` on Ghost Rival's animation and color-semantic elements (Ghost retire animation, shockwave particles, `ghost-dim` text, `ghost-accent` indicators, `pr-burst` elements), Smart Invert will destroy the color semantics: ghost-dim cyan becomes dark orange-red, pr-burst orange becomes cyan, creating an uncanny inversion of the entire Ghost/PR visual language.

This is a cluster of **WCAG 1.4.3** and **1.4.11** risks the spec has not resolved.

*Fix:* Mark Ghost icons, PR Explosion rings, particles, ghost-dim text, ghost-accent indicators, and pr-burst elements with `accessibilityIgnoresInvertColors = true` on iOS so that Smart Invert users get inverted chrome (light backgrounds) without destroying color semantics. Document explicitly for the implementation team. Consider specifying a "Bright Gym Mode" (raise surface levels ~30% luminance, preserve hues) as a v1.1 item.

---

### High

**4. PR Explosion focus management on screen readers is unspecified**

The PR Explosion full-screen overlay blocks all session input. EXPERIENCE.md specifies the VoiceOver/TalkBack announcement text but not: where focus is set when the overlay appears, the traversal order within the overlay, or where focus returns on dismiss. Without explicit focus management, VoiceOver may land anywhere.

*Fix:* Set `accessibilityViewIsModal = true` (iOS) / modal container with `importantForAccessibility="yes"` (Android). Define traversal: overlay announcement → "NEW RECORD" heading → new value → "Previous: [old value]" → "Saved to Hall of Fame" → Infinite Goal chip (if present) → "Continue" button. On dismiss, return focus to the Set Row that triggered the PR.

---

**5. Ghost Type Selector sheet lacks accessible selection state**

The Ghost Type Selector shows selection with a `ghost-accent` checkmark. The spec does not define how this is communicated to VoiceOver/TalkBack. The supplementary data per option ("80kg × 5, 3 days ago") is not part of any defined accessibility label.

*Fix:* Implement each option with `accessibilityRole="radio"` and `accessibilityState={{ checked: isSelected }}`. Full label per option: "[Ghost type name], [value], [time reference], [selected/not selected]." Example: "Last Week, 80 kilograms by 5 reps, last Tuesday, selected."

---

**6. The 30-second Set Row edit window is insufficient for screen reader users**

For a VoiceOver/TalkBack user, 30 seconds is frequently insufficient to: have the new Set Row announced, understand the logged value, decide it's incorrect, navigate to the row, and activate the edit affordance. Screen reader users interact at 2–4x the time of sighted users on dense UI.

*Fix:* When VoiceOver (`UIAccessibilityIsVoiceOverRunning`) or TalkBack (`AccessibilityManager.isTouchExplorationEnabled`) is active, extend the edit window to 90 seconds.

---

**7. Swipe-to-delete on Set Rows has no screen reader equivalent**

Swipe-to-delete is a gesture-based interaction. VoiceOver and TalkBack require all swipe-to-delete affordances to also be available via the actions menu (VoiceOver rotor / TalkBack custom actions).

*Fix:* Implement a "Delete" custom action on Set Row accessible elements via `accessibilityActions` (React Native) so screen reader users can access deletion through the rotor/actions menu.

---

**8. Live Activity lock screen tap: biometric auth flow is undocumented for accessibility**

EXPERIENCE.md correctly notes that tapping the iOS Live Activity on the lock screen triggers Face ID/Touch ID. The spec does not address users with Face ID/Touch ID disabled or who use switch access or other input methods.

*Fix:* Add a note confirming the standard iOS lock screen → biometric → passcode fallback chain is left to platform behavior and does not require app-level customization. Explicit for the implementation team to avoid intercepting the auth flow.

---

### Medium

**9. `ink-secondary` contrast on `surface-overlay` unverified**

`ink-secondary` (#8888a0) on `surface-raised` (#141418) ≈ 4.6:1 (passes AA). On `surface-overlay` (#1a1a22) ≈ 4.3:1 — technically below AA (4.5:1) for normal text, and `surface-overlay` is used in the Session End confirmation, PR Explosion card, and Session Summary.

*Fix:* Verify computed contrast at implementation. If below 4.5:1, lighten `ink-secondary` by 2–3% brightness (to approximately #9090a8) for overlay contexts.

---

**10. PR badge 1px border may be imperceptible for low-vision users**

`pr-burst` (#ff6b00) on `surface-raised` ≈ 5.1:1 (passes WCAG 1.4.11). However, a 1px border at standard device pixel ratios may be difficult to see in high-ambient-light conditions for low-vision users.

*Fix:* Confirm 1px renders as at least 2 CSS pixels at standard device scale; consider 1.5px border for consistency with Floating Bubble and Infinite Goal Chip specs.

---

**11. "No ghost yet" placeholder uses `ink-disabled` (1.5:1) for meaningful informational text**

"No ghost yet — come back after your first session" in `ink-disabled` (#3a3a50) on `surface-raised` (#141418) ≈ 1.5:1. This is a meaningful informational string, not a form placeholder. `ink-disabled` is defined for disabled controls only.

*Fix:* Render in `ink-secondary` (#8888a0), which passes AA at 4.6:1 on `surface-raised`.

---

**12. PR Explosion "Previous ghost" line uses `ghost-dim` (sub-AA) for comparative data the user needs to read**

On the PR Explosion NEW RECORD card, "Previous: [old value]" renders in `ghost-dim`. On the overlay, this is not supplementary data — it's the contrast point of the moment. Rendering it at ~1.6:1 undermines the comparison.

*Fix:* On the PR Explosion NEW RECORD card specifically, render "Previous: [old value]" in `ghost-accent` at full opacity (≈9.6:1 on `surface-overlay`). The cyan identity is preserved; the value becomes legible.

---

**13. Empty state ghost icon at 30% opacity not updated in High Contrast mode**

The empty state ghost icon uses `ghost-accent` at 30% opacity. When High Contrast Ghost mode is active, the spec does not specify whether this illustration also increases. Visual inconsistency — all Ghost data text at full opacity, illustration still at 30% — may confuse users about what the High Contrast toggle changed.

*Fix:* When High Contrast Ghost mode is active, render the empty state ghost icon at 60% opacity.

---

**14. Dynamic Island compact mode has no accessibility label defined**

The iOS Live Activity compact mode shows a Ghost icon and rest timer countdown. The spec is silent on VoiceOver handling. Without a defined `accessibilityLabel`, VoiceOver may announce raw widget structure.

*Fix:* Specify Live Activity accessibility labels. Timer active: "Ghost Rival session active. [Exercise name]. Rest timer: [X] seconds remaining." Timer inactive: "Ghost Rival session active. [Exercise name]. Ready to log next set."

---

### Low / Advisory

**15. DM Sans has no specified fallback font — load failure is unhandled**

DESIGN.md states there is no platform-native fallback. If DM Sans fails to load, weight contrast — "the primary visual rhythm" — degrades silently.

*Advisory:* Specify a fallback stack and add a non-fatal font-load warning at app startup.

---

**16. Undo toast 4s duration insufficient for screen reader users**

4 seconds may not give VoiceOver/TalkBack users enough time to hear the announcement and activate "Undo."

*Advisory:* Extend to 8 seconds when VoiceOver or TalkBack is active. Add `accessibilityLiveRegion` on the toast container.

---

**17. Tab bar removal at session start has no focus announcement**

When the Session takeover appears and the tab bar is hidden, a screen reader user's last focus position may have vanished.

*Advisory:* When the Session full-screen takeover slides up, move accessibility focus to the Session screen's primary heading or first interactive element.

---

**18. Cardio pace reference traversal order unspecified**

The read-only target pace reference adjacent to Cardio Set input fields has no defined accessibility role or traversal order. Screen readers may announce it in the wrong order relative to the inputs it contextualizes.

*Advisory:* Mark as `accessibilityRole="text"` with full label. Ensure it appears first in traversal order within the Set entry form.

---

**19. "Saved to Hall of Fame" copy when offline may mislead users who need explicit system status**

When offline, "Saved to Hall of Fame" is shown without qualification. For cognitive accessibility users who need clear system status, the local-only save may feel like a broken promise on another device.

*Advisory:* When offline, add subordinate copy in `ink-secondary`: "Saved locally. Will sync when you reconnect."
