# EXECUTION TICKET: Platform Design System Overhaul (v1.0)

**ID:** EXEC-PLATFORM-DESIGN-001
**Status:** In Progress
**Priority:** High

## 🎯 Objective
Elevate the visual identity of StrategicAI.app to a "Slate Blue Gray" aesthetic with clean, executive-grade contrast and modern UI patterns.

## 🛠 Design Specifications

### 1. Color Palette
- **Global Background:** `#1F2533` (Slate Blue Gray)
- **Surface / Cards:** `#252B3A`
- **Text (Headings):** `#F6F8FA`
- **Text (Body):** `#D0D4D9`
- **Text (Muted):** `#9BA5B0`
- **Accent Green:** `#3BCB78` (Checks, ROI, Highlights)

### 2. Components
- **Primary Buttons:** Gradient from `#4A8EF3` to `#79E2F2`.
- **Card Shadows:** Inset 1px `#00000033` + soft outer shadow.
- **Dividers:** Semi-transparent white horizontal lines (`white/10`).
- **Iconography:** Consistent `lucide-react` usage (Duotone/Line style).

## 📋 Implementation Tasks
- [ ] Update `tailwind.config.js` with new color tokens.
- [ ] Update `index.css` for global body background and base text colors.
- [ ] Refactor `LandingPage.tsx` to utilize the new design system.
- [ ] Audit all secondary pages for design consistency.

## 🔗 References
- Spec provided by USER in turn 187.
