# design_sprint_summary.md

## Aesthetic Direction: "Dark Premium Authority"
**Goal:** Convey rigorous, high-stakes authority while remaining modern and performant.

### 1. Color Palette
- **Background:** `slate-950` (Deepest Void)
- **Surface:** `slate-900/50` (Glassmorphism)
- **Borders:** `slate-800` (Subtle definition)
- **Text Primary:** `white` / `slate-200`
- **Text Secondary:** `slate-400` / `slate-500` (Metadata)
- **Accents:**
  - **Executive/Royal:** `purple-500` / `purple-900` (Strategy)
  - **Action/Safe:** `emerald-400` / `emerald-900` (Approved/Ready)
  - **Warning/Pending:** `amber-500` (Moderation needed)
  - **Interactive:** `indigo-500` (Buttons/Links)

### 2. UI Patterns
- **Cards:** Bordered, rounded-xl, slight shadow. No flat backgrounds; use depth.
- **Micro-Interactions:** Hover states on borders (`hover:border-slate-700`).
- **Typography:**
  - Headers: `font-bold tracking-tight`
  - Labels: `text-[10px] uppercase tracking-widest font-extrabold` (The "HUD" look).
  - Values: `font-mono` for data/dates.

### 3. "Structural Invisibility"
- **Concept:** UI elements for unauthorized roles are not just disabled; they are *removed*.
- **Implementation:** React Conditional Rendering (`{isExecutive && <Component />}`).
- **Why:** To prevent "Shadow UI" where delegates see what they *can't* do, leading to confusion or curiosity about restricted areas.

### 4. Layout Strategy
- **Container:** `max-w-7xl mx-auto p-8`
- **Header:** High contrast, clear "Authority Control Plane" badge.
- **Grids:** Responsive. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Density:** High information density, low visual clutter. Use whitespace to group, lines to separate.

### 5. Status Indicators
- **Pulse:** Used sparingly for active/pending states (`animate-pulse`).
- **Pills:** Rounded, bordered badges for statuses (`bg-surface/20 border border-color/30 text-color`).
- **Progress:** Gradient bars for completion (`from-indigo-500 to-purple-500`).

