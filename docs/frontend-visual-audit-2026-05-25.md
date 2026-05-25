# Frontend visual audit, Impeccable opportunities

Issue: #215
Date: 2026-05-25
Scope: documentation-only audit, no runtime frontend or backend changes.

## Method

This audit inspected the current React frontend implementation and route structure, with emphasis on the screens named in the issue. The source note referenced by the issue, `parsevk-notes/ideas/frontend/2026-05-25-impeccable-visual-improvements.md`, was not present in this checkout, so findings below are based on the local codebase.

No live production data was used. The findings are code-level visual and UX observations against Impeccable product-register expectations: task-focused app UI, restrained visual system, predictable controls, complete states, accessibility, responsive behavior, dark mode, and visual hierarchy.

## Inspected Screens

| Area | Routes / files inspected | Notes |
|---|---|---|
| App shell and navigation | `front/src/App.tsx`, `front/src/shared/components/Sidebar/*`, `front/src/shared/components/MainContent.tsx` | Authenticated shell, sidebar sections, route lazy loading, forced dark mode. |
| Dashboard / overview proxy | `/tasks`, `front/src/modules/tasks/components/*` | The app redirects root to `/tasks`, so Tasks is the current operational overview. |
| Monitoring messages | `/monitoring/:sourceKey`, `front/src/modules/monitoring/components/MonitoringPage.tsx`, `MonitoringMessagesCard.tsx` | Search, filters, stats, message feed, refresh states. |
| Monitoring groups | `/monitoring/:sourceKey/groups`, `MonitoringGroupsPage.tsx`, `MonitoringGroupsHero.tsx` | Add/edit form, filters, table, empty/error/loading states. |
| Metrics / system health | `/metrics`, `front/src/modules/metrics/components/MetricsPage.tsx` | System metrics cards, refresh, loading/error states. |
| Friends export / job progress | `/vk/friends-export`, `/ok/friends-export`, `front/src/modules/*FriendsExport/components/*` | Export forms, circular progress, warning/error/log states. |

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|---:|---:|---|
| 1 | Accessibility | 2/4 | Some labels and ARIA exist, but decorative motion, icon-only controls, clickable table rows, and custom state regions need a pass. |
| 2 | Responsive design | 2/4 | Layouts use responsive grids, but several dense forms, hero actions, tables, and log panels risk cramped mobile behavior. |
| 3 | Loading, error, empty states | 2/4 | States exist, but quality is uneven: Metrics has bare centered text, monitoring has basic placeholders, exports handle logs better. |
| 4 | Dark mode and theming | 2/4 | Dark mode is forced in `App.tsx`; tokens exist, but many screen-level colors bypass shared tokens. |
| 5 | Visual hierarchy and anti-patterns | 1/4 | The dominant neon/glass/gradient treatment makes task screens feel heavier than the data work requires. |
| Total | | 9/20 | Poor: usable structure exists, but visual system consolidation should come before broad polish. |

## Anti-Patterns Verdict

The current frontend does read as AI-generated in several high-traffic areas. The strongest tells are repeated cyan/blue/purple gradients, glow borders, blur-heavy cards, animated section entrances, floating sidebar particles, and repeated four-card hero metric grids. These patterns appear in the sidebar, Tasks, Monitoring, Monitoring Groups, VK export, and OK export.

This is not only cosmetic. The treatment competes with the operational content: status, filtering, logs, tables, and task progress are harder to scan because decoration has nearly the same visual weight as user data.

## Priority Findings

### P1: Product shell has too much decorative motion and atmosphere

Location: `front/src/shared/components/Sidebar/Sidebar.tsx:134`, `front/src/shared/components/Sidebar/Sidebar.tsx:144`, `front/src/shared/components/Sidebar/Sidebar.tsx:270`

Category: Visual hierarchy, performance, accessibility

Impact: The sidebar is a persistent navigation surface, but it includes grid overlay, floating particles, animated section entrances, and hover gradients. In a product UI, persistent navigation should reduce cognitive load. The current treatment adds peripheral motion and makes the shell feel less stable than the task surfaces it supports.

