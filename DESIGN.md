---
name: "parseVK"
description: "A cinematic dark analytical studio for social intelligence — data lives on deep blacks, metrics glow, and every surface serves insight."
colors:
  command-blue: "#f2643d"
  signal-sky: "#38bdf8"
  success-green: "#5fa879"
  warning-amber: "#e9ad54"
  danger-red: "#ef4444"
  console-ink: "#18181b"
  panel-slate: "#0f0f11"
  sidebar-navy: "#141416"
  divider-slate: "#27272a"
  primary-text: "#d4d4d8"
  secondary-text: "#a1a1aa"
  light-text: "#f4f4f5"
  chart-blue: "#f2643d"
  chart-green: "#5fa879"
  chart-orange: "#e9ad54"
typography:
  display:
    fontFamily: "Outfit, Space Grotesk, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Outfit, IBM Plex Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Outfit, IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, IBM Plex Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, IBM Plex Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  card: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.command-blue}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "36px"
  input-default:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.card}"
    padding: "24px"
  status-badge-success:
    backgroundColor: "{colors.success-green}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    height: "auto"
---

# Design System: parseVK

## 1. Overview

**Creative North Star: "The Mission Control Room"**

parseVK is an analytical studio where analysts spend hours inspecting social data. The visual system must feel **cinematic, calm and confident**: deep blacks as a canvas, data that glows with purpose, and surfaces that reward attention without demanding it.

This is not an operator console. It is a beautiful workplace. Every metric panel, every chart, every comment row should feel considered. Light is a material — use it to guide the eye. Glow follows importance. Motion follows meaning.

The system explicitly rejects flat SaaS utilitarian darkness. It embraces **data-heavy visual storytelling**: glowing metrics, intentional negative space, surfaces with depth. But it never decorates for decoration's sake — every visual choice originates from the data it presents.

