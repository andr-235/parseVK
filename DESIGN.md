# parseVK Design Baseline

## Design Intent

parseVK is a dense operator console for intelligence, monitoring, exports, tasks, statuses and logs. The interface should make complex data feel ordered and inspectable. Design decisions should improve scanning, comparison, triage and safe action.

The default register is product UI. Avoid marketing composition, oversized hero treatment and decorative card grids. A page can have presence, but its first job is to keep operators oriented.

## Visual Principles

- Dense but readable: prefer compact tables, grouped controls and clear row rhythm over sparse presentation layouts.
- Dark mode parity: dark surfaces are first-class and must preserve contrast, focus visibility and semantic status colors.
- Semantic status first: reserve strong color for state, severity, progress, destructive action and important deltas.
- Restrained decoration: shadows, glass effects, gradients and illustration should never reduce legibility or scan speed.
- Predictable workflows: filters, bulk actions, exports, pagination, progress and details should remain in familiar places.
- Clear states: every empty, loading, error, partial and success state should explain scope and next action.

## Current Token Baseline

The current frontend uses CSS variables in `front/src/index.css` and Tailwind mappings in `front/tailwind.config.ts`. Keep future token changes compatible with these names unless a task explicitly migrates the system.

### Color

Core surfaces:

- `--background`, `--bg-primary`: `#0b1220`
- `--card`, `--bg-secondary`: `#111827`
- `--sidebar`, `--bg-sidebar`: `#0f172a`
- `--border`, `--border-color`: `#1f2937`
- `--foreground`, `--text-primary`: `#e5e7eb`
- `--muted-foreground`, `--text-secondary`: `#94a3b8`

Semantic colors:

- Primary action: `--primary`, `--accent-primary`: `#3b82f6`
- Info: `--accent-info`: `#38bdf8`
- Success: `--accent-success`: `#22c55e`
- Warning: `--accent-warning`: `#f59e0b`
- Danger/destructive: `--destructive`, `--accent-danger`: `#ef4444`

Guidance:

- Use semantic colors consistently across badges, task states, alerts and progress indicators.
- Do not introduce a new saturated accent for one screen unless it maps to a reusable state or product area.
- Keep data visualization colors distinguishable in dark mode and avoid relying on hue alone.

### Spacing

Use compact, predictable increments:

- `4px`: tight icon or text gaps.
- `8px`: control internals, small groups and row affordances.
- `12px`: form rows, compact panels and table toolbar groups.
- `16px`: standard section rhythm and card internals.
- `24px`: page-level grouping.
- `32px`: major page separation.

Avoid uniform padding everywhere. Dense operational screens need tighter controls near data and more air around page boundaries.

### Radius

Current variables include `--radius: 0.75rem` and `--card-border-radius: 20px`. Use radius intentionally:

- Small controls and badges: `6px` to `8px`.
- Inputs, selects and buttons: `8px` to `12px`.
- Repeated panels and cards: prefer `12px` to `16px`; use `20px` only where the existing component already requires it.
- Data rows, table cells and status chips should not look softer than the workflow demands.

### Typography

Current font families:

- Display: `Outfit`, `Space Grotesk`, sans-serif.
- Body: `Outfit`, `IBM Plex Sans`, sans-serif.
- Mono accents: `JetBrains Mono`, monospace.

Guidance:

- Use body sizes that support long sessions: `14px` to `16px` for most UI, smaller only for metadata.
- Reserve large headings for page identity, not repeated cards.
- Use mono sparingly for IDs, counters, timestamps, technical codes and logs.
- Keep body line length around 65 to 75 characters in prose-heavy areas.

### Focus, Input and Keyboard States

- Focus rings must be visible on dark surfaces. Use the existing `--ring` or `--accent-primary` family.
- Keyboard navigation must expose the active row, focused control and selected state separately.
- Inputs should preserve contrast in normal, hover, focus, disabled and validation states.
- Error text should be adjacent to the field or action that caused it.

### Motion

- Motion should clarify progress, expansion, sorting, navigation or refresh.
- Respect reduced motion: disable nonessential transitions and animations under `prefers-reduced-motion`.
- Do not animate layout-heavy properties when transform or opacity can communicate the same change.
- Loading states should feel steady, not flashy.

## Component Patterns

### Tables and Lists

- Tables are the default for comparable entities: authors, groups, comments, tasks, exports and admin users.
- Keep row height compact but touch-safe where mobile or tablet use is plausible.
- Sort, filter and bulk actions should remain close to the data they affect.
- Sticky headers, selected rows and virtualized lists should preserve context during long scans.

### Statuses and Badges

- Status color must match meaning across modules.
- Pair color with text, icon or shape when the state is important.
- Queued, running, completed, failed, stale, warning and disabled states need distinct visual treatments.
- Avoid decorative badges that do not carry operational meaning.

### Empty, Loading and Error States

- Empty states should name the scope: filters, source, task, group or export.
- Loading states should indicate whether data is initial, refreshing or partially stale.
- Error states should include recovery actions when available: retry, clear filters, reconnect, reopen task or inspect logs.
- Long-running tasks need progress, last update and failure context.

### Cards and Panels

- Use cards for repeated entities, modals and genuinely framed tools.
- Avoid nested cards and decorative card grids.
- Prefer unframed page sections or full-width bands for page structure.
- Glassmorphic utilities exist, but use them only when they improve layering without hurting contrast.

### Navigation and Page Structure

- Sidebar navigation should keep product areas stable and predictable.
- Page headers should identify the current area and expose the most common action.
- Detail panels should preserve the parent context and avoid dead ends.
- Mobile layouts should collapse controls without hiding core task state.

## Impeccable Workflow

Before changing concrete screens, load this context through Impeccable. Treat `PRODUCT.md` as the product contract and this file as the design contract.

- `teach`: use when product purpose, users, voice or strategic principles changed.
- `document`: use after frontend tokens, shared components or visual patterns changed enough that this baseline is stale.
- `audit`: use for accessibility, responsiveness, performance, reduced motion and production-readiness checks.
- `critique`: use for UX review of a screen, flow or component before deciding what to change.
- `layout`: use when the main problem is hierarchy, spacing, density, alignment or scan path.
- `polish`: use after implementation to catch copy, states, focus, hover, responsive and edge-case issues.
- `extract`: use when repeated styles or UI structures should become shared tokens or components.
- `live`: use for browser-backed visual iteration on a concrete screen.

Impeccable output should preserve scope. If the issue asks for a screen polish, do not introduce backend changes, dependency changes or unrelated component migrations.

## Documentation Boundary

This baseline is documentation only. It does not authorize runtime frontend, backend, dependency or deployment changes. Concrete screen redesigns should be handled by separate issues with their own acceptance criteria.
