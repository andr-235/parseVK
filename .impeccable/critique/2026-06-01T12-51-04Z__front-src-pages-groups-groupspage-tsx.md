---
target: front/src/pages/groups/GroupsPage.tsx
total_score: 30
p0_count: 0
p1_count: 1
p2_count: 2
timestamp: 2026-06-01T12-51-04Z
slug: front-src-pages-groups-groupspage-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 3/4 | Loading/error/feedback all handled. No "N groups" count summary. |
| 2 | Match System / Real World | 4/4 | Russian labels, VK-native concepts (screenName, type), familiar table UX |
| 3 | User Control and Freedom | 3/4 | ConfirmAction on delete, reset/search clear. No undo after delete. |
| 4 | Consistency and Standards | 4/4 | Matches AuthorsPage 1:1 — PageShell, TableHead, feedback, export patterns |
| 5 | Error Prevention | 3/4 | ConfirmAction guards delete. Batch delete fires without per-item confirm. |
| 6 | Recognition Rather Than Recall | 3/4 | All actions visible. No tooltips on truncated content. |
| 7 | Flexibility and Efficiency | 2/4 | Batch delete exists. No keyboard shortcuts. No cross-page selection. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean table, purposeful color, no decorative clutter |
| 9 | Error Recovery | 3/4 | Retry on error, feedback banner. Generic messages ("Ошибка удаления"). |
| 10 | Help and Documentation | 1/4 | No contextual help, no tooltips, no docs link. Acceptable for admin tool. |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**Pass — not AI-generated.** The page is a deliberate copy of AuthorsPage, which is consistency, not slop. Custom design tokens (oklch), Russian copy, VK-specific data model, and standard table affordances place it firmly in the product register.

**Deterministic scan**: Unavailable (bundled detector missing at .agents/skills/impeccable/scripts/detector/detect-antipatterns.mjs).

### Overall Impression

Solid, predictable page that does exactly what it needs to. No surprises, no friction. The single biggest opportunity is adding power-user accelerators (keyboard shortcuts, inline editing, bulk operations beyond delete).

### What's Working

1. **Consistent page architecture.** PageShell + TableHead + TableShell + PaginationBar is the same structure as AuthorsPage.
2. **Clear destructive action guard.** ConfirmAction on delete with a cancel option prevents accidental data loss.
3. **Feedback loop.** Success/error banner with auto-dismiss (3s) after mutations gives clear closure. Dual role="alert" + color coding serves both visual and screen reader users.

### Priority Issues

- **[P1] No keyboard shortcuts.** Operators review groups in batches. Having to click "Удалить" → confirm → move to next row is 3 clicks per item. Keyboard shortcuts would save hundreds of clicks per shift.
- **[P2] No undo after delete.** The action is permanent after confirm. A brief undo toast would catch misclicks.
- **[P2] No select-all across pages.** Selection resets when navigating pages. Operators managing 500+ groups can only batch-operate on 25 at a time.
- **[P3] Generic error messages.** "Ошибка удаления" doesn't tell the user what went wrong.
- **[P3] No total count visible.** No "Всего групп: N" summary line for quick dataset size scan.

### Persona Red Flags

**Alex (Power User):** No keyboard shortcuts for delete, search, or pagination. No cross-page selection. Export is current filtered view only.

**Sam (Screen Reader User):** No aria-live="polite" for dynamic content updates. colSpan values in error state may not match rendered column count.

**Elena (Operator-Analyst):** Reviews 100+ groups daily. No "mark as reviewed" action — only destructive delete. City/type data present in the model but not exposed as filter controls.

### Minor Observations

- Type column shows English codes ("group", "page", "event") — mixed with Russian UI.
- Empty state "Нет групп" could hint at how to add groups.
- colSpan={columns.length + 1} in error state may be off by 1.
