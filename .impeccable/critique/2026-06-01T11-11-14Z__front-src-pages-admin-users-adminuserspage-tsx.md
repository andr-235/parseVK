---
target: front/src/pages/admin-users/AdminUsersPage.tsx
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-06-01T11-11-14Z
slug: front-src-pages-admin-users-adminuserspage-tsx
---
#### Design Health Score


| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4/4 | Loading, error, success states all covered. Minor: no success after delete. |
| 2 | Match System / Real World | 3/4 | Russian labels, clear terminology. "Врем. пароль" standard abbreviation. |
| 3 | User Control and Freedom | 3/4 | Confirmation on all destructive ops; no client-side undo for API mutations. |
| 4 | Consistency and Standards | 4/4 | All three ConfirmActions aligned; edit button text label added; token system. |
| 5 | Error Prevention | 4/4 | ConfirmAction on delete/tempPw/reset; validation on create form. |
| 6 | Recognition Rather Than Recall | 3/4 | All action buttons icon+text; all controls visible. |
| 7 | Flexibility and Efficiency | 2/4 | Arrow handler present but non-functional; no keyboard shortcuts. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Warning palette on security banner; tight padding; no decoration. |
| 9 | Error Recovery | 3/4 | Inline errors with refetch; form state lost on validation error. |
| 10 | Help and Documentation | 1/4 | No tooltips, help, or guidance (systemic, not page-specific). |
| **Total** | | **31/40** | **Good** |

#### Anti-Patterns Verdict

**Pass.** Consistent token usage, proper state handling, shared component reuse. The interface reads as intentional product work.

**Deterministic scan**: Bundle detector not available.

#### What Improved Since Last Critique

- Password operations now require confirmation with consequence explanation
- Temp password banner uses correct warning palette
- Edit button has visible text label ("Ред.")
- Success feedback after create/update operations
- Focus management: table container focused after create/edit
- All ConfirmActions use consistent showIcon styling
- Page padding tightened from p-6 to p-4
- Password status reads "Постоянный" instead of "ОК"

#### Remaining Issues

**P3 — Arrow key handler prevents default but does not navigate**
The `handleKeyDown` prevents ArrowUp/ArrowDown default but provides no row focus movement.

**P3 — No keyboard shortcuts (Esc to cancel, Enter to submit)**
Users must click buttons even for repeated actions. A power-user path is missing.

**P3 — No help/documentation**
No tooltips, inline guidance, or help links. Systemic across the app.

**P3 — Form state lost on validation error**
If the API returns an error during create, the form keeps its values (actually, CreateRow does NOT reset form on error — the `onError` only sets `error` state). This is correct behavior. But EditRow also preserves values on error. So this is fine.
