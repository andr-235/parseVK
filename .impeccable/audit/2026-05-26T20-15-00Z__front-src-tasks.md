# Frontend Technical Quality Audit: Tasks & Settings Dashboard

**Target:** `front/src/components/tasks`, `front/src/components/settings`, `front/src/components/common`
**Date:** 2026-05-26T20:15:00Z
**Register:** Product (Operator Console)

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2/4 | Nested interactive elements in `TaskItem.tsx` and lack of focus trap in `TaskDetails.tsx` modal. |
| 2 | Performance | 3/4 | Excellent use of `memo` and `useCallback`, optimized renders with dynamic `useMemo` classes. |
| 3 | Responsive Design | 3/4 | Good viewport fluid layout, but touch targets for actions and close buttons are smaller than 44px. |
| 4 | Theming | 2/4 | Mixing hardcoded Tailwind `slate-*` and `cyan-*` colors with design system variables. |
| 5 | Anti-Patterns | 2/4 | Symmetrical grid layouts, text-decoration highlights, and lingering decorative gradients. |
| **Total** | | **12/20** | **Acceptable (Significant work needed)** |

---

## Anti-Patterns Verdict
**FAIL.** While the dark theme alignment is mostly clean, the implementation still suffers from classic AI-generated slop tells:
1. **Identical card grids with decorative icons** in `SettingsHero.tsx` / `FeatureGridHero.tsx`, which are explicitly banned as a SaaS cliché.
2. **Lingering decorative gradients** (`from-accent-info/20 to-accent-primary/20`) in `SettingsHero.tsx` that violate the "Semantic First Rule".
3. **Word-highlighting styling** (`Задачи <span className="text-accent-info">парсинга</span>`) in hero headers, which creates unnecessary visual noise.

---

## Executive Summary
- Audit Health Score: **12/20** (Acceptable)
- Total issues found: **7** (P0: 1, P1: 3, P2: 2, P3: 1)
- **Top Critical Issues:**
  1. Nested interactive controls inside keyboard-focusable `TaskItem.tsx` card.
  2. Hardcoded non-tokenized colors (`cyan-500/10`, `slate-300`) in `FeatureGridHero.tsx`.
  3. Missing modal ARIA attributes and focus trap in `TaskDetails.tsx`.
- **Recommended Next Steps:**
  1. Fix the a11y keyboard trap and nested button structure in `TaskItem.tsx`.
  2. Implement proper `dialog` accessibility standards and focus-trap hook in `TaskDetails.tsx`.
  3. Purge hardcoded cyan/slate colors from `FeatureGridHero.tsx` and align them with the `DESIGN.md` tokens.

---

## Detailed Findings by Severity

