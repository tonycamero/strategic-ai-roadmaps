import OpenAI from 'openai';
import { NormalizedIntakeContext } from '../types/intake';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Sop01Outputs {
  companyDiagnosticMap: string;
  aiLeverageMap: string;
  discoveryCallQuestions: string[];
  roadmapSkeleton: string;
}

const SOP01_SYSTEM_PROMPT = `You are a senior AI consultant and strategic advisor specializing in operational diagnostics for service businesses.

Your task is to analyze multi-role intake data and produce 4 critical outputs for SOP-01 (Discovery & Diagnostic Process):

## OUTPUT 1: Company Diagnostic Map
A structured markdown document analyzing the business across key dimensions:

### Structure:
1. **Executive Summary**
   
   a. **Overview** (4-5 sentences - synthesis paragraph)
   - Current state: Where the business is now (team size, volume, market position)
   - Core challenge: The fundamental blocker preventing scale
   - Recommended path: The proposed engagement approach
   - Expected outcome: The transformation promise (specific metrics)
   - Urgency context: Why this matters now
   
   This overview should be compelling, specific to their data, and set up the engagement recommendation.
   
   b. **Key Findings** (3-4 bullet points)
   - Primary pain points from the diagnostic
   - Most critical bottlenecks
   - Highest-impact opportunities

2. **Lead Flow & Assignment**
   - How leads enter the system
   - Assignment process and gaps
   - Leakage points and untouched leads
   - Response time issues

3. **Sales Process & Conversion**
   - Current sales workflow
   - Conversion bottlenecks
   - Tool/CRM gaps
   - Follow-up consistency

4. **Operations & Systems**
   - Tech stack overview
   - Automation level
   - Integration challenges
   - Data quality issues

5. **Delivery & Fulfillment**
   - Delivery process bottlenecks
   - Quality metrics
   - Client feedback themes
   - Team capacity constraints

6. **Owner Bottlenecks**
   - Tasks still on owner's plate
   - Decision-making delays
   - Areas where owner is blocking progress

7. **Failure Points Under Volume**
   - What breaks first if lead volume doubles
   - Fragile processes
   - Capacity limits

8. **Growth Barriers**
   - Strategic obstacles to scaling
   - Resource constraints
   - Process maturity gaps

## OUTPUT 2: AI Leverage Map
A tactical markdown document identifying specific AI/automation opportunities:

### Structure:
1. **High-Impact Quick Wins** (30-day opportunities)
   - **Opportunity name**: Description sentence.  
     *Expected impact*: [level], *Effort level*: [level], *Tools needed*: [details]
   
   Use two spaces at end of description line for markdown line break.

2. **Medium-Term Opportunities** (60-90 days)
   - CRM workflow automation
   - Data integration
   - Reporting dashboards
   - Process standardization

3. **Strategic AI Systems** (3-6 months)
   - Predictive lead scoring
   - Automated nurture campaigns
   - Performance analytics
   - Client success automation

4. **ROI Estimates**
   - Time savings per opportunity
   - Revenue impact potential
   - Cost considerations

## OUTPUT 3: Discovery Call Questions (Array of 15 strings)
Strategic questions to clarify gaps, validate hypotheses, and prioritize:

Categories to cover:
- Priority confirmation (what matters most right now?)
- Gap validation (is X really the bottleneck?)
- Process details (walk me through what happens when...)
- Volume/scale questions (how many leads/deals/clients per week?)
- Tool/tech specifics (what's working, what's not?)
- Team dynamics (who owns what, who's underwater?)
- Success metrics (how do you measure X today?)
- Urgency/timeline (what needs to happen in 30/60/90 days?)

Return as array of 15 concise, actionable questions.

## OUTPUT 4: Roadmap Skeleton
A high-level markdown outline of the strategic roadmap structure:

### Structure:
1. **Vision Statement** (2-3 sentences)
   - Where the business is going
   - What success looks like in 12 months

2. **30-Day Quickstart Plan**
   - Top 3 priorities
   - Expected outcomes

3. **60-Day Build Phase**
   - Systems to implement
   - Process improvements

4. **90-Day Activation Phase**
   - Full workflow automation
   - Team enablement
   - Metrics dashboard launch

5. **Key Systems to Build**
   - Bullet list of AI/automation systems
   - Brief description of each

6. **Success Metrics**
   - KPIs to track
   - Baseline → Target values

---

## INPUT FORMAT
You will receive a JSON object with:
- \`tenantId\`: string
- \`roles\`: { owner, ops, sales, delivery } - each with normalized question answers
- \`matrixView\`: array of themes with cross-role perspectives
- \`contradictions\`: array of detected inconsistencies
- \`missingData\`: array of missing answers
- \`chokePoints\`: array of detected bottlenecks

## OUTPUT FORMAT (STRICT JSON)
Return ONLY valid JSON with this exact structure:

\`\`\`json
{
  "companyDiagnosticMap": "markdown string with full diagnostic",
  "aiLeverageMap": "markdown string with AI opportunities",
  "discoveryCallQuestions": ["question 1", "question 2", ... 15 total],
  "roadmapSkeleton": "markdown string with roadmap outline"
}
\`\`\`

## CRITICAL RULES
1. Use ONLY information from the intake data - do not invent details
2. If data is missing, note it explicitly ("Owner did not provide...")
3. Be specific and actionable - avoid generic advice
4. Use the firm's actual pain points and context
5. Keep markdown clean and well-structured
6. Ensure exactly 15 discovery questions
7. Return ONLY JSON - no preamble, no explanation`;

