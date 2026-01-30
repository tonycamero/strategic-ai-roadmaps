# EXEC-THEME-ALIGNMENT-001: Align Public Pages with Portal Theme

## Status: Applied

## Objective
The user requires all public-facing pages (Landing, Auth, Webinar, RoadmapViewer) to strictly mirror the visual theme of the internal Tenant Portal (`DashboardV6`). The previous "Strategic Dark" (Navy/Teal/Purple) and "Enterprise Light" themes are to be discarded in favor of the Portal's **Slate/Blue/Emerald** aesthetic.

## Portal Theme Specification (Canonical)
Based on `DashboardV6.tsx` and `OwnerDashboard.tsx`:
- **Background**: `bg-slate-950`
- **Surface/Cards**: `bg-slate-900/40` or `bg-slate-900/60`
- **Borders**: `border-slate-800`
- **Typography**: 
  - Heading/Primary: `text-slate-100`
  - Body/Muted: `text-slate-400`
- **Primary Action**: `bg-blue-600 hover:bg-blue-700`
- **Accents**: `emerald-400`, `blue-400`
- **Gradients**: Subtle usage, primarily slate-based or low-opacity blue.

## Scope of Changes
1. **Global Styles**: Update `index.css` to `bg-slate-950` and `text-slate-400`.
2. **Components to Refactor**:
   - `LandingPage.tsx`
   - `Auth.tsx`
   - `Signup.tsx`
   - `Webinar.tsx`
   - `RoadmapViewer.tsx`
   - `OrganizationTypeStep.tsx` (Onboarding)
   - `BusinessProfile.tsx` (Onboarding)
3. **Removal**: Remove usage of `brand-purple`, `brand-teal`, `bg-navy-*`, `bg-background`, `bg-surface`.

## Constraints
- Do NOT change the Portal (`DashboardV6` etc).
- STRICT matching of the Portal's color palette.
