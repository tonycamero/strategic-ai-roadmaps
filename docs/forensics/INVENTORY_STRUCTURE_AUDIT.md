# Forensic Audit: Inventory File System Structure
**Status:** COMPLETE
**Target Ticket:** META-TICKET-INVENTORY-STRUCTURE-001

## 1. Directory Tree
- **Source of Truth (Markdown):** `docs/sop-ticket-inventories/` (11 files)
- **Runtime Target (JSON):** `backend/src/trustagent/inventory/` (10 files)
- **Mapping:** Managed by `FILE_MAPPING` in `normalize-inventories.ts`.

## 2. Structural Analysis
- **Schema:** Consistent JSON blocks within markdown headers.
- **Fields Present:** `inventoryId`, `titleTemplate`, `category`, `valueCategory`, `ghlComponents`, `isSidecar`, `implementationStatus`, `complexity`, etc.
- **Missing Protocol Fields:**
  - `namespace`: Not implemented.
  - `adapter`: Not implemented.
  - `complexityTier`: Uses `complexity` instead.
  - `version`: Not implemented.

## 3. Parsing & Normalization
- **Script:** `backend/scripts/normalize-inventories.ts`.
- **Logic:** Regex extraction from markdown → JSON cleanup → Schema validation.
- **Errors:** Invalid blocks are logged but skipped; `implementationStatus` defaults to `production-ready`.

## 4. Runtime Registry
- **Service:** `inventory.service.ts`.
- **Loading:** Lazy-loaded and cached in-memory. Merges all 10 category files into one authoritative list.
- **Registry Usage:**
  - Used by `sopTicketGenerator.service.ts` for canonical selection.
  - **Bypassed** by Stage 6 activation which derives inventory from markdown on-the-fly.

## 5. Drift & Coupling
- **ID Fragmentation:** 
  - Canonical: `PM_UNIFY_LEAD_CAPTURE` (from registry)
  - Legacy/Stage 6: `INV-DERIVED-4a2e` (derived from markdown text)
- **Coupling:** Hardcoded file lists in both script and service; no dynamic extension support.

---
**Audit Complete.**
