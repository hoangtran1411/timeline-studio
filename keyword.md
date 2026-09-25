# Timeline Studio — UI & Architecture Glossary (`keyword.md`)

> **Purpose**: Standardized terminology reference for all UI elements, layout components, and visual drafting metaphors in the Timeline Studio codebase. Use these terms when specifying requests, layout adjustments, or bug reports.

---

## 🗺️ Visual Architecture Map

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Top Toolbar] Brand • Search Filter • Zoom In/Out • Grid Style • + New Timeline       │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│                   │  [Time Ruler] Millennia / Centuries / Decades / Months / Days      │
│                   │               ▲ [Today Scrubber / Indicator]                       │
│                   ├────────────────────────────────────────────────────────────────────┤
│  [Left Track Dock]│  [Chrono Canvas] (Notebook Quad Grid Canvas)                       │
│                   │                                                                    │
│  • Track Card     │   ══════●═════════════════════●═════════ [Track Wire / Branch Line]│
│    - Title        │         │ [Hanger Stem]       │                                    │
│    - Milestone #  │      ┌──┴──────────┐       ┌──┴──────────┐                         │
│    - Color pill   │      │ [Node Card] │───┐   │ [Node Card] │ [Duration Handle]       │
│    - Actions      │      │ • Status    │   │   │ • Lock Icon │                         │
│                   │      └─────────────┘   ▼   └─────────────┘                         │
│                   │       [Dependency Dotted Line / Curve]                             │
│                   │                                                                    │
│  [Dock Splitter]  │  [Canvas Scrollbar]                                                │
├───────────────────┴────────────────────────────────────────────────────────────────────┤
│  === [Bottom Splitter / Resize Handle] =============================================== │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Bottom Matrix Panel] Track Tabs • Milestones Matrix Table • Tags Filter              │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [Side Slide-Over]:
   ┌──[Drawer Splitter]───┬──────────────────────────────────────────────────────────────┐
   │ ◄║► Resize Handle    │ [Node Drawer] Edit / Create Node Form (Width in LocalStorage)│
   └──────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Reference: Terminology & Files

| UI Component Name | Source File | Description & Role |
| :--- | :--- | :--- |
| **Track Wire** (Branch Line) | `BranchConnectionLayer.tsx` | The continuous horizontal clothesline wire where milestones hang. |
| **Knot Peg** (Timeline Knot) | `TimelineNodeCard.tsx` | The 20px circular peg clamped onto the wire displaying status or lock. |
| **Hanger Stem** (Hook Stem) | `TimelineNodeCard.tsx` | Vertical dashed hook line connecting the knot peg to the card top. |
| **Clothespin Bracket** | `TimelineNodeCard.tsx` | Metallic anchor bracket on the top edge of the card. |
| **Node Lock** | `TimelineNodeCard.tsx` | Padlock button preventing dragging completed milestones along the wire. |
| **Time Ruler** | `TimeRuler.tsx` | Chronological top axis showing dates, months, years, and eras. |
| **Today Indicator** (Scrubber) | `TimeRuler.tsx` | Vertical marker pinpointing today's actual date on the timeline. |
| **Left Track Dock** | `LeftTrackDock.tsx` | Sticky left sidebar listing tracks, node counts, and track actions. |
| **Dock Splitter** | `ChronoCanvas.tsx` | Vertical draggable border resizing the left sidebar width. |
| **Chrono Canvas** | `ChronoCanvas.tsx` | Main 2D scrollable viewport rendering tracks, lines, and cards. |
| **Notebook Quad Grid** | `ChronoCanvas.tsx` | Technical drafting graph-paper background (24px minor, 120px major). |
| **Between Node Inserter** | `BetweenNodeInserter.tsx` | Dashed hover guide with `+` button in open spans between two knots. |
| **Timeline Node Card** | `TimelineNodeCard.tsx` | The milestone card displaying title, dates, tags, and quick actions. |
| **Duration Resize Handle** | `TimelineNodeCard.tsx` | Right-edge handle (`cursor-ew-resize`) extending milestone duration. |
| **Branch Curve** | `BranchConnectionLayer.tsx` | Smooth cubic Bézier curve connecting a parent knot to a child track. |
| **Dependency Line** | `BranchConnectionLayer.tsx` | Dotted line with directional arrow showing task dependencies. |
| **Node Drawer** | `NodeDrawer.tsx` | Slide-over inspector panel for creating and editing milestone details. |
| **Drawer Resize Splitter** | `NodeDrawer.tsx` | Left-edge draggable splitter handle to resize the drawer width. |
| **Bottom Matrix Panel** | `BottomMatrixPanel.tsx` | Resizable bottom spreadsheet view of all milestones across tracks. |
| **Bottom Splitter** | `page.tsx` | Horizontal draggable splitter controlling bottom panel height. |
| **Top Toolbar** | `TopToolbar.tsx` | Header bar with search input, zoom controls, and grid styles. |
| **Add Timeline Modal** | `AddTimelineModal.tsx` | Pop-up modal for creating a new track or branching an existing one. |

---

## 📚 Component Dictionary

### 1. `Track Wire` (Branch Line)

- **Location**: `src/components/BranchConnectionLayer.tsx`
- **Visual**: A taut horizontal line at `wireY = trackTop + 28px` spanning across the canvas.
- **Behavior**: Milestones hang directly from this wire. Line segments stop cleanly at outer knot perimeters to avoid slicing through knot centers.
- **Opacity**: 100% on the active/selected track; dimmed to 35% on inactive tracks.