### [P0] Nested Interactive Elements (Accessibility / UX)
- **Location:** [TaskItem.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/tasks/TaskItem.tsx#L114-L202)
- **Category:** Accessibility
- **Impact:** The entire card wrapper has `role="button"`, `tabIndex={0}`, and an `onClick` handler. However, it nests a fully interactive `DropdownMenuTrigger` button and dropdown menu inside itself. Keyboard users and screen readers will experience conflicting click actions, focus traps, or unexpected navigation behavior.
- **WCAG/Standard:** WCAG 2.1 - 4.1.2 Name, Role, Value / HTML Living Standard (Interactive content nested inside interactive controls).
- **Recommendation:** Separate the main card click area from the dropdown action. Provide a clean semantic card structure, and make the button actions focusable independently without nesting them inside an outer button.
- **Suggested command:** `impeccable polish`

### [P1] Missing Modal ARIA & Keyboard Focus Trap (Accessibility)
- **Location:** [TaskDetails.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/tasks/TaskDetails.tsx#L23-L30)
- **Category:** Accessibility
- **Impact:** The modal is rendered as a generic `div` overlay without dialog roles. Screen readers won't recognize it as an overlay modal. Furthermore, there is no focus trap: users can press `Tab` and navigate to elements behind the modal, losing their context entirely.
- **WCAG/Standard:** WCAG 2.1 - 2.1.1 Keyboard / WAI-ARIA Dialog (Modal) Pattern.
- **Recommendation:** Implement a custom React hook to lock focus inside the modal and prevent background scrolling. Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to the root modal container.
- **Suggested command:** `impeccable harden`

### [P1] Non-Tokenized Hardcoded Colors (Theming)
- **Location:** [FeatureGridHero.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/common/FeatureGridHero.tsx#L9-L12)
- **Category:** Theming
- **Impact:** The component uses fallback Tailwind classes like `text-cyan-400`, `bg-cyan-500/10`, and `text-slate-300` directly. This bypasses the design token palette specified in `DESIGN.md` (`command-blue`, `signal-sky`, `text-text-secondary`) and makes it prone to breaking if design-system themes change.
- **WCAG/Standard:** DESIGN.md Section 2 - "The Semantic First Rule".
- **Recommendation:** Replace all hardcoded colors with custom classes or CSS variables defined in the design token map (e.g., `text-accent-info`, `text-text-secondary`).
- **Suggested command:** `impeccable extract`

### [P1] Decorative Gradients & AI Slop Grid (Anti-Patterns)
- **Location:** [SettingsHero.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/settings/SettingsHero.tsx#L14-L63)
- **Category:** Anti-Pattern
- **Impact:** Symmetrical card grids with custom decorative gradient backgrounds (`from-accent-info/20 to-accent-primary/20`) and gradient border classes clutter the SRE workspace. Design system guidelines explicitly discourage decorative colors that compete with real operational states.
- **WCAG/Standard:** DESIGN.md Section 5 - "The Border Before Shadow Rule" & Section 6 - "Don't".
- **Recommendation:** Flatten cards by removing absolute borders/shadows and background gradients. Utilize flat background panels with solid `1px border-border/60` and solid primary icons.
- **Suggested command:** `impeccable quieter`

### [P2] Inadequate Touch Target Sizes (Responsive Design)
- **Location:** [SearchInput.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/common/SearchInput.tsx#L125-L132) & [TaskItem.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/tasks/TaskItem.tsx#L162-L169)
- **Category:** Responsive Design
- **Impact:** The clear button "✕" inside the search input has a dimensions of `h-7 w-7` (28x28px) in the default variant, and the action button in the task item is `h-8 w-8` (32x32px). These sizes are too small to reliably tap on mobile or high-DPI touch devices, leading to misclicks.
- **WCAG/Standard:** WCAG 2.2 - 2.5.8 Target Size (Minimum 44x44px).
- **Recommendation:** Increase touch target area using padding or margins while keeping the visual icon size restrained, or scale the action buttons to at least 44x44px.
- **Suggested command:** `impeccable adapt`

### [P2] Decorative Icons without `aria-hidden` (Accessibility)
- **Location:** [TasksHero.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/tasks/TasksHero.tsx#L124) & [TaskItem.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/tasks/TaskItem.tsx#L144)
- **Category:** Accessibility
- **Impact:** Icons such as `Calendar`, `Clock`, and `Settings` are used next to descriptive text but are not hidden from screen readers. Screen readers may read out the internal SVG markup or read nothing but announce an empty graphic element, adding friction to the interface.
- **WCAG/Standard:** WCAG 2.1 - 1.1.1 Non-text Content.
- **Recommendation:** Add `aria-hidden="true"` to all SVG icons inside components unless they are the sole source of interactive labeling.
- **Suggested command:** `impeccable polish`

### [P3] Plain text multiplication symbol "✕" in Clear Search (Polish)
- **Location:** [SearchInput.tsx](file:///c:/Users/Андрей/Desktop/Разработка/parseVK/front/src/components/common/SearchInput.tsx#L131)
- **Category:** Polish
- **Impact:** The raw "✕" character can be announced by screen readers as "multiplication sign" instead of "clear search input", creating mild user confusion.
- **WCAG/Standard:** WCAG 2.1 - 1.1.1 Non-text Content.
- **Recommendation:** Replace the raw "✕" text symbol with the Lucide `X` icon component and mark it as `aria-hidden="true"`.
- **Suggested command:** `impeccable clarify`

---

## Patterns & Systemic Issues
1. **Interactive Nesting Patterns:** Developers are nesting click targets (Dropdowns, triggers, actions) inside focusable parents. This is a systemic issue across the frontend (e.g., table cells and list rows) and needs a standard layout guide.
2. **Residual Tailwind Hardcodes:** The workspace transition to design variables is about 75% complete, but wrapper components (e.g. `FeatureGridHero`) still bypass the tokens by writing Tailwind default colors like `cyan` and `slate`.

---

## Positive Findings
1. **State Preservation:** The state indicators (`Badge` components for success/failed/running) are robustly implemented with consistent, high-contrast typography and excellent background tints.
2. **Keyboard Events:** Excellent support for accessibility events like `onKeyDown` in `TaskItem` allowing Space/Enter navigation.
3. **Performance Hooks:** Memoization is applied cleanly. Using `useCallback` for event handlers prevents unnecessary re-renders in list items.

---

## Recommended Actions

1. **[P0] `impeccable polish`**: Refactor `TaskItem.tsx` to separate card focusable wrapper from the nested `DropdownMenuTrigger` button. Ensure proper visual border cues are maintained without violating the interactive nesting rules.
2. **[P1] `impeccable harden`**: Update `TaskDetails.tsx` to include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and implement a focus trap hook.
3. **[P1] `impeccable extract`**: Remove fallback `text-cyan-400` / `bg-cyan-500/10` and `text-slate-300` variables from `FeatureGridHero.tsx`, substituting them with standard CSS/Tailwind system design tokens.
4. **[P1] `impeccable quieter`**: Remove gradient wrappers and text accent highlights from `SettingsHero.tsx` and `TasksHero.tsx` to align them with a calm, flat operator watchfloor console.
5. **[P2] `impeccable adapt`**: Increase touch targets to at least 44x44px for the clear search button and dropdown actions.
6. **[P3] `impeccable polish`**: Final styling pass to add `aria-hidden="true"` on SVGs and replace plain text characters with Lucide icons.

---

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/impeccable audit` after fixes to see your score improve.
