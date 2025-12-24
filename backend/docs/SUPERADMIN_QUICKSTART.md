# SuperAdmin Quick-Start Guide — Phase 1 Inventory System

**Goal:** Generate inventory-driven SOP tickets for Hayes or BrightFocus and verify the system works.

---

## Step 1: Run the Database Migration

The new columns need to be added to the `sop_tickets` table.

```bash
cd /home/tonycamero/code/Strategic_AI_Roadmaps/backend
pnpm run migrate
```

**Expected output:**
```
✅ Migration 029_add_inventory_tracking.sql applied successfully
```

---

## Step 2: Verify Inventory Loaded

Confirm all 79 SOPs are available:

```bash
npx ts-node scripts/test-inventory-load.ts
```

**Expected output:**
```
📦 Loading 10 inventory files...

✅ chamber.inventory.json           5 items (5 GHL-native, 0 sidecars)
✅ crm.inventory.json               9 items (9 GHL-native, 0 sidecars)
...
📊 Total: 79 SOPs
   - GHL-native: 71
   - Sidecars: 8
```

---

## Step 3: Trigger Ticket Generation for a Tenant

### Option A: Use Existing SuperAdmin UI

If you have a "Generate Ticket Pack" or "Regenerate Roadmap" button in the SuperAdmin UI:

1. **Go to SuperAdmin dashboard**
2. **Select Hayes Realty or BrightFocus tenant**
3. **Click "Generate Ticket Pack" or "Regenerate Roadmap"**

The system will:
- Load the tenant's diagnostic
- Build selection context (firm size, vertical, pain signals)
- Select 10-14 SOPs from the 79-item inventory
- Generate full tickets using GPT-4o
- Save tickets with `inventory_id` populated

### Option B: Use Backend Script

If there's no UI button yet, trigger via backend script:

```bash
# Example for Hayes (replace with actual tenant UUID)
npx ts-node -e "
  import { ingestDiagnostic } from './src/services/diagnosticIngestion.service';
  import { db } from './src/db';
  import { diagnostics, tenants } from './src/db/schema';
  import { eq } from 'drizzle-orm';
  
  async function run() {
    // Get Hayes tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.name, 'Hayes Realty')
    });
    
    if (!tenant) throw new Error('Hayes tenant not found');
    
    // Get latest diagnostic
    const diagnostic = await db.query.diagnostics.findFirst({
      where: eq(diagnostics.tenantId, tenant.id),
      orderBy: (d, { desc }) => [desc(d.createdAt)]
    });
    
    if (!diagnostic) throw new Error('No diagnostic found');
    
    // Trigger ingestion
    const result = await ingestDiagnostic(diagnostic.diagnosticMap);
    
    console.log('✅ Generated', result.ticketCount, 'tickets');
  }
  
  run().then(() => process.exit(0)).catch(console.error);
"
```

---

## Step 4: Verify in Database

Check that tickets have inventory IDs:

```sql
SELECT 
  ticket_id,
  inventory_id,
  is_sidecar,
  category,
  tier,
  title 
FROM sop_tickets 
WHERE tenant_id = '<hayes-tenant-uuid>'
ORDER BY sprint, tier
LIMIT 20;
```

**Expected results:**
- ✅ Every row has a non-null `inventory_id` (e.g., "PM_UNIFY_LEAD_CAPTURE", "SIDE-001")
- ✅ `is_sidecar` is `true` for 0-1 tickets (Hayes is micro tier)
- ✅ Categories match inventory (Pipeline, CRM, Ops, etc.)
- ✅ Tiers are distributed: core (~40%), recommended (~40%), advanced (~20%)

### Expected Hayes Results

**Firm Profile:**
- Size: Micro (5 people)
- Vertical: Generic (no real_estate vertical SOPs yet)
- Pain signals: pipeline, followup, reporting, owner dependency

**Expected Selection:**
- Total: ~10 tickets
- Pipeline: 4 SOPs (followupPain triggers heavy allocation)
- Ops: 2 SOPs
- CRM: 2 SOPs
- Reporting: 1 SOP
- Team: 1 SOP
- Sidecars: 1 (likely "SIDE-001" - Lead Inactivity Watchdog)

---

## Step 5: Test Sidecar Detection

Look for sidecar tickets:

```sql
SELECT 
  inventory_id,
  title,
  category
FROM sop_tickets 
WHERE tenant_id = '<hayes-tenant-uuid>'
  AND is_sidecar = true;
```

**For Hayes (micro):**
- Should see 0-1 sidecar (only if strong pain signals)
- If present, likely "SIDE-001" or "SIDE-004"

**For BrightFocus (small agency, ~10 people):**
- Should see 2-3 sidecars
- Expected: "SIDE-001" (monitoring) + "SIDE-004" (analytics) + 1 more

---

## Step 6: View in Moderation UI

If you have a ticket moderation UI:

1. **Go to ticket moderation page**
2. **Filter by tenant (Hayes or BrightFocus)**
3. **Verify:**
   - Ticket titles match inventory templates
   - Sidecar tickets clearly marked (or have distinct categories)
   - No weird/hallucinated categories
   - All tickets have proper tier assignments

---

## Common Issues & Fixes

### Issue: Migration fails

**Symptom:** Error about column already exists
**Fix:** The column was already added. Check:
```sql
\d sop_tickets
```
Look for `inventory_id` and `is_sidecar` columns.

### Issue: No tickets generated

**Symptom:** Ticket count = 0
**Fix:** 
1. Check tenant has a diagnostic
2. Check diagnostic has `diagnosticMap` data
3. Check logs for selection errors

### Issue: inventory_id is NULL

**Symptom:** All `inventory_id` values are NULL
**Fix:** 
1. GPT-4o didn't return `inventoryId` in response
2. Check prompt includes inventory instructions
3. Re-run generation

### Issue: Wrong number of tickets

**Symptom:** Hayes gets 20 tickets instead of 10
**Fix:**
1. Check selection context is building correctly
2. Verify `firmSizeTier` is set on tenant
3. Check selector logs in console

---

## Success Metrics

Phase 1 is working if:

1. ✅ Migration runs clean
2. ✅ Inventory loads (79 SOPs)
3. ✅ Tickets have non-null `inventory_id`
4. ✅ Sidecar allocation matches firm size
5. ✅ No hallucinated categories or tiers
6. ✅ Tier distribution is roughly 40%/40%/20%

---

## Next Steps After Verification

Once Phase 1 is confirmed working:

1. **Test with BrightFocus** (should get 14 tickets, 3 sidecars)
2. **Review sidecar allocation** - does it feel right?
3. **Check moderation UI** - can you approve/reject easily?
4. **Generate a full roadmap** - does it read well?

Then move to:
- **Phase 2:** Vertical-specific SOPs (real estate, agency, trades)
- **Phase 3:** Advanced sidecars + sidecar API services

---

## Need Help?

Check documentation:
- **Blueprint:** `docs/SOP_INVENTORY_BLUEPRINT.md`
- **Implementation:** `docs/PHASE_1_IMPLEMENTATION_SUMMARY.md`
- **Validation:** `docs/SELECTOR_V1_VALIDATION.md`

Or review selector logs:
```bash
# Look for selection output in console
grep "InventorySelection" backend-logs.txt
```

---

**Phase 1 is production-ready. Go test it!** 🚀
