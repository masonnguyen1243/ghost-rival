# Addendum — Ghost Rival PRD

> Depth that belongs downstream (architecture, UX spec) or earned a place but doesn't fit the PRD narrative.

---

## Rejected / Deferred Concepts from Brainstorming

**Gym Coach Personality** (Idea #15)
Brainstorming surfaced an adaptive tone engine — warm after a good session, encouraging after a missed day, with user-selectable personality (strict / warm). Deferred to Phase 2. When it reaches design: the PRD §8 Ghost copy framing requirement constrains the strict-personality option — even a "stern" coach tone must reinforce self-vs-self narrative, not motivational clichés. The Phase 1 app voice (§8) is already defined; Phase 2 personality is an extension of it, not a replacement.

**Crush Mode** (Idea #16)
The brainstorming session surfaced a concept where the user names a real person ("crush," competitor) as a hidden rival to invoke emotional motivation. Deliberately excluded from MVP — contradicts the "completely private" core value and introduces emotional risk (the named person is never informed). May revisit in a later phase as an opt-in persona nickname with no real-person reference.

**Voice Logging** (Idea #1)
Rejected in brainstorming by Mason: users are reluctant to speak aloud at the gym. Confirmed not in scope.

**Watch & Train / YouTube Integration** (Idea #6)
Interesting concept — detecting watched workout videos and adding exercises to the plan. Too complex for MVP; requires YouTube API integration and adds external dependency. Phase 3 at earliest.

---

## iOS Logging Widget: Options Considered

Three iOS patterns were evaluated for the "log without leaving your app" mechanic:

| Option | Verdict | Reason |
|---|---|---|
| True system overlay | Blocked | iOS App Store policy prohibits `SYSTEM_ALERT_WINDOW`-equivalent |
| Picture-in-Picture | Not applicable | PiP is video-only on iOS |
| Live Activity / Dynamic Island | **Chosen** | Native iOS API, App Store compliant, available iOS 16.1+ |

Live Activity constraint: iOS limits Live Activity update frequency to prevent battery abuse. The Rest Timer countdown should update via background timer with graceful degradation (show elapsed time on wake vs. live countdown) if update budget is exhausted.

---

## Ghost Composition (Phase 2 Concept)

From brainstorming Idea #19: tracking fat mass and muscle mass separately via smart scale API integration. The PRD defers this to Phase 2. When it reaches architecture:
- Requires smart scale API (e.g., Withings, Garmin Index) — external dependency
- Ghost comparison would extend to body composition trend lines, not just workout performance
- Display: two diverging lines (fat decreasing, muscle increasing) over time

---

## Infinite Goal Engine — Algorithm Notes (for Architecture)

Not specified in PRD (it captures the "what," not the "how"). Architecture phase should consider:
- Simple linear regression over last N PRs per metric per Exercise
- Edge case: user plateaus (no PR in > 4 sessions) — goal should not become stale or demotivating; consider surfacing "beat your Last Month Ghost" as an interim challenge
- Edge case: rapid beginner gains (PRs every session in early weeks) — goal should not project unrealistically far ahead; cap projection at 2× the average inter-PR interval

---

## Cloud Backend Options (for Architecture)

PRD defers backend selection. Considerations for architecture phase:
- **Firebase / Firestore:** Rapid setup, generous free tier, offline sync built-in. Lock-in risk.
- **Supabase:** Open-source alternative, PostgreSQL under the hood, good free tier. Less mature offline sync.
- **Custom backend (Hono / Fastify + SQLite/Postgres):** Full control, more effort. Overkill for solo MVP.
- Recommended starting point: Firebase or Supabase for MVP velocity; re-evaluate at scale.

Data export format (FR-22) should be defined early — schema decisions during architecture affect export shape.