Recommendation: Replace decorative sidebar motion with a quieter token-driven shell: one sidebar surface, clear active states, stable section disclosure, and no ambient particle animation. Keep icons and badges, but make them serve navigation state only.

### P1: Screen-level styling bypasses the shared design system

Location: `front/src/index.css:8`, `front/src/index.css:23`, `front/src/index.css:192`, `front/src/modules/tasks/components/TasksHero.tsx:72`, `front/src/modules/monitoring/components/MonitoringPage.tsx:106`, `front/src/modules/vkFriendsExport/components/VkFriendsExportPage.tsx:49`

Category: Theming, visual hierarchy

Impact: The app has tokens and shared UI primitives, but major screens repeatedly use direct `slate`, `cyan`, `blue`, `purple`, `white/10`, `backdrop-blur-2xl`, and gradient classes. This makes dark mode, contrast, and future component polish harder because the visual system is duplicated per screen.

Recommendation: Define a restrained product surface vocabulary in shared components or tokens: page section headers, panel, metric tile, action row, table panel, status callout. Screen-specific components should compose those primitives instead of recreating glass cards.

### P1: Metrics / system health is visually underdeveloped compared with newer screens

Location: `front/src/modules/metrics/components/MetricsPage.tsx:30`, `front/src/modules/metrics/components/MetricsPage.tsx:38`, `front/src/modules/metrics/components/MetricsPage.tsx:61`

Category: Loading/error/empty states, hierarchy, responsive design

Impact: Metrics is likely an operational health screen, but it has bare centered loading/error text and plain cards. It lacks severity grouping, stale-data signaling, quick scan hierarchy, and meaningful empty/degraded states. Compared with Monitoring, it feels like a different product.

Recommendation: Redesign Metrics as a compact system health view: top status strip, grouped service metrics, latency/error emphasis, last refreshed timestamp, degraded/error state panel, and mobile-friendly card ordering.

### P1: Monitoring message cards use a side-stripe accent and dense mixed metadata

Location: `front/src/modules/monitoring/components/MonitoringMessagesCard.tsx:180`, `front/src/modules/monitoring/components/MonitoringMessagesCard.tsx:243`, `front/src/modules/monitoring/components/MonitoringMessagesCard.tsx:266`

Category: Anti-pattern, accessibility, hierarchy

Impact: Each message card has a colored left stripe, multiple badges, uppercase microcopy, metadata, highlighted text, media previews, and animated entrance. The stripe pattern is explicitly discouraged by Impeccable, and the metadata hierarchy can overwhelm the actual message content.

Recommendation: Rework message cards around content-first hierarchy: source and time in a quiet header, message text as the primary object, attachments as secondary, and keyword matches as controlled inline emphasis. Remove the side stripe and reduce uppercase/tracking-heavy badges.

### P2: Monitoring groups form and table need a task-density pass

Location: `front/src/modules/monitoring/components/MonitoringGroupsPage.tsx:85`, `front/src/modules/monitoring/components/MonitoringGroupsPage.tsx:168`, `front/src/modules/monitoring/components/MonitoringGroupsPage.tsx:242`

Category: Responsive design, accessibility, hierarchy

Impact: Add/edit group form, filters, table, and actions all sit on one page with similar visual weight. On smaller viewports, form fields, filter controls, and action buttons can become vertically heavy, while destructive actions remain visually close to edit actions.

Recommendation: Split the page into a clear management pattern: compact inline create/edit panel, sticky or grouped filters, table actions with icon tooltips, and stronger confirmation affordance for delete.

### P2: Friends export screens duplicate layout and miss clearer job-state hierarchy

Location: `front/src/modules/vkFriendsExport/components/VkFriendsExportPage.tsx:39`, `front/src/modules/vkFriendsExport/components/VkFriendsExportPage.tsx:105`, `front/src/modules/okFriendsExport/components/OkFriendsExportPage.tsx:39`, `front/src/modules/okFriendsExport/components/OkFriendsExportPage.tsx:139`

Category: Visual hierarchy, loading/error/empty states

Impact: VK and OK export screens are structurally similar, but their job progress area treats progress, warnings, errors, and logs as peer blocks. Users need a stronger sequence: current job state, next action, issue if any, then detailed logs.

