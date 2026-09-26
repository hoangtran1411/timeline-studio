# Timeline Studio — UI & Architecture Glossary (`keyword.md`)

> **Purpose**: Standardized terminology reference for all UI elements, layout components, project workspaces, track lifecycles, and visual drafting metaphors in the Timeline Studio codebase. Use these terms when specifying requests, layout adjustments, or bug reports.

---

## 🗺️ Visual Architecture Map

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Header / Top Navigation]                                                                 z-50         │
│  [App Brand] • [Project Switcher] (📜 Historical Events ▾) • Search Filter • Zoom • Grid • [Archive]   │
├───────────────────────┬────────────────────────────────────────────────────────────────────────────────┤
│                       │ [Chrono Ruler] Millennia / Centuries / Decades / Months / Days            z-30 │
│                       │                ▲ [Today Indicator / Scrubber]                                  │
│                       ├────────────────────────────────────────────────────────────────────────────────┤
│ [Left Track Dock]     │ [Chrono Canvas] (Notebook Quad Grid Canvas)                               z-10 │
│  • Dock Header (z-30) │                                                                                │
│  • Track Card         │   ══════●═════════════════════●═════════════ [Track Wire / Branch Line]        │
│    - Title & Pill     │         │ [Hanger Stem]       │                                                │
│    - Progress & Count │      ┌──┴──────────┐       ┌──┴──────────┐                                     │
│    - Visibility (Eye) │      │ [Node Card] │───┐   │ [Node Card] │ [Card Width Resize Handle]          │
│    - Archive / Delete │      │ • Status    │   │   │ • Lock Icon │                                     │
│  • [Hidden Tracks]    │      └─────────────┘   ▼   └─────────────┘                                     │
│                       │       [Dependency Line / Dotted Arrow]                                         │
│ [Dock Splitter] (z-20)│ [Canvas Scrollbar]                                                             │
├───────────────────────┴────────────────────────────────────────────────────────────────────────────────┤
│ === [Bottom Splitter / Resize Handle] ========================================================    z-20 │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Bottom Matrix Panel] Track Tabs • Milestones Matrix Table • Tags Filter                               │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 [Dropdown Layer]                                                                                  z-[100]
   ┌──[Project Switcher Dropdown]──────────────────────────────────────────────────────────────┐
   │ • Current Project & Switch List (Icon + Name + Track count)                                │
   │ • [Manage Current Project] (Edit Name, Color, Icon, or Delete) • [+ New Project Workspace] │
   └────────────────────────────────────────────────────────────────────────────────────────────┘

 [Modals & Slide-Over Drawers]                                                                     z-[110]
   ├── [Project Modal]: Create or edit project workspace (Name, Description, Color, Emoji Icon)
   ├── [Add Timeline Modal]: Create independent track or branch from parent track & knot
   ├── [Archived Tracks Modal]: Inspect, restore, or permanently purge archived tracks
   └── [Node Drawer]: Slide-over editor for milestones (Title, Dates, Auto-Shift Subsequent Days, Tags)
         └─ [Drawer Resize Splitter]: Left draggable handle to adjust drawer width (360px - 1100px)
