# EXECUTION TICKET: EXEC-FE-SALES-PAGES-IMPLEMENTATION-001

## Goal
Implement a series of new public-facing sales/marketing pages and update the Homepage based on provided markdown content, adhering to the "Public Copy Edit Boundary" policy (this falls under authorized new public content).

## Source Content
Located in `docs/FE sales pages/`:
- `strategicai_home.md` -> Update `HomePage.tsx`
- `smb_sales_page.md` -> Create `/smb`
- `strategicai_authority_economics.md` -> Create `/economics` (or `/authority-economics`)
- `strategicai_authority_partner.md` -> Create `/partner`
- `strategicai_certified_operator.md` -> Create `/operator` (or `/certified-operator`)
- `strategicai_features.md` -> Create `/features`
- `partner_revenue_simulator.jsx` -> Integrate into `/economics` or `/partner`.

## Plan
1.  **Read & Parse Content:** Ingest all markdown files to understand structure and copy.
2.  **Update Homepage:**
    - Replace existing marketing copy in `HomePage.tsx` with `strategicai_home.md` content.
    - Wire up links to the new pages (footer, "Related" sections, or inline).
3.  **Scaffold New Pages:**
    - Create new `tsx` files in `frontend/src/pages/public/` (or similar clean directory).
    - Implement responsive, premium UI components matching the established design system (Tailwind + Framer Motion if available).
4.  **Routing:**
    - Register new routes in `App.tsx` (ensure they are public/unprotected).
5.  **Integration:**
    - Add the Revenue Simulator component where contextually relevant.
6.  **Verification:**
    - Confirm all pages load.
    - Confirm links work.
    - Confirm strictly no Tenant/App surfaces are touched (aside from `App.tsx` routing).

## Constraints
- **Public Only:** No authenticated pages or logic changes.
- **Design:** Use existing "TrustConsole" aesthetic (dark mode, crisp typography).
- **Navigation:** Do NOT clutter the top nav. Use contextual links or footer.

## Output
- Modified: `HomePage.tsx`, `App.tsx`
- New: 5+ new Page components.