Recommendation: Extract a shared export job panel design in a future implementation task. Use a status header, determinate/indeterminate progress, warning/error callout hierarchy, and log stream with timestamps aligned for scanning.

### P2: Forced dark mode blocks real dark-mode validation

Location: `front/src/App.tsx:89`, `front/src/index.css:91`

Category: Dark mode and theming

Impact: The app always adds the `dark` class and defines dark-first tokens. That is acceptable if the product intentionally supports only dark mode, but it means "dark mode" is not a mode, it is the only theme. Light theme regressions and token mismatches cannot be meaningfully tested.

Recommendation: Document the product decision as dark-only, or introduce an explicit theme mode. If dark-only stays, rename the validation target to "dark theme quality" and remove unused light-mode assumptions from future tasks.

### P2: Page animation is repeated across core task flows

Location: `front/src/modules/tasks/components/TasksPage.tsx:49`, `front/src/modules/monitoring/components/MonitoringPage.tsx:98`, `front/src/modules/monitoring/components/MonitoringPage.tsx:298`, `front/src/modules/monitoring/components/MonitoringGroupsPage.tsx:77`

Category: Performance, accessibility, visual hierarchy

Impact: Staggered `animate-in` sections make the app feel busy during routine operations. Users returning to monitoring or tasks are not helped by repeated page choreography, especially when data also updates or refreshes.

Recommendation: Keep motion for state changes only: refresh, row insert, progress update, expand/collapse. Remove load-in choreography from recurring operational screens or gate it behind reduced-motion behavior.

### P3: Empty and loading states should be standardized

Location: `front/src/shared/components/LoadingState.tsx:17`, `front/src/shared/components/EmptyState.tsx:25`, `front/src/modules/metrics/components/MetricsPage.tsx:30`, `front/src/modules/monitoring/components/MonitoringMessagesCard.tsx:203`

Category: Loading/error/empty states

Impact: Shared states exist, but screens still use custom text-only or dashed-card placeholders. Users get inconsistent feedback about whether a screen is loading, empty, filtered empty, failed, or waiting for first action.

Recommendation: Standardize state components for `loading`, `error`, `empty`, `filtered-empty`, and `offline/stale`. Include primary recovery actions where useful: refresh, clear filters, create group, start export.

## Positive Findings

- The route structure is understandable and covers the expected operational areas: tasks, monitoring messages, monitoring groups, metrics, VK export, and OK export.
- Several screens already distinguish loading, error, empty, and content states, especially monitoring groups and friends export.
- Shared UI primitives exist under `front/src/shared/ui`, and shared state components exist under `front/src/shared/components`.
- Tables use horizontal overflow wrappers in several places, reducing immediate desktop-to-mobile breakage.
- Export pages expose warnings, errors, progress, and logs in one workflow, which is a good basis for a more polished job panel.

## Recommended First UI Tasks

1. `docs/ui-shell`: Audit and redesign app shell/navigation visual system.
   - Scope: `Sidebar`, `MainContent`, shared page spacing, active nav states.
   - Goal: remove decorative motion/glow from persistent navigation, align shell with restrained product UI, document dark-only vs theme-mode decision.

2. `feat(metrics-ui)`: Redesign Metrics / system health screen.
   - Scope: `/metrics` only.
   - Goal: create a real operational health screen with status hierarchy, stale data, loading/error/empty states, and responsive grouping.

3. `feat(monitoring-feed-ui)`: Rework Monitoring messages and groups scanability.
   - Scope: `/monitoring/:sourceKey` and `/monitoring/:sourceKey/groups`.
   - Goal: simplify message cards, remove side-stripe treatment, improve search/filter density, clarify empty/error states, and tighten mobile behavior.

Friends export can follow as a fourth task if the team wants a lower-risk shared component extraction: both VK and OK screens have near-identical job-panel needs.

## Validation

- Manual review of this audit document is the relevant validation for #215.
- Automated frontend checks are not applicable to this docs-only change because no runtime TypeScript, CSS, tests, build configuration, or backend code changed.