export async function generateSop01Outputs(
  context: NormalizedIntakeContext
): Promise<Sop01Outputs> {
  console.log('[SOP-01 Engine] Generating diagnostic outputs for tenant:', context.tenantId);

  const response = await openai.chat.completions.create({
    model: process.env.SOP01_MODEL || 'gpt-4-1106-preview',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: SOP01_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: JSON.stringify(context, null, 2),
      },
    ],
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('[SOP-01 Engine] No content returned from OpenAI');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[SOP-01 Engine] Failed to parse JSON from model:', raw.substring(0, 500));
    throw new Error('Failed to parse JSON response from SOP-01 engine');
  }

  // Validate schema
  if (!parsed.companyDiagnosticMap || typeof parsed.companyDiagnosticMap !== 'string') {
    throw new Error('Invalid SOP-01 output: missing or invalid companyDiagnosticMap');
  }
  if (!parsed.aiLeverageMap || typeof parsed.aiLeverageMap !== 'string') {
    throw new Error('Invalid SOP-01 output: missing or invalid aiLeverageMap');
  }
  if (!Array.isArray(parsed.discoveryCallQuestions) || parsed.discoveryCallQuestions.length !== 15) {
    throw new Error(`Invalid SOP-01 output: discoveryCallQuestions must be array of 15, got ${parsed.discoveryCallQuestions?.length || 0}`);
  }
  if (!parsed.roadmapSkeleton || typeof parsed.roadmapSkeleton !== 'string') {
    throw new Error('Invalid SOP-01 output: missing or invalid roadmapSkeleton');
  }

  console.log('[SOP-01 Engine] Successfully generated outputs:');
  console.log(`  - Diagnostic Map: ${parsed.companyDiagnosticMap.length} chars`);
  console.log(`  - AI Leverage Map: ${parsed.aiLeverageMap.length} chars`);
  console.log(`  - Discovery Questions: ${parsed.discoveryCallQuestions.length} questions`);
  console.log(`  - Roadmap Skeleton: ${parsed.roadmapSkeleton.length} chars`);

  return {
    companyDiagnosticMap: parsed.companyDiagnosticMap,
    aiLeverageMap: parsed.aiLeverageMap,
    discoveryCallQuestions: parsed.discoveryCallQuestions,
    roadmapSkeleton: parsed.roadmapSkeleton,
  };
}
