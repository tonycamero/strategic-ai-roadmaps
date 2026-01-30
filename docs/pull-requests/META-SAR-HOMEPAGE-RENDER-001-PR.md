# Pull Request: META-SAR-HOMEPAGE-RENDER-001

## Summary
Refreshed the StrategicAI.app homepage to match the **Render Intent Spec (V2)**. This replaces the legacy "Eugene Cohort" landing page with the new comprehensive product marketing surface.

## Changes
- **Overwritten `frontend/src/pages/LandingPage.tsx`**: Implemented new sections (Hero, Problem, Platform, Audience, System, Outcome, final CTA, What This Is/Isn't) matching the spec verbatim.
- **Updated `frontend/src/App.tsx`**:
    - Reassigned `/` to `LandingPage` (StrategicAI Homepage).
    - Removed legacy `TonyCameroLanding` import and route.
    - Updated redirects for `/ai`, `/home`, etc. to point to `/`.
- **Deleted**: `frontend/src/pages/TonyCameroLanding.tsx` (Legacy personal site).

## Invariants Preserved
- **Auth/App Routes**: `/login`, `/dashboard`, `/intake/*` remain untouched.
- **Platform Logic**: No changes to `AuthContext`, `TenantContext`, or shared packages.
- **Visual Style**: Used existing Tailwind utility classes consistent with the design system (slate-950, blue-600, etc.).

## CTA Routing Map
| Spec CTA | Label | Target Route |
| :--- | :--- | :--- |
| **Primary** | [Become a Certified Operator] | `/diagnostic` |
| **Secondary** | Launch App | `/login` |
| **Secondary** | Join Live Demo | `/diagnostic` |
| **Audience 1** | [Get Certified] | `/diagnostic` |
| **Audience 2** | [Partner With StrategicAI] | `/diagnostic` |
| **Audience 3** | [See Consultant Use Case] | `/diagnostic` |
| **Final Block** | [Apply Now] | `/diagnostic` |
| **Nav** | Login | `/login` |
| **Nav** | Apply for Certification | `/diagnostic` |

## Verification
- **Build**: Referenced `leadRequest` API ensures form functionality is preserved.
- **Type Check**: Code follows React/TS patterns used in the repo.
- **Routing**: `App.tsx` switch order ensures specific routes (like `/login`, `/diagnostic`) take precedence or are correctly matched.
