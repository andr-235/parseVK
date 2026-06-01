---
target: front/src/pages/admin-users/AdminUsersPage.tsx
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-01T10-59-18Z
slug: front-src-pages-admin-users-adminuserspage-tsx
---
#### Design Health Score


| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Loading/error states clear; no success feedback after create/update |
| 2 | Match System / Real World | 3/4 | Russian labels, clear terminology; "Врем. пароль" abbreviation slightly cryptic |
| 3 | User Control and Freedom | 3/4 | Cancels on create/edit/delete; no undo, no recovery after destructive actions |
| 4 | Consistency and Standards | 3/4 | Shared design tokens, TableHead reuse; action button mix of icon-only and icon+text |
| 5 | Error Prevention | 3/4 | Delete confirmation, create validation; password reset executes without confirmation |
| 6 | Recognition Rather Than Recall | 3/4 | Visible search/filter/sort; edit button icon-only with no visible label |
| 7 | Flexibility and Efficiency | 2/4 | Arrow key handler exists but does nothing; no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean, token-correct; TempPasswordBanner uses green for security state |
| 9 | Error Recovery | 3/4 | Inline errors with refetch; form state lost on validation error |
| 10 | Help and Documentation | 1/4 | No tooltips, no help, no guidance for admin operations |
| **Total** | | **27/40** | **Acceptable** |

#### Anti-Patterns Verdict

**Pass — Not AI-generated.** The interface follows the project's design system consistently. Semantic color usage, proper ARIA attributes, inline editing patterns, and shared component reuse signal intentional engineering rather than generated output. The product register familiarity (admin table = expected) works in its favor.

**Deterministic scan**: Bundle detector not available in this environment. Manual review only.

#### Overall Impression

A clean, functional admin page that does the job without ceremony. The token system is applied correctly, states are handled (loading, empty, error, data), and the inline create/edit pattern avoids modals. The biggest gaps are around safety for sensitive operations (password reset, temp password generation) and accessibility (announced keyboard nav that doesn't work).

#### Priority Issues

**P1 — Password operations (Врем. пароль, Сброс) execute without confirmation**
Why: "Врем. пароль" exposes a plaintext password; "Сброс" invalidates the current password, locking the user out. Neither has a confirmation step.
Fix: Add ConfirmAction or inline prompt explaining consequences.
Suggested command: `harden`

**P1 — TempPasswordBanner uses success green for a security-sensitive state**
Why: Green signals "all good" but a temporary password is a security event requiring attention. Color contradicts meaning.
Fix: Use warning palette (`warning`/`warning-soft`) instead of success.
Suggested command: `polish`

**P2 — role="grid" announced but arrow keys don't navigate rows**
Why: WCAG 2.1.1 Keyboard violation. Screen reader users are told to expect grid navigation but get nothing.
Fix: Implement actual arrow key row focus, or demote to `role="table"`.
Suggested command: `harden`

**P2 — Edit button is icon-only in a row of text-labeled buttons**
Why: Discoverability suffers. User must hover or rely on aria-label to identify the action. All 3 sibling buttons have text.
Fix: Add text label like "Ред." to match the pattern.
Suggested command: `polish`

**P2 — No success feedback after create/update**
Why: Action completes silently. Inline editing reverts to view mode with no confirmation the save went through.
Fix: Brief inline indicator or temporary banner confirming the action.
Suggested command: `polish`

**P3 — Password reset has no warning about consequences**
Why: "Сброс" invalidates the current password permanently. Admin may not realize the user will be locked out.
Fix: Inline warning or confirmation text explaining the impact.
Suggested command: `clarify`

**P3 — TempPasswordBanner disappears permanently after close**
Why: Once dismissed, the password is unrecoverable without calling the API again.
Fix: Confirm before close, or store in state for re-display.
Suggested command: `harden`

#### Persona Red Flags

**Alex (Power User)**:
- Arrow key handler present but non-functional — wasted expectation
- No keyboard shortcuts (Esc, Enter) for form actions
- Single-user-at-a-time editing limits efficiency

**Sam (Accessibility-Dependent User)**:
- `role="grid"` with no functional keyboard nav — announced capability doesn't exist
- Focus lost after create/delete — no programmatic focus management
- `focus-visible:outline-none` on table container removes visible focus ring; should use `focus-visible:ring-2 focus-visible:ring-accent`

#### Minor Observations
- `canEdit` logic allows only one edit at a time — intentional but unstated constraint
- CreateRow `items-end` alignment places labels at different visual levels
- `ОК` status for normal password is terse; "Постоянный" would be clearer
- Page padding `p-6` is generous for data-density; `p-4` would match table density better

#### Questions to Consider
- Is this page for daily operations or occasional config? Answer changes how much confirmation is needed.
- What if temp password generation showed an inline preview with a "Copy & close" action?
- Could secondary actions (Сброс, Врем. пароль) be grouped under a `···` menu to reduce visual noise?