### 2. `Knot Peg` (Timeline Knot)

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Visual**: Circular 20px anchor clamped directly onto the Track Wire.
  - **Completed (Locked)**: Solid white disc with black padlock icon (`Lock`).
  - **Completed (Unlocked)**: Solid white disc with black checkmark (`Check`).
  - **In Progress**: Dark disc with white border and pulsing center ping.
  - **Planned**: Dark disc with muted gray center dot.
  - **Blocked**: Dashed outline disc with alert exclamation point (`!`).
- **Interaction**: Click directly on the knot peg of a completed milestone to toggle lock/unlock.

### 3. `Hanger Stem` (Hook Stem)

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Visual**: Vertical technical drafting dashed line (`border-l border-dashed border-[#ececf0]/75`) dropping from the knot peg down to the card.
- **Behavior**: Dynamically extends when cards occupy lower collision avoidance lanes (`top: 56px + lane * 130px`).

### 4. `Node Lock`

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Rule**: All milestones with `status === 'completed'` are locked by default (`isLocked = true`).
- **Behavior**:
  - Prevents accidental horizontal dragging along the branch line.
  - Displays a floating badge when drag is attempted: `🔒 Milestone locked — click padlock to unlock`.
  - Disables right-edge duration resizing while locked.
  - Single click on the padlock button (in the card header, knot peg, or hover menu) unlocks the milestone for moving.

### 5. `Time Ruler` & `Today Indicator`

- **Location**: `src/components/TimeRuler.tsx`
- **Visual**: Top fixed ruler with hierarchical scale markings (Millennia, Centuries, Decades, Years, Months, Days) dynamically adapting to canvas zoom level.
- **Today Marker**: A vertical highlighted line and scrubber indicating current real-world time.

### 6. `Left Track Dock` & `Dock Splitter`

- **Location**: `src/components/LeftTrackDock.tsx`, `src/components/ChronoCanvas.tsx`
- **Visual**: Pinned left sidebar displaying track summaries, color pills, node counts, and track management buttons.
- **Splitter**: Draggable right border (`cursor-col-resize`) adjusting sidebar width between 220px and 560px.
- **Storage**: Persisted to `localStorage.getItem('timeline_studio_dock_width')`.

### 7. `Chrono Canvas` & `Notebook Quad Grid`

- **Location**: `src/components/ChronoCanvas.tsx`
- **Visual**: Infinite 2D scrollable drawing plane.
- **Grid Modes**:
  - `notebook`: Dual-layer graph paper grid (24px minor quad squares, 120px major blocks).
  - `dots`: Minimalist bullet journal dot grid.
  - `plain`: Clean dark charcoal background (`#101114`).

### 8. `Between Node Inserter`

- **Location**: `src/components/BetweenNodeInserter.tsx`
- **Visual**: Vertical dashed line with a circular `+` button positioned midway between adjacent knots on the wire.
- **Interaction**: Hover to reveal; click to open Node Drawer pre-filled with the calculated midpoint date. Disabled on dimmed/unselected tracks.

### 9. `Timeline Node Card` & `Duration Resize Handle`

- **Location**: `src/components/TimelineNodeCard.tsx`
- **Visual**: Tactile charcoal card (`#18191e`) suspended from the wire.
- **Controls**:
  - **Card Header**: Drag handle / Lock button, formatted date span, inline quick actions (Edit, Branch, Insert, Delete).
  - **Card Body**: Milestone title, description preview, tag pills, priority dot.
  - **Right Edge**: Transparent grab handle (`w-2 cursor-ew-resize`) for dragging to extend/shorten duration.

### 10. `Branch Curve` & `Dependency Line`

- **Location**: `src/components/BranchConnectionLayer.tsx`
- **Branch Curve**: Smooth cubic Bézier spline curving from a parent knot down to a branched child track.
- **Dependency Line**: Directional dotted line (`strokeDasharray="4 3"`) representing prerequisite or blocking relations between milestones across any tracks.

### 11. `Node Drawer` & `Drawer Resize Splitter`

- **Location**: `src/components/NodeDrawer.tsx`
- **Visual**: Slide-over inspector panel on the right side of the screen for comprehensive milestone data entry.
- **Resize Handle**: Vertical splitter on the left edge (`w-4 cursor-col-resize`). Drag left to widen (up to 1100px / 96vw), drag right to narrow (min 360px). Double-click resets to default 480px.
- **Storage**: Persisted to `localStorage.getItem('timeline_studio_node_drawer_width')` to keep the database lean.

### 12. `Bottom Matrix Panel` & `Bottom Splitter`

- **Location**: `src/components/BottomMatrixPanel.tsx`, `src/app/page.tsx`
- **Visual**: Spreadsheet-like matrix view at the bottom of the screen.
- **Splitter**: Horizontal border handle (`h-2 cursor-row-resize`). Drag up/down to adjust height. Double-click collapses/expands the panel.
- **Storage**: Height and collapse states are persisted to `localStorage`.

---

## 💬 Example Phrasing Guide

Use these concise English phrasing examples during development:

- *"Increase the vertical gap between the **Track Wire** and the **Timeline Node Card** by 10px."*
- *"Make the **Knot Peg** slightly larger and highlight its border on hover."*
- *"In the **Node Drawer**, add a color picker field for custom node accents."*
- *"On double-clicking the **Bottom Splitter**, expand it to 50% viewport height."*
- *"Smooth out the curvature of the **Branch Curve**."*
- *"Increase dash spacing on the **Dependency Line**."*
- *"Add a brief shake animation to **Timeline Node Card** when an attempt is made to move a locked node."*
- *"Adjust the font weight of tick labels on the **Time Ruler**."*
