# SuperAdmin Executive Agent — Tap-In Meta-Layer

## Vision
The SuperAdmin Executive Agent acts as Tony's **personal chief of staff** with full visibility into all Tap-In conversations across every firm. It synthesizes insights, surfaces blockers, and acts as an intelligent intermediary that makes Tap-In data actionable.

---

## Current State (v1)

### What Works
- **Tap-In Console** (`/superadmin/agent`): Direct firm-by-firm assistant access
  - SuperAdmin selects a tenant
  - Chooses role context (owner/ops/tc/agent_support)
  - Sets visibility (superadmin_only | shared)
  - Threads stored in `agent_threads` with `actorRole='superadmin'`
  - Messages persisted in `agent_messages`
  - Activity logged in `agent_logs` with `interactionMode='superadmin'`

- **Floating Executive Agent** (💬 bubble, upper right): Legacy aggregate agent
  - Uses `/api/agent/query` endpoint
  - Can query tenant metadata, intakes, roadmaps
  - **Does NOT have Tap-In awareness**

### The Gap
The executive agent and Tap-In are **siloed**. Tony can't ask:
- "What blockers did I identify across all firms this week?"
- "Summarize my last conversation with Hayes"
- "Which firms need follow-up based on my Tap-In threads?"

---

## Target Architecture (v2)

### Executive Agent Mission
**"Make Tap-In data actionable for Tony and act as an intelligent intermediary."**

The executive agent should:
1. **Read all Tap-In threads** (superadmin actorRole)
2. **Synthesize cross-firm insights**
3. **Surface patterns, blockers, and follow-ups**
4. **Answer meta-queries** like "What are the common pain points?" or "Draft a summary of this week's Tap-In activity"
5. **Optionally trigger actions** (e.g., "Send that advice to Hayes as a shared thread")

---

## Data Model

### Tables the Executive Agent Needs
```sql
-- Tap-In threads (superadmin conversations with firm assistants)
agent_threads
  ├─ tenantId (which firm)
  ├─ actorRole ('superadmin')
  ├─ visibility ('superadmin_only' | 'shared')
  ├─ roleType (owner/ops/tc/agent_support)
  ├─ openaiThreadId
  ├─ createdAt, lastActivityAt

-- Messages in those threads
agent_messages
  ├─ agentThreadId (links to agent_threads)
  ├─ role ('user' | 'assistant')
  ├─ content (message text)
  ├─ createdAt

-- Audit logs
agent_logs
  ├─ agentConfigId
  ├─ eventType ('query' | 'query_retry' | 'query_error')
  ├─ interactionMode ('superadmin')
  ├─ metadata (threadId, runId, actorRole, etc.)
  ├─ createdAt
```

### Query Patterns
**Cross-firm insights:**
```sql
-- All superadmin threads in last 7 days
SELECT t.*, tenant.name as tenantName
FROM agent_threads t
JOIN tenants tenant ON t.tenantId = tenant.id
WHERE t.actorRole = 'superadmin'
  AND t.lastActivityAt > NOW() - INTERVAL '7 days'
ORDER BY t.lastActivityAt DESC;
```

**Recent Tap-In messages for a specific firm:**
```sql
SELECT m.*
FROM agent_messages m
JOIN agent_threads t ON m.agentThreadId = t.id
WHERE t.tenantId = :tenantId
  AND t.actorRole = 'superadmin'
ORDER BY m.createdAt DESC
LIMIT 20;
```

**Threads by visibility:**
```sql
-- Shared threads (visible to owners)
SELECT * FROM agent_threads
WHERE actorRole = 'superadmin' AND visibility = 'shared';

-- Private advisory threads
SELECT * FROM agent_threads
WHERE actorRole = 'superadmin' AND visibility = 'superadmin_only';
```

---

## Implementation Plan

### Phase 1: Read-Only Tap-In Awareness
**Goal:** Executive agent can answer questions about Tap-In threads.

#### Backend Changes
1. **Update superadmin agent system prompt** (`backend/src/config/superadmin-agent-prompt.ts` or similar):
   ```
   You are Tony's executive assistant with visibility into all firm operations.
   
   You have access to:
   - Tenant metadata (business profiles, roadmaps, intakes)
   - Tap-In threads: Tony's direct conversations with each firm's assistant
   - Audit logs and activity streams
   
   When Tony asks about Tap-In data:
   - Query agent_threads, agent_messages where actorRole='superadmin'
   - Synthesize insights across firms
   - Surface blockers, patterns, follow-ups
   ```

2. **Add Tap-In context retrieval** (inject into agent query):
   - Before calling OpenAI, fetch recent Tap-In threads
   - Summarize thread metadata (firm, role, visibility, last activity)
   - Include recent message previews
   - Pass as structured context to the agent

