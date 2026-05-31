---
target: comments page
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-05-31T04-25-34Z
slug: components-comments
---
## Design Health Score

### Anti-Patterns Verdict

**LLM assessment**: All banned patterns from PRODUCT.md and DESIGN.md are respected. No AI tells.

### Heuristics Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No toast/confirmation on status change |
| 2 | Match System / Real World | 4 | Icons semantically correct, labels accurate |
| 3 | User Control and Freedom | 3 | No Esc for panel close, no undo |
| 4 | Consistency and Standards | 4 | Status colors unified, components consistent |
| 5 | Error Prevention | 2 | No confirmation on batch actions |
| 6 | Recognition Rather Than Recall | 4 | Legend, shortcut hint, dropdown always visible |
| 7 | Flexibility and Efficiency | 3 | Shortcuts present, batch bar present, no sort |
| 8 | Aesthetic and Minimalist Design | 4 | Clean, no visual noise |
| 9 | Error Recovery | 2 | No undo, no draft recovery |
| 10 | Help and Documentation | 2 | No tooltips, no help button |
| **Total** | | **31/40** | **Good** (+8 from previous 23/40) |

### What's Working

1. Keyboard-driven moderation: arrow keys, C/V/R, Space.
2. Batch actions bar with semantic icons (CheckCircle/Flag/HelpCircle).
3. Visual discipline: legend, shortcut hint, focus-visible, aria attributes.

### Priority Issues

**P2. No Esc to close detail panel** � CommentsPage.tsx:75
**P2. No undo for status changes** � CommentsTable.tsx:201-233
**P2. Native select in filters � white popup in dark theme** � comments/filters
**P3. No debounce on search**
**P3. Pagination is static, no real page switching**

### Persona Red Flags

**Sam (Accessibility)**: Status colors are visual-only. Colorblind users cannot distinguish clean from new. Add icon/text indicator alongside color.

**Riley (Stress Tester)**: No test for rapid-fire keyboard shortcuts � potential race condition in setFocusedIndex inside setState updater.

### Minor Observations

- toggleAll useCallback has no dependency � closes stale `filtered` value
- handleKeyDown calls onSelect inside setFocusedIndex updater � works but non-obvious
- tableRef.focus() on mount may steal user focus
