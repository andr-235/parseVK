---
name: ParseVK
description: Social media analytics platform for identifying violations in comments and posts
colors:
  primary: oklch(0.55 0.12 230)
  primary-hover: oklch(0.5 0.12 230)
  primary-soft: oklch(0.55 0.12 230 / 0.1)
  neutral-surface: oklch(0.985 0.002 250)
  neutral-sidebar: oklch(0.97 0.003 250)
  neutral-panel: oklch(0.95 0.005 250)
  neutral-hover: oklch(0.92 0.005 250)
  neutral-elevated: oklch(1 0 0)
  neutral-text-primary: oklch(0.15 0.01 250)
  neutral-text-secondary: oklch(0.45 0.015 250)
  neutral-text-muted: oklch(0.6 0.01 250)
  neutral-border: oklch(0.88 0.005 250)
  success: oklch(0.55 0.13 150)
  success-soft: oklch(0.55 0.13 150 / 0.1)
  warning: oklch(0.65 0.14 85)
  warning-soft: oklch(0.65 0.14 85 / 0.1)
  danger: oklch(0.5 0.18 30)
  danger-soft: oklch(0.5 0.18 30 / 0.1)
typography:
  display:
    fontFamily: Space Grotesk, sans-serif
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: Space Grotesk, sans-serif
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Space Grotesk, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Space Grotesk, sans-serif
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.05em
  mono:
    fontFamily: Geist Mono, monospace
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

# Design System: ParseVK

## 1. Overview

**Creative North Star: "The Evidence Board"**

ParseVK is an operator workspace for identifying unlawful speech across social media. The interface is a board where evidence — comments, posts, author patterns — is brought into focus, examined, and acted upon. Every pixel serves the task: there is no decoration, no marketing, no flourish that doesn't carry information or afford an action.

The system is restrained by default. A single blue-teal accent (oklch 0.55 0.12 230) marks primary actions, active selection, and focus. Neutrals are tinted cool (hue 250, chroma below 0.015) to create a calm, clinical reading environment. Flat surfaces with tonal layering replace shadows: depth is conveyed through background lightness, not drop shadows. This is an instrument, not a dashboard poster.

Three named references define the aesthetic lane: Linear (pristine state handling, typographic precision), Grafana (dense data presentation, semantic color discipline), and Figma (sidebar navigation, panel-based layout). The system explicitly rejects clown palettes, landing page hero sections, MVP roughness, terminal styling, and gamified visual tricks.

### Key Characteristics

- Data first: content determines composition
- Flat by default: tonal layers, no shadows
- One accent color per screen
- Tools, not decoration: every element carries information or action
- Dark + light themes with user toggle

## 2. Colors

The palette is engineered around a single blue-teal accent on cool-tinted neutrals. Chroma drops as lightness approaches extremes, keeping the surface calm at both ends of the theme spectrum.

### Primary

- **Command Blue** (oklch 0.55 0.12 230): Primary buttons, active navigation item, focus ring, selected state. Light theme. Dark theme shifts to oklch 0.6 for maintained contrast.

### Neutral

- **Surface** (oklch 0.985 0.002 250 / dark: 0.13 0.008 250): Main application background.
- **Sidebar** (oklch 0.97 0.003 250 / dark: 0.1 0.008 250): Navigation panel, slightly darker to create depth.
- **Panel** (oklch 0.95 0.005 250 / dark: 0.16 0.008 250): Detail panels, drawers, elevated containers.
- **Hover** (oklch 0.92 0.005 250 / dark: 0.19 0.008 250): Row and button hover state.
- **Elevated** (oklch 1 0 0 / dark: 0.17 0.008 250): Modal surfaces, dropdowns.
- **Text Primary** (oklch 0.15 0.01 250 / dark: 0.93 0.005 250): Headings, body copy, high-emphasis content.
- **Text Secondary** (oklch 0.45 0.015 250 / dark: 0.65 0.01 250): Labels, metadata, secondary information.
- **Text Muted** (oklch 0.6 0.01 250 / dark: 0.5 0.01 250): Placeholder text, disabled states, captions.
- **Border** (oklch 0.88 0.005 250 / dark: 0.22 0.005 250): All structural borders, table cell dividers.

### Semantic

- **Success** (oklch 0.55 0.13 150): Clean/approved status.
- **Warning** (oklch 0.65 0.14 85): Needs review, pending state.
- **Danger** (oklch 0.5 0.18 30): Violation detected, error state, destructive action.

Each semantic color has a soft variant at 10–15% alpha for background fills.

### Named Rules

**The One Voice Rule.** The accent color is used on 10% or less of any given surface. Its rarity gives it meaning. A second accent may appear only for semantic contrast (statuses, badges, data highlights).

**The Border Before Shadow Rule.** Hierarchy is established through borders first. Shadows are never used for surface separation. Flat stacking (lighter/darker background) is the depth system.

## 3. Typography

**Display Font:** Space Grotesk (300–700 weight range)
**Body Font:** Space Grotesk (same family, no pairing)
**Label/Mono Font:** Geist Mono (100–900 weight range)

**Character:** A single sans family at work. Space Grotesk is geometric but warm, technical but not cold. The mono companion (Geist Mono) is reserved for IDs, timestamps, code snippets, and machine-generated data.

### Hierarchy