3. **Example context injection:**
   ```ts
   // In superadmin agent query handler
   const recentTapInThreads = await db.query.agentThreads.findMany({
     where: eq(agentThreads.actorRole, 'superadmin'),
     orderBy: [desc(agentThreads.lastActivityAt)],
     limit: 10,
     with: {
       tenant: true,
       messages: { limit: 3, orderBy: [desc(agentMessages.createdAt)] }
     }
   });
   
   const tapInContext = `
   Recent Tap-In Activity:
   ${recentTapInThreads.map(t => `
   - ${t.tenant.name} (${t.roleType}, ${t.visibility})
     Last active: ${t.lastActivityAt}
     Recent messages: ${t.messages.map(m => m.content.substring(0, 100)).join('\n')}
   `).join('\n')}
   `;
   
   // Prepend to user message or inject as system context
   ```

#### Frontend Changes
- No changes needed initially
- Executive agent bubble works as-is, but now has Tap-In awareness

#### Test Queries
Once implemented, Tony can ask:
- "What firms did I tap into this week?"
- "Summarize my last conversation with Hayes"
- "What blockers came up across all Tap-In threads?"
- "Which firms need follow-up?"

---

### Phase 2: Write Actions (Optional)
**Goal:** Executive agent can create/modify Tap-In threads on Tony's behalf.

#### Use Cases
- **"Send that advice to Hayes"** → Create a shared Tap-In thread with that content
- **"Follow up with BrightFocus about their CRM"** → Draft a Tap-In message
- **"Mark all my threads from last week as shared"** → Bulk update visibility

#### Implementation
1. Add agent tools/functions:
   - `createTapInThread(tenantId, roleType, message, visibility)`
   - `updateThreadVisibility(threadId, visibility)`
   - `sendTapInMessage(threadId, message)`

2. Wire to backend mutations

3. Agent decides when to invoke these based on Tony's natural language requests

---

## Benefits

### For Tony
- **Single interface** to manage all firm interactions
- **Cross-firm insights** without manual aggregation
- **Proactive follow-ups** ("These 3 firms need attention")
- **Knowledge continuity** ("What did I tell them last time?")

### For Firms (When Shared)
- Advisor Notes become **actionable guidance**
- Clear audit trail of platform support
- Transparency into what advice was given

---

## Example Interactions

### Before (v1)
**Tony:** "What did I tell Hayes about their CRM?"  
**Agent:** "I don't have access to your Tap-In conversations."

### After (v2)
**Tony:** "What did I tell Hayes about their CRM?"  
**Agent:** "In your last Tap-In thread with Hayes (Dec 5), you advised them to prioritize integrating their CRM with their transaction management system. You noted their current lead follow-up process was manual and recommended automating it in their 30-day sprint."

---

**Tony:** "Which firms are blocked on implementation?"  
**Agent:** "Based on your Tap-In threads:
- **Hayes:** Waiting on CRM vendor access (mentioned Dec 5)
- **BrightFocus:** Need to finalize payment processor integration (Dec 3)
- **GreenLeaf:** Onboarding delayed, no recent activity"

---

**Tony:** "Send a shared note to Hayes reminding them about the CRM integration"  
**Agent:** *[Creates shared Tap-In thread]*  
"Done. I've sent a shared advisor note to Hayes referencing your previous recommendation."

---

## Technical Notes

### Performance
- Cache recent Tap-In summaries (last 7 days) in Redis or similar
- Only fetch full message history on-demand
- Use pagination for large thread lists

### Privacy
- `visibility='superadmin_only'` threads are **never** exposed to owners
- Agent respects visibility boundaries
- Audit all executive agent queries to Tap-In data

### Scalability
- As firm count grows, use semantic search over Tap-In content
- Embeddings for "find similar conversations"
- Time-based filtering to keep context window manageable

---

## Next Steps

1. **Define system prompt** for Tap-In-aware executive agent
2. **Implement context injection** (read-only, Phase 1)
3. **Test with Tony** using real Tap-In threads
4. **Iterate on synthesis quality** (what insights matter most?)
5. **(Optional) Add write actions** (Phase 2)

---

## Success Metrics

- Tony uses executive agent for **cross-firm analysis** instead of manual thread review
- Executive agent **surfaces 3+ actionable insights per week** without prompting
- Tap-In data becomes **primary source** for platform support decisions
- Time spent reviewing individual firm threads **decreases 50%**

---

## Open Questions

1. Should the executive agent auto-summarize Tap-In activity daily/weekly?
2. How much Tap-In context to inject per query (token budget)?
3. Should it proactively suggest which firms to tap into?
4. Permissions model if other superadmins join the platform?
