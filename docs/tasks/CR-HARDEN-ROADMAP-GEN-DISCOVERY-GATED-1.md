# CR-HARDEN-ROADMAP-GEN-DISCOVERY-GATED-1

## 🎯 OBJECTIVE
Restore the original, operator-grade Roadmap Generation workflow by **making Discovery Call synthesis a first-class, mandatory input** to ticket selection and moderation.

## 🚨 PROBLEM STATEMENT
The current SOP-01 → Ticket pipeline:
* Ignores Discovery Call outputs
* Extracts tickets directly from SOP-01 artifacts
* Produces low-volume, low-relevance tickets
* Violates the original ≥12 curated tickets invariant
* Breaks alignment with the GHL Inventory Model (70+ candidates)

## 🛠️ REQUIRED CHANGES

### 1️⃣ Introduce **Discovery Synthesis Artifact** (Canonical)
Stored in: `tenant_documents`
Type: `DISCOVERY_SYNTHESIS_V1`

```ts
DiscoverySynthesis {
  tenantId: UUID
  diagnosticId: string
  synthesizedSystems: string[]        // system-level opportunities
  selectedInventoryIds: string[]      // from GHL master inventory
  exclusions: string[]                // consciously rejected items
  operatorNotes: string
  confidenceLevel: 'high' | 'medium' | 'low'
}
```

### 2️⃣ Enforce **Discovery-Gated Ticket Generation**
Ticket Generation MUST:
* ❌ Never run from SOP-01 alone
* ✅ Require `DiscoverySynthesis.selectedInventoryIds.length >= 12`
* ✅ Generate tickets **from inventory**, not markdown parsing

**Hard Gate**
```ts
if (!discoverySynthesis || selectedInventoryIds.length < 12) {
  return 409 ROADMAP_PREREQUISITES_REQUIRED
}
```

### 3️⃣ Reframe SOP-01 Ticket Extraction (Downgrade)
SOP-01 extraction becomes:
* **Suggestive only**
* Used to *inform* Discovery
* Never used to auto-persist tickets

### 4️⃣ Restore the GHL Inventory as the Source of Truth
Ticket creation must:
* Reference canonical GHL inventory IDs
* Preserve tags: `core`, `critical`, `recommended`, `advanced`
* Maintain sprint balancing (30/60/90)

### 5️⃣ UI / Operator Flow Fix
**SuperAdmin UI changes**
* Discovery Call panel must:
  * Select from inventory
  * Explicitly confirm ≥12 selections
  * Show exclusions
* Disable “Generate Tickets” until Discovery is complete

## 🧪 VERIFICATION CHECKLIST
* [ ] Ticket count ≥ 12 post-Discovery
* [ ] All tickets map to inventory IDs
* [ ] No tickets created without Discovery artifact
* [ ] SOP-01 rerun does NOT regenerate tickets unless Discovery is rerun
* [ ] Operator can explain *why* each ticket exists
