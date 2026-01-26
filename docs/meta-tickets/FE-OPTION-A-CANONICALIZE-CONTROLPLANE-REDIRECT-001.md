---
id: FE-OPTION-A-CANONICALIZE-CONTROLPLANE-REDIRECT-001
owner: Tony
priority: P0
goal: Single canonical Firm Detail surface. Kill legacy route + zombie page. Fastest path to clean build.
context: |
  We have two firm detail pages:
  - Canonical V2 Control Plane: /superadmin/execute/firms/:tenantId -> SuperAdminControlPlaneFirmDetailPage
  - Legacy detail route: /superadmin/firms/:tenantId -> SuperAdminFirmDetailPage
  Maintaining both creates zombie code + constant V1/V2 contract conflicts. We will canonicalize to Control Plane.
scope:
  - frontend/src/superadmin/SuperAdminLayout.tsx
  - frontend/src/superadmin/pages/SuperAdminExecutePage.tsx
  - frontend/src/superadmin/components/strategy/StrategyActivityFeed.tsx
  - frontend/src/pages/CaseStudyViewer.tsx
  - frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx (DELETE)
execution_steps:
  1: Canonicalize route authority (Redirect legacy tenant detail) in SuperAdminLayout.tsx.
  2: Update internal navigation to canonical route in SuperAdminExecutePage.tsx.
  3: Hunt remaining old-route links and update them.
  4: Delete frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx.
  5: Verify with tsc and pnpm build.
---

# Execution Log

1.  **Ticket Created**: [Date]
2.  **Analysis**:
    -   Legacy Route: `/superadmin/firms/:tenantId`
    -   Target Route: `/superadmin/execute/firms/:tenantId`
3.  **Modifications**:
    -   `SuperAdminLayout.tsx`: Swapped Route for Redirect.
    -   `SuperAdminExecutePage.tsx`: Updated `onViewFirm` link.
    -   [Other files found via grep]: Updated links.
4.  **Deletion**:
    -   Deleted `SuperAdminFirmDetailPage.tsx`.
5.  **Verification**:
    -   TS Check: [Pending]
    -   Build: [Pending]
