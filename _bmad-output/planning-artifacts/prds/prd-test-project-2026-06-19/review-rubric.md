# PRD Quality Review — Ghost Rival

## Overall verdict

Solid, decision-ready PRD for an indie solo-dev launch — the thesis is clear, the Ghost mechanic is coherent throughout, and the scope is honest. No critical blockers. One high-severity gap (Cardio live-Ghost comparison left entirely open) and two medium gaps should be resolved before UX spec / architecture work begins. All three are fixable in place without restructuring.

## Decision-readiness — adequate

The PRD states trade-offs honestly: Android-first if deadline forces a cut, local-only fallback, no manual goal override in MVP. Open Questions are real open questions (not rhetorical). The Assumptions Index is complete.

### Findings
- **high** Cardio live-Ghost comparison left entirely open (§11 Q1 / §4.4 FR-11) — The problem is correctly flagged but leaves UX spec and architecture unable to proceed on Cardio Ghost. A provisional call is needed. *Fix:* Add [ASSUMPTION] to FR-11: "Show Ghost target pace as a live reference during the Cardio Set; compare actual pace post-Set completion."

## Substance over theater — strong

The Ghost mechanic drives every FR. No persona theater (Kenji appears in 4 UJs and drives real decisions). Competitive positioning is earned from research, not asserted. NFRs have product-specific thresholds (200ms, 3s cold start, 2% battery).

## Strategic coherence — strong

Clear thesis: the best gym tracker is the one that disappears. Features follow from it (Floating Bubble, Ghost, no social, dark UI). Success Metrics validate the thesis (SM-C1 counterbalances activity metrics). MVP scope coheres — experience-first, not feature-list.

## Done-ness clarity — adequate

Most FRs have testable consequences. Two gaps:

### Findings
- **medium** Rest Timer per-Exercise configurability scope unclear (§4.2 / FR-7) — "Configurable per Exercise in settings" does not specify where in MVP the config lives (Exercise detail screen? Global settings only?). A developer reading this could punt it to a future sprint. *Fix:* Clarify "accessible from Exercise detail screen in MVP" or move per-Exercise config to §6.2.
- **medium** Infinite Goal Engine edge cases (plateau, rapid beginner gains) are in addendum only (§4.6 / FR-16) — Developer reading only the PRD will not know the goal display can go stale or project unrealistically. *Fix:* Add cross-reference to FR-16: "Known edge cases: see addendum §Infinite Goal Engine."

## Scope honesty — strong

Non-Goals section is load-bearing. `[ASSUMPTION]` tags are used precisely and all indexed. `[NOTE FOR PM]` callouts at real tensions (Watch integration, goal override). De-scoping is explicit.

## Downstream usability — strong

Glossary is complete; terms are used consistently throughout. FR/UJ/SM IDs are contiguous and cross-references resolve. Named protagonists in all UJs. §3 Glossary provides clean extraction anchor for UX and architecture work.

## Shape fit — strong

Consumer mobile app with meaningful UX → UJ-led shape is correct. Four UJs cover the critical paths without over-formalizing. Indie launch calibration is appropriate — not over-engineered for enterprise, not under-specified for the build.

## Mechanical notes

- Glossary drift: none detected. "Ghost," "Session," "Set," "PR," "Floating Bubble," "Live Activity" all used consistently.
- ID continuity: FR-1 through FR-22 contiguous. UJ-1 through UJ-4 present with named protagonists. SM-1 through SM-5 plus SM-C1 and SM-C2 all defined and cross-referenced.
- Assumptions Index roundtrip: all 11 inline `[ASSUMPTION]` tags appear in §12 and vice versa.
- No unresolved cross-references found.
