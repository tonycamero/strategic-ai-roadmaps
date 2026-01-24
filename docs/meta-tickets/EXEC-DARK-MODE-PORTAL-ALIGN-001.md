# EXECUTION TICKET: Strategic Dark Mode Alignment (EXEC-DARK-MODE-PORTAL-ALIGN-001)

## Status: IN_PROGRESS
## Priority: CRITICAL (Brand Consistency Pivot)

## 1. Objective
Refactor the StrategicAI.app frontend (Landing Page, Auth, Signup) to align with the "Rich Dark" dashboard aesthetic. Transition from the current light theme to a premium deep charcoal/navy/teal palette to establish instant brand trust.

## 2. Design Specifications
- **Base Background**: `#121212` (Deep Charcoal)
- **Surface/Card Background**: `#1E1E2E` (Dark Navy)
- **Primary Accent**: `#4B2E83` (Deep Purple) - Used for header bars, active states, and glows.
- **Action/CTA Accent**: `#00C2B8` (Teal) - Used for buttons, progress bars, and high-conversion elements.
- **Success Accent**: Green (`#10B981`) for completion/checkmarks.
- **Typography**: 
    - Headings: White/Off-white
    - Body: Muted Slate-Gray
- **Interactive**: Subtle glows on card hover, gradient text using Purple -> Teal.

## 3. Scope of Work
- [ ] **`tailwind.config.js`**: Update color palette with new dark-mode tokens.
- [ ] **`index.css`**: Update global body background, text colors, and custom utility gradients/shadows (glows).
- [ ] **`LandingPage.tsx`**: Full redesign of sections to use dark surfaces and teal/purple accents.
- [ ] **`Auth.tsx` / `Signup.tsx`**: Update card styling and input fields for the dark theme.

## 4. Constraints
- Preserve all existing logic and auth flows.
- Surgical edits to Tailwind classes.
- Ensure high contrast for accessibility despite the dark theme.