- **Display** (Semi Bold, 1.25rem / 20px, line-height 1.4): Page titles, primary headings. Appears once per view.
- **Title** (Semi Bold, 0.875rem / 14px, line-height 1.4): Card headers, section titles, modal headings.
- **Body** (Regular, 0.875rem / 14px, line-height 1.5): Table content, comment text, descriptions. Max line length 75ch for prose blocks.
- **Label** (Medium, 0.75rem / 12px, letter-spacing 0.05em, uppercase): Sidebar navigation, table headers, form labels, chip text. Compact and scannable.
- **Mono** (Regular, 0.875rem / 14px): IDs, timestamps, data values, key matches (with Geist Mono).

### Named Rules

**The One Family Rule.** Space Grotesk carries the entire interface. No display and body pairing, no serif for headings. The weight range (300–700) provides sufficient contrast between hierarchy steps at a 1.25 ratio.

## 4. Elevation

The system is flat by default. Depth is communicated through tonal layering (background lightness shifts) and borders, never through box shadows. This is an operator console, not a card-based layout: surfaces sit flush against each other, separated by 1px borders at the neutral border color.

A single exception exists for hover feedback on interactive elements: a subtle background tint change (neutral-hover) at 150ms transition. No lift, no shadow, no scale change.

## 5. Components

### Sidebar

- **Width:** 224px fixed, full height.
- **Background:** neutral-sidebar — one step darker than the main surface to establish depth without shadows.
- **Navigation items:** Compact (label style, uppercase tracking), icon + label layout. Active state uses primary-soft background + primary text color. Hover uses neutral-hover background.
- **Groups:** Section headers in text-muted at label size. 16px vertical gap between groups.
- **No shadow, no border-right:** depth comes from the background tint alone.

### Header

- **Height:** 48px.
- **Background:** neutral-surface (matches main content).
- **Border:** 1px bottom border at neutral-border.
- **Controls:** Theme toggle (sun/moon icon), user name label, logout button. All controls at 32px touch target minimum.
- **No logo aside from the sidebar title:** the header is a utility bar, not a brand showcase.

### Buttons

- **Shape:** Rounded-md (6px radius).
- **Primary:** Command Blue background, white text, 10px horizontal / 6px vertical padding. Hover darkens to primary-hover.
- **States:** 150ms color transition. No lift, no shadow, no scale.
- **Secondary/Outline:** Transparent background, 1px neutral-border stroke, text-secondary text. Hover fills neutral-hover.
- **Icon buttons:** 28px square, transparent, hover fills neutral-hover. Used in table action cells.

### Tables

- **Structure:** Full-width, border-collapse. 1px bottom border between rows at neutral-border.
- **Header row:** neutral-sidebar background, label-style uppercase text (text-muted), left-aligned.
- **Data cells:** body-style text, 8px horizontal / 6px vertical padding. Text-truncate on long content with max-width.
- **Hover:** Row-level hover at neutral-hover background.
- **Selected:** Row-level primary-soft background.
- **Actions column:** Fixed-width icon button column at far right.

### Inputs & Fields

- **Style:** 1px neutral-border stroke, neutral-surface background, 6px radius.
- **Height:** 32px (compact, tool-grade).
- **Focus:** Border shifts to Command Blue at 150ms. No glow, no ring offset.
- **Placeholder:** text-muted color.
- **Select elements:** Same treatment, with native dropdown arrow preserved.

### Chips / Tags

- **Style:** Soft background (semantic color at 10% alpha), semantic text color, 4px radius.
- **Padding:** 4px horizontal, 2px vertical.
- **Font:** Label style (12px, medium, uppercase tracking).
- **Used for:** Status badges, key word matches, filter pills.

### Detail Panel (Right Drawer)

- **Width:** 320px fixed.
- **Position:** Slides in from right, replaces no content (adjacent to table).
- **Background:** neutral-panel — one step darker than main surface.
- **Border:** 1px left border at neutral-border.
- **Content:** Close button in header, stacked metadata rows (label + value), status selector, key word match chips, save button.
- **Not a modal:** it coexists with the parent view.

## 6. Do's and Don'ts

### Do

- **Do** use the Command Blue accent sparingly — one element per view where the user must act.
- **Do** use tonal layering for depth: lighter backgrounds for surfaces closer to the user, darker for containers.
- **Do** keep tables dense but readable: generous horizontal padding, tight vertical rhythm.
- **Do** use semantic color for status indicators only: green for clean, red for violation, amber for review.
- **Do** use the right panel for detail views instead of modals.
- **Do** transition states at 150ms with ease-out timing.

### Don't

- **Don't** use clown colors: neon, acidic, toy-grade palettes of any kind.
- **Don't** design landing page hero sections, decorative headlines, or marketing blocks inside the application.
- **Don't** style the interface as a terminal or console (green text on black, command-line metaphors).
- **Don't** use gradient text (`background-clip: text` with gradient) for any purpose.
- **Don't** use glassmorphism (backdrop blur on cards, translucent glass panels).
- **Don't** use cards as the default layout container. Tables and flat sections are preferred.
- **Don't** use modal dialogs as the first solution for detail views. Exhaust inline and side-panel alternatives first.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px as a colored accent).
- **Don't** use display fonts in UI labels, buttons, or body text.
- **Don't** use bounce or elastic timing functions for transitions.

## См. также

- [Product](product.md) — описание продукта и пользователей
- [Getting Started](getting-started.md) — установка и локальная разработка
- [Architecture](architecture.md) — микросервисы, слои, data flow