```

---

## ⚡ Quick Reference: Terminology & Files

| UI Component / Keyword | Source File | Description & Role |
| :--- | :--- | :--- |
| **Project Workspace** | `src/types/timeline.ts` | High-level workspace grouping related timeline tracks (e.g. Historical vs Ideas). |
| **Project Switcher** | `Header.tsx` | Dropdown in the top navigation bar to select, switch, or manage projects. |
| **Project Modal** | `ProjectModal.tsx` | Modal dialog for creating, renaming, coloring, emoji-icon picking, or deleting projects. |
| **Project Icon Picker** | `ProjectModal.tsx` | Curated emoji selector (`📜`, `💡`, `🚀`, `🔬`, `📊`, `🎮`, `📚`, `🎯`). |
| **Project Color Theme** | `ProjectModal.tsx` | Accent color identity (`amber`, `blue`, `emerald`, `purple`, `rose`, `cyan`, `violet`). |
| **Header** (Top Navigation) | `Header.tsx` | Sticky top app bar containing project switcher, search, zoom, grid, and modals triggers. |
| **Archived Tracks Modal** | `ArchivedTracksModal.tsx` | Modal listing preserved tracks stored in SQLite database without cluttering the canvas. |
| **Archived Counter Pill** | `Header.tsx` | Badge in header showing count of archived tracks (`📦 N archived`) that opens archive modal. |
| **Track Visibility (Hide/Show)** | `LeftTrackDock.tsx` | Eye toggle (`Eye`/`EyeOff`) hiding a track from active canvas view without archiving or deleting. |
| **Hidden Tracks Drawer** | `LeftTrackDock.tsx` | Bottom section of track dock listing hidden tracks with single-click "Show all". |
| **Chrono Ruler** | `ChronoRuler.tsx` | Chronological top axis showing dates, months, years, and eras adapting to zoom. |
| **Today Indicator** (Scrubber) | `ChronoRuler.tsx` | Vertical dashed line pinpointing today's actual date on the timeline canvas. |
| **Left Track Dock** | `LeftTrackDock.tsx` | Sticky left sidebar listing tracks, completion progress, node counts, and track actions. |
| **Dock Splitter** | `ChronoCanvas.tsx` | Vertical draggable border (`cursor-col-resize`, `z-20`) resizing the left sidebar width. |
| **Chrono Canvas** | `ChronoCanvas.tsx` | Main 2D scrollable viewport rendering tracks, lines, and milestone cards. |
| **Notebook Quad Grid** | `ChronoCanvas.tsx` | Technical drafting graph-paper background (`notebook`, `dots`, or `plain`). |
| **Track Wire** (Branch Line) | `BranchConnectionLayer.tsx` | Continuous horizontal clothesline wire where milestone knots hang. |
| **Knot Peg** (Timeline Knot) | `TimelineNodeCard.tsx` | 20px circular peg clamped onto the track wire displaying status or lock. |
| **Hanger Stem** (Hook Stem) | `TimelineNodeCard.tsx` | Vertical dashed hook line connecting the knot peg to the card top. |
| **Clothespin Bracket** | `TimelineNodeCard.tsx` | Metallic anchor bracket on the top edge of the card. |
| **Node Lock** | `TimelineNodeCard.tsx` | Padlock button preventing dragging completed milestones along the wire. |
| **Timeline Node Card** | `TimelineNodeCard.tsx` | Milestone card displaying title, dates, tags, and quick actions. |
| **Card Width Resize Handle** | `TimelineNodeCard.tsx` | Right-edge handle (`cursor-ew-resize`) resizing card width in localStorage. |
| **Between Node Inserter** | `BetweenNodeInserter.tsx` | Dashed hover guide with `+` button in open spans between two knots. |
| **Branch Curve** | `BranchConnectionLayer.tsx` | Smooth cubic Bézier spline curving from a parent knot down to a child track. |
| **Dependency Line** | `BranchConnectionLayer.tsx` | Directional dotted line representing prerequisite or blocking relations. |
| **Node Drawer** | `NodeDrawer.tsx` | Slide-over inspector panel for creating and editing milestone details. |
| **Auto-Shift Subsequent Days** | `NodeDrawer.tsx` | Option to automatically propagate date adjustments downstream by `+N` or `-N` days. |
| **Drawer Resize Splitter** | `NodeDrawer.tsx` | Left-edge draggable splitter handle adjusting drawer width (min 360px). |
| **Bottom Matrix Panel** | `ComparisonMatrix.tsx` | Resizable bottom spreadsheet view of all milestones across tracks. |
| **Bottom Splitter** | `page.tsx` | Horizontal draggable splitter (`cursor-row-resize`, `z-20`) controlling matrix height. |
| **Add Timeline Modal** | `AddTimelineModal.tsx` | Pop-up dialog for creating independent tracks or branching existing tracks. |

---

## 📚 Component Dictionary

### 1. `Project Workspace` & `Project Switcher`

- **Location**: `src/components/Header.tsx`, `src/components/ProjectModal.tsx`, `src/types/timeline.ts`
- **Concept**: Top-level entity grouping multiple timeline tracks into a dedicated domain (e.g., *World History*, *Startup Product Ideas*, *Personal Roadmap*).
- **Project Switcher Dropdown**:
  - Located in the left section of the Header next to the app brand.
  - Displays current project emoji icon, name, and total track count.
  - Clicking opens a menu (`z-[100]`) to quickly switch workspaces, edit current workspace, or create a new project.
- **Project Modal**:
  - Full modal dialog (`z-[110]`) allowing the user to create or edit project title, description, accent color, and emoji icon.
  - Provides a safe "Delete Project" action with confirmation.

### 2. `Track Lifecycle`: Active, Hidden, Archived & Deleted

- **Active Track**:
  - Fully visible and interactable on both the Left Track Dock and the Chrono Canvas.
- **Track All Mode (Overview / Multi-Track Comparison)**:
  - Default state when no single track is selected (`selectedTrackId === null`).
  - All timeline tracks in the project are 100% active, fully opaque (`opacity-100`), with crisp branch offshoots and clearly rendered cross-track dependencies, enabling direct side-by-side comparison across all timelines.
  - The Left Track Dock displays an active `Tracking All` indicator badge.
- **Single-Track Focus Mode**:
  - Activated by clicking on any specific track card or canvas row.
  - Focuses the selected track, dimming unrelated tracks (`opacity-35`) to minimize distraction.
  - Clicking the `[Track All ✕]` button in the Left Dock header or clicking the focused track again resets to Track All Mode.
- **Hidden Track** (`isVisible: false`):
  - Temporarily hidden from the canvas to keep the view uncluttered during comparison.
  - Toggled via the Eye icon (`Eye`/`EyeOff`) in the Left Track Dock.
  - Easily restored with a single click in the **Hidden Tracks Drawer** ("Show all") or toolbar banner.
- **Archived Track** (`isArchived: true`):
  - Preserved safely in the SQLite database without loading onto the main canvas or track dock.
  - Archived via the Archive icon (`Archive`) on the track card.
  - Inspected and restored via the **Archived Tracks Modal** (`ArchivedTracksModal.tsx`).
- **Permanent Delete**:
  - Hard-deletes the track and all its associated nodes from the SQLite database.

### 3. `Chrono Ruler` & `Today Indicator`

- **Location**: `src/components/ChronoRuler.tsx`
- **Visual**: Top fixed ruler (`z-30`) with hierarchical scale markings (Millennia, Centuries, Decades, Years, Months, Days) dynamically adapting to canvas zoom level.
- **Today Indicator**: Vertical highlighted marker pinpointing today's actual calendar date.
- **Center Today**: Button in Header (`Target` icon) that instantly scrolls the canvas to center on today's date.

### 4. `Left Track Dock` & `Dock Splitter`

- **Location**: `src/components/LeftTrackDock.tsx`, `src/components/ChronoCanvas.tsx`
- **Visual**: Sticky left sidebar (`z-30` header, width adjustable) displaying track summaries, color pills, completion progress bars, node counts, and management action buttons.
- **Splitter**: Draggable vertical border (`z-20`, `cursor-col-resize`) adjusting sidebar width between 220px and 560px.
- **Storage**: Persisted to `localStorage.getItem('timeline_studio_dock_width')`. Double-click resets to default 320px.

### 5. `Track Wire` (Branch Line)

- **Location**: `src/components/BranchConnectionLayer.tsx`
- **Visual**: A taut horizontal clothesline at `wireY = trackTop + 28px` spanning across the canvas.
- **Behavior**: Milestones hang directly from this wire. Line segments stop cleanly at outer knot perimeters to avoid slicing through knot centers.
- **Opacity**: 100% on the active/selected track; dimmed to 35% on inactive tracks.

### 6. `Knot Peg` (Timeline Knot)

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Visual**: Circular 20px anchor clamped directly onto the Track Wire.
  - **Completed (Locked)**: Solid white disc with black padlock icon (`Lock`).
  - **Completed (Unlocked)**: Solid white disc with black checkmark (`Check`).
  - **In Progress**: Dark disc with white border and pulsing center ping.
  - **Planned**: Dark disc with muted gray center dot.
  - **Blocked**: Dashed outline disc with alert exclamation point (`!`).
- **Interaction**: Click directly on the knot peg of a completed milestone to toggle lock/unlock.

### 7. `Hanger Stem` (Hook Stem) & `Clothespin Bracket`

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Hanger Stem**: Vertical technical drafting dashed line (`border-l border-dashed border-[#ececf0]/75`) dropping from the knot peg down to the card.
- **Collision Avoidance**: Dynamically extends when cards occupy lower collision avoidance lanes (`top: 56px + lane * 130px`).
- **Clothespin Bracket**: Metallic clamp bracket on top edge of the card where the stem attaches.

### 8. `Node Lock`

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Rule**: All milestones with `status === 'completed'` are locked by default (`isLocked = true`).
- **Behavior**:
  - Prevents accidental horizontal dragging along the branch line.
  - Displays a floating badge when drag is attempted: `🔒 Milestone locked — click padlock to unlock`.
  - The right-edge Card Width Resize Handle remains active by default so layout presentation can always be adjusted.
  - Single click on the padlock button (in the card header, knot peg, or hover menu) unlocks the milestone for moving.

### 9. `Timeline Node Card` & `Card Width Resize Handle`

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Visual**: Tactile charcoal card (`#18191e`) suspended from the wire.
- **Controls**:
  - **Card Header**: Drag handle / Lock button, formatted date span, inline quick actions (Edit, Branch, Insert, Delete).
  - **Card Body**: Milestone title, description preview, tag pills, priority dot.
  - **Right Edge**: Draggable handle (`w-3 cursor-ew-resize`) for adjusting card display width. Enabled by default on all cards.
  - **Storage**: Custom widths are persisted in `localStorage.getItem('timeline_studio_card_widths')`. Double-click resets back to default.

### 10. `Between Node Inserter`

- **Location**: `src/components/BetweenNodeInserter.tsx`
- **Visual**: Vertical dashed line with a circular `+` button positioned midway between adjacent knots on the wire.
- **Interaction**: Hover to reveal; click to open Node Drawer pre-filled with the calculated midpoint date. Disabled on dimmed/unselected tracks.

### 11. `Branch Curve` & `Dependency Line`

- **Location**: `src/components/BranchConnectionLayer.tsx`
- **Branch Curve**: Smooth cubic Bézier spline curving from a parent knot down to a branched child track.
- **Dependency Line**: Directional dotted line (`strokeDasharray="4 3"`) representing prerequisite or blocking relations between milestones across any tracks.

### 12. `Node Drawer` & `Auto-Shift Subsequent Days`

- **Location**: `src/components/NodeDrawer.tsx`
- **Visual**: Slide-over inspector panel on the right side of the screen (`z-[110]`) for comprehensive milestone data entry.
- **Auto-Shift Subsequent Days**: Checkbox allowing automatic date cascading: when a milestone date is pushed forward or backward, all subsequent milestones on that track are shifted by the same number of days.
- **Resize Splitter**: Left-edge draggable handle (`w-4 cursor-col-resize`). Drag left to widen (up to 1100px / 96vw), drag right to narrow (min 360px). Double-click resets to default 480px.
- **Storage**: Persisted to `localStorage.getItem('timeline_studio_node_drawer_width')`.

### 13. `Bottom Matrix Panel` & `Bottom Splitter`

- **Location**: `src/components/ComparisonMatrix.tsx`, `src/app/page.tsx`
- **Visual**: Spreadsheet-like matrix view at the bottom of the screen. Displays track filter tabs, searchable table, tag badges, and status pills.
- **Splitter**: Horizontal border handle (`z-20`, `h-2 cursor-row-resize`). Drag up/down to adjust height. Double-click collapses/expands the panel.
- **Storage**: Height and collapse states are persisted to `localStorage`.

---

## 📐 Stacking & Stacking Context Hierarchy (`z-index`)

To ensure that splitters, dropdowns, headers, and modals never clip or incorrectly overlap:

```text
┌────────────────────────────────────────────────────────┐
│ z-[110]  Fullscreen Modals & Slide-Over Drawers        │
│          • ProjectModal                                │
│          • AddTimelineModal                            │
│          • ArchivedTracksModal                         │
│          • NodeDrawer (Slide-over)                     │
├────────────────────────────────────────────────────────┤
│ z-[100]  Dropdowns & Floating Popovers                 │
│          • Project Switcher Dropdown                   │
├────────────────────────────────────────────────────────┤
│ z-50     Sticky Application Header                     │
│          • Top navigation bar                          │
├────────────────────────────────────────────────────────┤
│ z-30     Canvas Sticky Headers                         │
│          • ChronoRuler time axis                       │
│          • LeftTrackDock header                        │
├────────────────────────────────────────────────────────┤
│ z-20     Draggable Splitter Handles                    │
│          • LeftTrackDock vertical splitter             │
│          • Bottom Matrix horizontal splitter           │
├────────────────────────────────────────────────────────┤
│ z-10     Canvas Drafting Layers                        │
│          • Track Wires & Branch Curves                 │
│          • Knot Pegs & Hanger Stems                    │
│          • Timeline Node Cards                         │
│          • Between-Node Inserters                      │
└────────────────────────────────────────────────────────┘
```

---

## 💬 Example Phrasing Guide

Use these concise English phrasing examples during development to communicate instructions with surgical precision:

- *"In the **Project Switcher**, add a search filter to quickly filter between 20+ projects."*
- *"When opening **Project Modal**, highlight the current **Project Color Theme**."*
- *"Add an unarchive button in the **Archived Tracks Modal** that immediately triggers canvas refetch."*
- *"In **Left Track Dock**, show the count of **Hidden Tracks** with a 'Show All' shortcut."*
- *"In the **Node Drawer**, make **Auto-Shift Subsequent Days** checked by default when rescheduling a blocked milestone."*
- *"Increase the vertical gap between the **Track Wire** and the **Timeline Node Card** by 10px."*
- *"Make the **Knot Peg** slightly larger and highlight its border on hover."*
- *"On double-clicking the **Bottom Splitter**, expand it to 50% viewport height."*
- *"Smooth out the curvature of the **Branch Curve**."*
- *"Adjust the font weight of tick labels on the **Chrono Ruler**."*
- *"Ensure the **Dock Splitter** stays at `z-20` so it never paints over the **Project Switcher Dropdown**."*
