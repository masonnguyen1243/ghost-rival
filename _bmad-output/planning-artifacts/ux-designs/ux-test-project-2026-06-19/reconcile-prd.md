# Reconcile — PRD

Source: `prds/prd-test-project-2026-06-19/prd.md`

## Fully captured

| PRD requirement | Where in spines |
|---|---|
| FR-1 to FR-3: Exercise management | EXPERIENCE.md Component Patterns (Exercise Creator), State Patterns |
| FR-4: Session lifecycle (start/pause/end/draft) | EXPERIENCE.md Session Lifecycle |
| FR-5: Strength Set logging + pre-fill | EXPERIENCE.md Session Lifecycle, Component Patterns (Set Row) |
| FR-6: Cardio Set logging | EXPERIENCE.md Ghost Comparison Patterns (Cardio) |
| FR-7: Rest Timer | EXPERIENCE.md Component Patterns (Rest Timer Bar), State Patterns |
| FR-8: Android Floating Bubble | EXPERIENCE.md Floating Bubble & Live Activity; DESIGN.md Floating Bubble |
| FR-9: iOS Live Activity | EXPERIENCE.md Floating Bubble & Live Activity; DESIGN.md Live Activity |
| FR-10 to FR-12: Ghost system | EXPERIENCE.md Ghost Comparison Patterns, Information Architecture |
| FR-13 to FR-15: PR Detection + Explosion + Hall of Fame | EXPERIENCE.md PR Explosion Sequence; DESIGN.md PR Explosion Overlay |
| FR-16 to FR-17: Infinite Goal Engine | DESIGN.md Infinite Goal Chip; EXPERIENCE.md PR Explosion Sequence |
| FR-18 to FR-19: Gym Streak + Mercy Days | EXPERIENCE.md State Patterns |
| FR-20 to FR-22: Cloud sync + Account + Export | EXPERIENCE.md Offline-First Behavior, State Patterns |
| §8 Aesthetic and Tone | DESIGN.md Brand & Style, Colors, Do's and Don'ts; EXPERIENCE.md Voice and Tone |
| §9 Performance constraints | EXPERIENCE.md Interaction Primitives (200ms confirm rule) |

## PRD open questions — UX disposition

| OQ | Question | UX decision |
|---|---|---|
| OQ-1 | Cardio Ghost comparison during live set | Show target pace as live reference; delta post-set. Specced in EXPERIENCE.md Ghost Comparison Patterns. |
| OQ-2 | Cloud backend | Architecture phase — not a UX concern. |
| OQ-3 | Android Bubble across rapid app switches | Engineering concern — not a UX spec item. Note: EXPERIENCE.md specifies "Bubble persists across all foreground apps" as the behavioral requirement. |
| OQ-4 | Mercy Days UX surface | Notification only. No in-app surface beyond notification text. Specced in EXPERIENCE.md State Patterns. |
| OQ-5 | Account deletion data grace window | Architecture/legal — not a UX concern. |

## PRD §2.3 User Journeys coverage

All 4 journeys (UJ-1 through UJ-4) are fully represented in EXPERIENCE.md Key Flows with named protagonist Kenji, climax beats, and edge cases.
