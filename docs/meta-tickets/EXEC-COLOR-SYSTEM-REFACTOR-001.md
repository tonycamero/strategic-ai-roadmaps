# EXEC-COLOR-SYSTEM-REFACTOR-001: Refining StrategicAI App Design

## Status: Completed

## Objective
Refine the StrategicAI.app design to follow an "Enterprise Light" aesthetic, moving away from dark Slate Blue Gray to a premium "Royal Blue and White" palette (similar to Stripe or McKinsey).

## Design System Updates

### Colors (Tailwind Config)
- **Background**: `#F8FAFC` (Slate 50)
- **Surface**: `#FFFFFF` (Pure White)
- **Primary Text (Navy)**: 
  - 900: `#0F172A` (Heading)
  - 700: `#334155` (Body)
- **Primary Accent (Royal)**: `#1D4ED8`
- **Secondary Accent (Electric)**: `#3B82F6`
- **Muted/Borders (Slate)**: 
  - 200: `#CBD5E1` (Borders)
  - 500: `#64748B` (Muted text)

### Components Updated
1. **LandingPage.tsx**: 
   - Full rewrite of section backgrounds and card styling.
   - "Friction" cards: White background with subtle slate borders.
   - "Flow" cards: White background with Royal Blue text and borders.
   - Hero: Updated gradients and blur effects for light mode.
   - Navigation: Sticky white navigation with backdrop blur.
2. **Auth.tsx (Login)**:
   - Shifted to white card on light slate background.
   - Primary button updated to Royal Blue.
3. **Signup.tsx**:
   - Consistent with Auth styling.
   - Updated form inputs to use soft slate backgrounds and royal focus states.

### Global Styles
- **index.css**:
  - Set global body background to `#F8FAFC`.
  - Set global text color to `#334155`.
  - Updated `.bg-primary-gradient` and `.shadow-inset-card` for light mode.

## Next Steps
- User to verify visual consistency across other internal dashboard pages.
- User to address environment-specific TypeScript/Lint errors (module type declarations for 'react', 'wouter', etc.).
- Remove any remaining legacy dark-mode colors from nested components if found.
