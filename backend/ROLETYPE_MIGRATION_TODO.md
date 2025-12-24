# roleType → agentType Migration Tracker

## Completed ✅
- [x] `src/db/schema.ts` - Updated schema definition
- [x] `src/db/migrations/026_agent_config_refactor.sql` - Migration created
- [x] `src/services/roadmapAgentSync.service.ts` - Now creates single roadmap_coach per tenant

## In Progress 🔄
None

## Pending ⏳

### High Priority (Breaks after migration runs)
These files directly query `roleType` and will fail after the migration:

1. **`src/services/agentConfig.service.ts`** (lines 31, 36, 107)
   - `getConfigForTenantAndRole()` - queries by roleType
   - `mapToAgentConfig()` - maps roleType field
   - **Action**: Rename to `getConfigForTenant()`, remove role parameter, update to use agentType

2. **`src/services/agentRouter.service.ts`** (line 201)
   - `getAgentConfigForRole()` - queries by roleType
   - **Action**: Since we have one assistant per tenant now, this should just `getConfigForTenant()`

3. **`src/services/assistantQuery.service.ts`** (lines 77, 121, 149)
   - Multiple references to roleType
   - **Action**: Update to use agentType

4. **`src/services/agent.service.ts`** (lines 394, 630, 658)
   - References to roleType
   - **Action**: Update to use agentType

### Medium Priority (May still work but deprecated)
These files reference roleType but may not immediately break:

5. **`src/controllers/assistantAgent.controller.ts`** (line 48)
6. **`src/controllers/agentThread.controller.ts`** (lines 55, 203)
7. **`src/services/assistantProvisioning.service.ts`** (lines 142, 281)
8. **`src/controllers/superadmin.controller.ts`** (lines 765, 777)
9. **`src/controllers/superadminAssistant.controller.ts`** (line 30)

### Scripts (Low Priority - can be updated as needed)
10. **`src/scripts/agentsProvision.ts`** - Old provisioning script
11. **`src/scripts/generate_roadmap_summary.ts`** - Script
12. **`src/scripts/hydrate_business_context.ts`** - Script
13. **`src/scripts/reprovision_hayes_assistant.ts`** - One-off script

### Routes (Update for API consistency)
14. **`src/routes/assistantAgent.routes.ts`** (line 17)
15. **`src/routes/superadminAssistant.routes.ts`** (line 19)

## Type System Updates Needed

Check and update:
- `src/types/agent.types.ts` - AgentConfig type definition
- `src/types/agent.ts` - Any roleType references

## Testing Checklist

After all updates:
- [ ] Run migration 026
- [ ] Verify one config per tenant: `SELECT tenant_id, COUNT(*) FROM agent_configs GROUP BY tenant_id`
- [ ] Test roadmap generation → triggers syncAgentsForRoadmap
- [ ] Test assistant query → should use single roadmap_coach
- [ ] Test owner customInstructions update
- [ ] Verify no runtime errors referencing roleType

## Notes

**Why not update everything in one go?**
- Ticket 2 scope: Fix the provisioning pipeline (roadmapAgentSync)
- Other services need Ticket 3 (capability profiles) to replace the role-based routing logic
- This staged approach prevents breaking changes mid-refactor
