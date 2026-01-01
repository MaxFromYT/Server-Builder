# Hyperscale: The Data Center Architect - Design Guidelines

## Design Approach

**Selected Approach:** Design System with Sci-Fi Dashboard Aesthetic

**Justification:** This is a highly technical, data-dense simulation requiring precision, hierarchy, and glass-cockpit visualization. Drawing inspiration from:
- Fluent Design (enterprise data applications)
- Sci-fi game UIs (Elite Dangerous, Star Citizen)
- Professional monitoring tools (Grafana, Datadog)

**Core Principles:**
- Technical precision over decoration
- Information density without clutter
- Layered transparency and depth for "glass cockpit" feel
- Immediate comprehension of system state

---

## Typography

**Font Stack:**
- **Primary (UI):** IBM Plex Sans - technical, readable at small sizes, excellent for data tables
- **Monospace (Metrics/Code):** JetBrains Mono - for IP addresses, config snippets, numerical data
- **Accent (Headers):** Orbitron (via Google Fonts CDN) - futuristic, used sparingly for major section headers

**Hierarchy:**
- **Dashboard Headers:** text-2xl font-bold (Orbitron)
- **Panel Titles:** text-lg font-semibold
- **Body/Labels:** text-sm font-medium
- **Metrics/Data:** text-base font-mono
- **Fine Print/Status:** text-xs
- **Critical Alerts:** text-lg font-bold uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12** exclusively
- Micro spacing: 2 (p-2, gap-2)
- Standard spacing: 4, 6
- Section spacing: 8, 12

**Grid Structure:**
- **NOC Dashboard:** 12-column grid with sidebar (3 cols) + main (9 cols)
- **Build Mode:** Centered workspace with floating tool palettes
- **Responsive:** Stack to single column below lg breakpoint

**Container Strategy:**
- Full viewport height interfaces (h-screen)
- No scrolling on primary dashboards - use internal panel scrolling
- Fixed sidebars, scrollable content areas

---

## Component Library

### Core Navigation
**Top Bar (NOC Mode):**
- Fixed h-16 navigation with breadcrumb system
- Status indicators (facility power, uptime, active alerts)
- Mode switcher buttons (Build | Floor Plan | Network | NOC | Incidents)
- User menu and notification bell

**Left Sidebar (3-column in 12-grid):**
- Collapsible rack tree view
- System health summary cards
- Quick action buttons
- Scrollable content area with fixed header

### Data Display Components

**Metric Cards:**
- Compact cards with large numerical display
- Label + value + unit + sparkline trend
- Status indicators (within SLA, warning, critical)
- Grid layout: grid-cols-2 md:grid-cols-4 gap-4

**Alert Stream:**
- Fixed-height scrollable feed (h-64)
- Timestamp + severity badge + message + source
- Auto-scroll with pause on hover
- Grouped by severity

**Configuration Tables:**
- Dense data tables with sticky headers
- Alternating row treatment for readability
- Inline edit capabilities with validation states
- Sort/filter controls in header row

**Network Topology Visualization:**
- SVG-based node-link diagrams
- Hierarchical layout (spine at top, leaf middle, ToR bottom)
- Animated flow indicators
- Interactive hover states with connection details

**3D Facility View:**
- Canvas element occupying main content area
- Overlay HUD with clickable hotspots
- Minimap in corner (h-32 w-48)
- Zoom/pan controls

### Build Mode Components

**Component Palette:**
- Floating panel (w-80) with categorized hardware
- Search/filter input at top
- Draggable component cards with specs preview
- Grid layout with images + key specs

**Assembly Workspace:**
- Center-aligned 3D rack view
- U-space rulers on both sides
- Snap guides and conflict indicators
- Bottom toolbar: undo/redo, validate, save, deploy

**Properties Panel:**
- Right-aligned (w-96) when component selected
- Tabbed interface: Specs | Configuration | Cables | Notes
- Form controls for settings
- Real-time validation feedback

**Cable Routing Interface:**
- Transparent overlay on 3D view
- Click-to-connect workflow
- Airflow impact visualization bars
- Label suggestion system

### Forms & Inputs

**Input Fields:**
- Consistent height: h-10
- Label above input pattern
- Helper text below with text-xs
- Validation icons inline-right

**Dropdowns/Selects:**
- Custom styled selectors with chevron
- Grouped options for hardware categories
- Search within dropdown for long lists

**Toggles/Switches:**
- Binary configuration options
- Label left, control right layout
- Immediate effect with confirmation toast

### Modals & Overlays

**Incident Response Modal:**
- Full-screen overlay with semi-transparent backdrop
- Centered max-w-4xl panel
- Header: incident severity + timestamp + affected systems
- Body: tabbed details (Symptoms | Timeline | Actions | Resolution)
- Footer: action buttons (Acknowledge, Escalate, Resolve)

**Configuration Wizards:**
- Multi-step flows with progress indicator
- max-w-2xl centered
- Previous/Next navigation
- Summary step before commit

### Specialized Visualizations

**Thermal Heatmap:**
- Rack-level temperature gradients
- Side-by-side intake/exhaust views
- Legend with threshold markers
- Clickable zones for drill-down

**Power Distribution Tree:**
- Hierarchical from utility → UPS → PDU → rack
- Branch thickness indicates load percentage
- Warning highlights on oversubscription

**Performance Graphs:**
- Time-series line charts (recharts library via CDN)
- Multi-metric overlays with dual Y-axes
- Draggable time range selector
- Export to PNG functionality

---

## Mode-Specific Layouts

**Build Mode:** Centered workspace + floating palettes
**Floor Planning:** Top-down 2D grid with drag-drop racks
**Network Config:** Split view (topology left, config right)
**NOC Dashboard:** 12-column grid (3-col sidebar, 9-col multi-panel main)
**Incident Response:** Modal overlay on current context

---

## Animations

**Use Sparingly:**
- Alert pulse on new critical events (subtle scale)
- Data refresh transitions (fade opacity)
- Modal entry/exit (scale + fade, 200ms)
- NO scroll animations, NO decorative effects

---

## Images

**Hero/Splash:** Full-screen facility render on launch (not a marketing hero, but an immersive load screen showing the current data center state)

**Component Thumbnails:** Small hardware preview images in palettes (server chassis, switch front panels, etc.)

**Background Textures:** Subtle grid patterns in workspace areas to suggest technical schematic aesthetic