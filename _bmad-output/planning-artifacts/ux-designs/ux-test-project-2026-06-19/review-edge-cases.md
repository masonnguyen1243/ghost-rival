# Edge-Case Review — Ghost Rival

**Cases examined:** 57 | **Handled:** 10 | **Partial:** 11 | **Gaps:** 36 | **Critical gaps:** 7

---

## Category 1: First-use / zero-state

| Case | Spine coverage | Gap? |
|---|---|---|
| First exercise ever created | Empty state specced on Home | No |
| First session ever (no Ghost exists) | "No ghost yet" placeholder specced | No |
| First PR ever | PR Explosion specced | No |
| First time Floating Bubble permission requested | Permission opt-in flow specced | No |
| Ghost Type Selector with only 1 session ever | All 3 types resolve to identical data — no collapse/dedup behavior | Yes (medium) |
| Hall of Fame tab with 0 PRs | Empty state specced | No |

---

## Category 2: Boundary cases

| Case | Spine coverage | Gap? |
|---|---|---|
| Session ends with 0 sets logged | Not specced — no content for Summary, Ghost creation undefined | **Critical** |
| Exercise deleted while session is active | Not covered | Yes (high) |
| 20+ exercises in one session | No scroll/performance guidance | Yes (low) |
| Weight = 0 or negative | Not specced — validation rules absent | Yes (high) |
| Reps = 0 | Not specced | Yes (high) |
| **Swipe-to-delete a set within 30s edit window that triggered a PR** | Hall of Fame written at detection time; no rollback mechanism specified | **Critical** |
| Exercise renamed after PR — Hall of Fame entry references old name | Not specced | Yes (medium) |

---

## Category 3: Interruption cases

| Case | Spine coverage | Gap? |
|---|---|---|
| Phone call during session | Draft auto-save handles; Bubble/Live Activity behavior not specified during call | Yes (medium) |
| Battery dies mid-session | Draft recovery handles session; Hall of Fame partial writes not addressed | Yes (medium) |
| App update pushed mid-session | Not addressed | Yes (low) |
| User changes kg→lb setting mid-session | Sets in current session use original unit; no conversion or normalization on unit change specified | Yes (high) |
| **Draft resume after kg→lb unit change between sessions** | Stored draft in kg; displayed in lb with no conversion note | **Critical** |
| User switches language mid-session | Not applicable (single language product) | N/A |

---

## Category 4: Async / timing cases

| Case | Spine coverage | Gap? |
|---|---|---|
| **PR detected at exact moment app is force-closed** | Draft recovery restores session but does not re-run PR detection on recovered sets; PR silently lost | **Critical** |
| Two PRs detected in same set (weight + volume simultaneously) | "Multiple PR types can trigger from a single Set; all are recorded" — but unclear if one or two Hall of Fame entries are written | Yes (medium) |
| **Rest Timer reaches zero while PR Explosion is blocking input** | PR Explosion blocks all input; Rest Timer signal fires into blocked UI; user misses timer entirely with no recovery | Yes (high) |
| PR Explosion dismissed; Infinite Goal chip appears; immediately another PR logged on same exercise | Second PR on same metric in same session suppressed (specced); chip update behavior not addressed | Yes (low) |

---

## Category 5: Ghost data cases

| Case | Spine coverage | Gap? |
|---|---|---|
| User logged more sets than Ghost had | "Ghost ended here — shown as '—'" specced | No |
| Last Week and Last Month Ghost are the same session | No deduplication or UX callout specified | Yes (medium) |
| All-Time PR Ghost is from a soft-deleted session | Ghost data retained (soft-delete keeps data); behavior on Exercise deletion specced | Partial |
| **Ghost references the in-progress session itself** | After first set of a new exercise, "Last Session" type would reference current session — violates assumption Ghosts are always past | **Critical** |
| No sessions in last 7 days — Last Week Ghost shows placeholder | "No ghost yet" placeholder specced | No |

---

## Category 6: Platform edge cases

| Case | Spine coverage | Gap? |
|---|---|---|
| **Android SYSTEM_ALERT_WINDOW revoked mid-session** | Bubble disappears; notification fallback may not auto-activate; no specified degradation path | **Critical** |
| Android device enters split-screen during session | Floating Bubble behavior in split-screen undefined | Yes (medium) |
| iOS Live Activity relegated to "minimal" (icon-only) by competing Live Activity | Rest timer disappears; no fallback to notification | Yes (high) |
| iOS Dynamic Island unavailable (older device) — lock screen only | Specced | No |
| Android predictive back gesture during PR Explosion | Unclear if blocked; could trigger End Workout modal stacked on top of overlay | Yes (high) |
| Floating Bubble appears over another app's fullscreen video | Permission model doesn't address this; potential UX conflict | Yes (low) |

---

## Category 7: Sync / offline cases

| Case | Spine coverage | Gap? |
|---|---|---|
| PR detected offline; user goes online before session ends | Sync queues; no duplicate PR risk addressed for this window | Yes (medium) |
| **Stale PR after multi-device sync** | PR celebrated on Device A against stale Ghost; after sync with Device B's newer data, PR may be phantom — no re-evaluation mechanism | **Critical** |
| Session synced from two devices simultaneously | "Most recent write wins per Set" specced; session-level conflict not addressed | Yes (medium) |
| Hall of Fame entry from offline PR, synced after a same-exercise PR on Device B | Ordering and deduplication not specced | Yes (medium) |

---

## Summary

| Severity | Count |
|---|---|
| Critical | 7 |
| High | 7 |
| Medium | 10 |
| Low | 4 |
| **Total gaps** | **28** |

### 7 Critical gaps (require spine update before implementation)

1. **Swipe-to-delete within 30s edit window post-PR** — phantom Hall of Fame entries, no rollback
2. **PR at exact app force-close** — draft recovery doesn't re-run PR detection; silent PR loss
3. **Stale PR after multi-device sync** — phantom PRs accumulate permanently
4. **0-set session end** — undefined Summary content; potential 0-value Ghost creation
5. **Draft resume after unit change (kg→lb)** — stored values in wrong unit with no conversion
6. **Ghost referencing in-progress session** — "Last Session" type on first set of new exercise in current session
7. **SYSTEM_ALERT_WINDOW revoked mid-session** — Bubble disappears, fallback doesn't auto-activate
