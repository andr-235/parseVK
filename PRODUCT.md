# parseVK Product Context

## Register

Product. parseVK is a social intelligence SaaS platform: design serves speed, deep analysis and repeatable work with social data.

## Product Purpose

parseVK helps analysts collect, monitor, inspect and export intelligence from VK, OK, Telegram and related sources. The frontend is not a marketing surface. It is an analytical SaaS dashboard for users who repeatedly move between monitoring, authors, comments, groups, tasks, exports, statuses and logs.

The product should make large, messy social data feel controllable. Analysts need to see what is running, what changed, what failed, what needs review and what can be exported.

## Primary Users

- Analysts and researchers who check groups, authors, comments and keywords for active intelligence.
- Analysts who compare authors, posts, comment threads and export results for offline reporting.
- Administrators who manage users, credentials, automation settings, parsing tasks and system health.
- Developers and maintainers who use logs, task states and diagnostics to understand failures quickly.

## Core Workflows

- Start parsing or synchronization tasks, then track progress, status, errors and completion.
- Monitor groups, comments, authors and keyword matches with enough density to scan many rows without losing context.
- Drill from summary views into author, group, task or comment details.
- Export VK and OK friend data, listings and analysis results in predictable formats.
- Manage automation settings, Telegram sessions and admin users without leaving the analytical dashboard mental model.
- Review empty, loading and error states during long-running or unreliable network operations.

## Product Personality

parseVK should feel calm, technical and trustworthy. It can have visual character, but the interface must never become decorative at the cost of scan speed. The voice is concise, factual and analytical.

Use direct labels:

- "Task failed", not "Something went wrong".
- "No comments match these filters", not "Nothing to see here".
- "Export CSV", not "Get your data".
- "Retry sync", not "Try again later" when an immediate retry exists.

## Strategic Principles

- Prioritize dense but readable information. Tables, lists and status panels are first-class surfaces.
- Preserve context while drilling down. Analysts should know which source, task, group or author they are inspecting.
- Make system state explicit. Running, queued, failed, stale and completed states should be visible without guesswork.
- Treat exports as analytical handoffs. Confirm scope, format and result, then make failures actionable.
- Keep admin and settings screens quiet. These surfaces should reduce risk, not advertise features.
- Use visual emphasis only to clarify priority, severity, recency or ownership.

## Anti-Goals

- Do not redesign screens as landing pages, hero pages or marketing cards.
- Do not hide operational density behind oversized decorative sections.
- Do not use color as decoration when it competes with statuses or alerts.
- Do not introduce playful empty states for serious monitoring or failure paths.
- Do not change runtime behavior while documenting design context.

## Impeccable Usage

Use Impeccable as a product-design partner for concrete frontend tasks:

- `teach`: refresh this product context when the audience, product scope or voice changes.
- `document`: regenerate design context from the current frontend when UI tokens or shared patterns change.
- `audit`: check a screen for accessibility, responsive behavior, performance and production readiness.
- `critique`: review a screen or flow for clarity, hierarchy, density and analyst usefulness.
- `layout`: improve spacing, rhythm and scan paths while preserving information density.
- `polish`: perform a final quality pass before shipping a UI change.
- `extract`: move repeated visual decisions into shared tokens or reusable components.
- `live`: iterate visually in the browser when a concrete screen needs side-by-side variants.

Use `audit`, `critique`, `layout` and `polish` on existing screens before larger rewrites. Use `extract` only after repetition is visible in multiple places.
