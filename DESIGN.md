# Monochrome Studio — Design System

> **Aesthetic North Star: "Engineering Tactile Minimalism"**  
> A high-precision, distraction-free planning canvas that combines the tactile feel of an engineering quad-ruled notebook with a soft-contrast, eye-friendly monochrome palette.

---

## 1. Core Principles

1. **Anti-AI Slop**: No saturated cyan/neon glow effects, aggressive gradient meshes, or heavy glassmorphism blurs.
2. **Soft-Contrast Monochrome**: High-contrast pure white on pure pitch black causes rapid eye fatigue. Instead, the interface uses a warm charcoal foundation (`#101114`) with zinc accents and soft off-white text (`#ececf0`), providing optimal legibility for hours of continuous planning.
3. **Tactile Notebook Structure**: The canvas background uses subtle graph paper grid lines that evoke physical engineering notebooks (Rhodia, Kokuyo Campus, Leuchtturm1917).
4. **Information Architecture Over Color**: Milestone statuses, priorities, and dependency states are distinguished through geometric shapes, line styles (solid, dashed, dotted), luminance, and typographic hierarchy rather than rainbow colors.

---

## 2. Color Palette & Luminance Scales

| Token | Hex / CSS Value | Semantic Role |
| :--- | :--- | :--- |
| **Canvas Base** | `#101114` | Deep warm charcoal background for the entire application |
| **Track Surface** | `#141519` | Surface for track rows, sidebar items, and table rows |
| **Card Surface** | `#18191e` | Default state for timeline node cards |
| **Surface Raised** | `#1c1d22` | Slide-over drawers, modals, popovers, and grip pills |
| **Surface Hover** | `#1f2027` | Hover state for node cards and sidebar track cards |
| **Active / Grab** | `#22232a` | Active state when a card is selected or being dragged |
| **Border Subtle** | `#222328` | Hairline dividers, track lane boundaries, table borders |
| **Border Medium** | `#2a2b32` | Node card borders and dock card boundaries |
| **Border Focus** | `#383a42` | Input focus borders, hover outline on splitters |
| **Border Active** | `#ffffff` | Dragging card border, selected node highlight |
| **Text Primary** | `#ececf0` | Primary headings, titles, active badges (92% luminance) |
| **Text Secondary** | `#9e9ea7` | Secondary labels, track metadata, date spans (65% luminance) |
| **Text Muted** | `#71717a` / `#6b6c75` | Ticks, sub-labels, disabled icons, placeholders |

---

## 3. The Notebook Grid System (Kẻ Ô Vở)

The central canvas features a dual-layer quad-ruled graph paper grid:

```css
/* Minor Grid: 24px × 24px (Notebook Quad Squares) */
linear-gradient(to right, rgba(236, 236, 240, 0.025) 1px, transparent 1px),
linear-gradient(to bottom, rgba(236, 236, 240, 0.025) 1px, transparent 1px)

/* Major Grid: 120px × 120px (5-Square Macro Blocks) */
linear-gradient(to right, rgba(236, 236, 240, 0.055) 1px, transparent 1px),
linear-gradient(to bottom, rgba(236, 236, 240, 0.055) 1px, transparent 1px)
```

### Canvas Modes

1. **Notebook (Default)**: Full dual-layer graph paper grid (`background-size: 120px 120px, 24px 24px`).
2. **Dots**: Subtle bullet journal dot grid (`radial-gradient(rgba(236, 236, 240, 0.12) 1.2px, transparent 1.2px)`).
3. **Plain**: Clean, dark charcoal workspace without background grid markings.

---

## 4. Typography & Metrics

- **Primary UI Font**: Inter / Geist Sans (Clean, modern sans-serif for UI labels, titles, and modals).
- **Technical & Metric Font**: JetBrains Mono / Geist Mono (Fixed-width typeface for dates, intervals, days delta, tags, and status pills).

### Hierarchy

- **Application Brand**: `14px`, font-semibold, tracking-tight.
- **Track Header Title**: `12px`, font-semibold, text `#ececf0`.
- **Node Title**: `12px`, font-medium, leading-snug.
- **Date Spans**: `11px`, font-mono, text `#9e9ea7`.
- **Tags & Status Badges**: `10px`, font-mono, uppercase / lowercase tag formats (`#backend`, `#release`).
- **Grip & Scrubber Tooltips**: `9px`–`10px`, font-bold, background `#ffffff`, text `#000000`.

---

## 5. Component Language & Interaction Models

### 5.1 Timeline Node Cards

- **Base Dimensions**: `min-width: 160px`, height determined by content (~96px to 110px).
- **Vertical Lane Offset**: `top: 16px + lane * 116px` with a generous 36px bottom margin to prevent overlap.
- **Hover Toolbar**: Smoothly reveals quick action buttons (`Edit`, `Branch from node`, `Insert after`, `Delete`).
- **Drag-to-Move**: Click and drag horizontally along the canvas. Uses pointer capture, displays a floating live date delta tooltip (`📅 18 Sep – 02 Oct (+3d)`), and snaps to day increments.
- **Drag-to-Resize**: Hovering over the right edge displays `↔ cursor-ew-resize`. Dragging extends or shortens milestone duration.

### 5.2 Status System (Monochrome Badges)

- **Completed**: Solid white circle (`#ececf0`) with dark checkmark icon.
- **In Progress**: Hairline ring with animated pulsing center dot.
- **Planned**: Muted circular border with a static dark center dot.
- **Blocked**: Dashed circular border with an alert exclamation icon.

### 5.3 Collision Avoidance & Inter-Node Insertion

- **Between-Node Inserter**: Hovering in the gap between two sequential nodes displays a dashed connector line and a floating `+ Insert` button. Clicking pre-fills the exact midpoint date.
- **Auto-Shift**: Node drawer includes a checkbox to automatically shift subsequent milestones by $N$ days to accommodate insertions.
- **Automatic Sub-Lanes**: Greedy interval scheduling automatically stacks overlapping milestones into clean, non-colliding sub-lanes (`lane: 0`, `lane: 1`, ...).

### 5.4 Resizable Splitters & Panel Docks

- **Left Track Dock**:
  - Resizable via vertical divider handle (`cursor-col-resize`).
  - Constrained between `220px` and `560px` (default `320px`).
  - Double-click resets to default width.
  - Coupled vertical scrolling (`scrollTop` synchronization with right canvas).
- **Bottom Comparison Panel**:
  - Resizable via horizontal divider handle (`cursor-row-resize`).
  - Constrained between `120px` and `600px` (default `250px`).
  - One-click collapse button toggles panel into a compact `44px` header bar.
  - Double-click on divider toggles collapse / expand.
  - Internal table features independent vertical scrolling with sticky header rows.

---

## 6. Implementation Guardrails

- **Zero Saturated Hues**: Accent colors (blue, red, green, yellow) must be avoided in primary navigation and canvas elements. All meaning is conveyed through monochrome contrast, border weights, and typography.
- **No Unbounded Overflows**: Every scrollable container (dock, canvas, table) must maintain explicit `overflow` rules to prevent layout bleeding.
- **State Persistence**: User preferences (sidebar width, bottom panel height, collapsed state, grid style) are stored in `localStorage` for instant restoration on page reload.