**Key Characteristics:**
- Deep blacks as the foundation; metric cards, charts and data panels emerge from the dark.
- The terracotta command accent (#f2643d) is the signature color — used boldly on metrics, active states and focal points.
- Semantic colors (green, amber, red) are pure and reserved for state changes, alerts and comparisons.
- Typography is clean and confident: Outfit for body, JetBrains Mono for data.
- Motion is purposeful: metrics pulse on update, panels ease in, transitions follow the eye.

## 2. Colors

The palette is a soft dark SaaS-style palette: deep comfortable slate surfaces, gentle text contrast that avoids eye strain, one primary accent blue and a small semantic state vocabulary.

### Primary

- **Command Blue**: the primary action, active navigation, focus and selected-state color. Use it for commands that start, retry, export, save or open a focused workflow.

### Secondary

- **Signal Sky**: an informational accent for live indicators, secondary status details and technical metadata that needs attention without implying success or failure.

### Tertiary

- **Success Green**: completed, connected, imported, synchronized and healthy states (using a softer emerald #10b981).
- **Warning Amber**: partial, stale, queued, delayed, rate-limited or needs-review states.
- **Danger Red**: failed, destructive, invalid, disconnected and unrecoverable states.

### Neutral

- **Console Ink**: the application background and deepest content surface (#18181b).
- **Panel Slate**: cards, popovers, inputs and repeated operational panels (#0f0f11).
- **Sidebar Navy**: global navigation, persistent product areas and shell structure (#141416).
- **Divider Slate**: borders, table rules, input strokes and subtle separators (#27272a).
- **Primary Text**: body copy, table values and normal labels on dark surfaces (#d4d4d8).
- **Secondary Text**: metadata, helper text, muted counters and secondary descriptions (#a1a1aa).
- **Light Text**: foreground on saturated action or destructive backgrounds (#f4f4f5).

### Named Rules

**The Semantic First Rule.** Blue, green, amber and red are reserved for action and state; never use saturated color as ornament.

**The One Command Accent Rule.** A single screen may use Command Blue for the primary action, active item and focus state, but it must not compete with error or warning signals.

**The Dark Inspection Rule.** Dark surfaces are operational surfaces. Preserve contrast, focus visibility and readable row rhythm before adding gradients or blur.

## 3. Typography

**Display Font:** Outfit with Space Grotesk fallback
**Body Font:** Outfit with IBM Plex Sans fallback
**Label/Mono Font:** JetBrains Mono for technical accents

**Character:** The type system feels technical but not mechanical. Outfit carries most UI with clean rounded forms, Space Grotesk gives page titles a firmer console identity, and JetBrains Mono marks machine-readable data.

### Hierarchy

- **Display** (600, 1.875rem, 1.2): page identity and high-level screen titles only.
  * Tailwind: `font-monitoring-display text-3xl font-semibold tracking-tight text-white`
- **Headline** (600, 1.25rem, 1.3): section headers, panel titles and important group labels.
  * Tailwind: `font-monitoring-display text-xl font-semibold text-white`
- **Title** (600, 1rem, 1.35): card titles, table group names and compact detail headings.
  * Tailwind: `font-monitoring-body text-base font-semibold text-text-primary`
- **Body** (400, 0.875rem, 1.5): tables, descriptions, row values and form content. Prose should stay near 65 to 75 characters when the layout permits it.
  * Tailwind: `font-monitoring-body text-sm font-normal text-text-primary`
- **Label** (600, 0.75rem, 1.35): chips, column labels, button text and compact metadata.
  * Tailwind: `font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary`
- **Mono** (500, 0.75rem, 1.4): IDs, timestamps, numeric counters, task codes and log-like fragments.
  * Tailwind: `font-mono-accent text-xs font-medium text-text-secondary`

### Named Rules

**The Data First Type Rule.** Never use display styling for labels, buttons or table data. Dense UI must remain readable at 14px and below.

**The Mono Means Machine Rule.** JetBrains Mono is for values operators compare or copy, not for decorative headings.

## 4. Elevation

parseVK uses a hybrid of tonal layering, borders and soft shadows. Most depth comes from surface color and a 1px border; shadows appear only to separate cards, hoverable command surfaces and glass-backed legacy panels. The default state is flat and inspectable.

### Shadow Vocabulary

- **Soft Small** (`0 2px 4px rgba(0, 0, 0, 0.55)`): default card and primary button separation.
- **Soft Medium** (`0 12px 30px -20px rgba(0, 0, 0, 0.55)`): button hover or active command affordance.
- **Soft Large** (`0 18px 34px -18px rgba(0, 0, 0, 0.55)`): prominent panels that must sit above dense content.
- **Glass Shadow** (`0 8px 32px rgba(0, 0, 0, 0.5)`): legacy glassmorphic surfaces only when contrast remains strong.

### Named Rules

**The Border Before Shadow Rule.** Use tonal contrast and a 1px divider first. Add shadow only when a component must separate from scrollable or layered content.

**The Glass Is Exceptional Rule.** Glassmorphic utilities exist, but they are forbidden as default decoration. Use them only when layering helps orientation and text contrast stays intact.

## 5. Components

### Buttons

Buttons are compact, steady and command-oriented.

- **Shape:** gently rounded rectangle (0.75rem).
- **Primary:** Command Blue background with Light Text, 36px default height, 16px horizontal padding and 8px icon gap.
- **Hover / Focus:** hover darkens the command surface and may increase soft shadow; focus uses a visible blue ring. Active state moves down by 1px.
- **Secondary / Ghost / Tertiary:** secondary uses Panel Slate, outline uses a 1px Divider Slate border, ghost keeps text muted until hover, link is blue text with underline on hover.
- **Disabled:** pointer events disabled and opacity reduced to 50 percent.

### Chips

Chips are operational state markers, not decoration.

- **Style:** 0.5rem radius, 1px border, 10px horizontal padding and 12px semibold text.
- **State:** default maps to command or semantic status; highlight may use yellow for keyword matches, but only when it represents matched data.

### Status Badges

Status badges are reusable live-state markers extracted into `StatusBadge`.

- **Shape:** rounded full pill with a 6px dot and compact 8px horizontal padding.
- **Tones:** success, warning, danger, info and neutral map to semantic state colors.
- **Pulse:** optional ping dot is allowed for live health, running or actively refreshing states only.
- **Use:** apply to service health, task state, sync state and operational status labels where the same dot plus text pattern repeats.

### Cards / Containers

Cards frame repeated entities, panels and detail tools.

- **Corner Style:** large rounded operational panels (20px) for current shared Card components.
- **Background:** Panel Slate on Console Ink, with Primary Text foreground.
- **Shadow Strategy:** Soft Small at rest. Larger shadows are reserved for overlays or hoverable command areas.
- **Border:** 1px Divider Slate at 60 percent opacity.
- **Internal Padding:** 24px in headers and content, with tighter 12px to 16px spacing near dense data.

### Inputs / Fields

Inputs are quiet, high-contrast and task-safe.

- **Style:** Panel Slate field, Divider Slate stroke, 0.75rem radius, 40px height and 12px horizontal padding.
- **Focus:** border changes to the ring color and adds a visible blue focus ring at 30 percent opacity.
- **Error / Disabled:** invalid state uses Danger Red for border and ring; disabled state blocks pointer events and reduces opacity.

### Navigation

Navigation is persistent and compact. Sidebar items use Sidebar Navy, 8px padding, 0.5rem radius and text truncation. Active, hover and open states use the same Command Blue tinted accent so the product area remains stable while scanning.

### Tables

Tables are first-class components for authors, comments, groups, tasks, exports and admin users. Headers are 40px high with muted labels; cells use 8px padding; rows use a 1px divider, muted hover background and explicit selected state.

### Page Hero Panels

Page hero panels are operational headers, not marketing heroes. They may use a restrained Command Blue tint over Panel Slate to identify the page and expose the main action, but the next working surface must remain close and visible.

## 6. Do's and Don'ts

### Do:

- **Do** keep tables, filters, pagination, exports and progress indicators close to the data they control.
- **Do** pair every important color state with text, iconography or a clear label.
- **Do** use Command Blue for primary actions, active navigation and focus rings.
- **Do** preserve dark-mode contrast across normal, hover, focus, disabled, loading and error states.
- **Do** use Empty, Loading and Error states that name the scope: source, task, group, filters or export.
- **Do** use mono text for IDs, counters, timestamps, task codes and logs.
- **Do** keep page headers practical: title, concise description, primary action and relevant status only.

### Don't:

- **Don't** redesign screens as landing pages, hero pages or marketing cards.
- **Don't** hide operational density behind oversized decorative sections.
- **Don't** use color as decoration when it competes with statuses or alerts.
- **Don't** introduce playful empty states for serious monitoring or failure paths.
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards, list items, callouts or alerts.
- **Don't** use gradient text.
- **Don't** use glassmorphism as the default panel style.
- **Don't** create identical card grids with icon, heading and text repeated as page structure.
- **Don't** use display fonts in labels, buttons, forms or data tables.
- **Don't** animate layout-heavy properties or decorative page-load sequences.
