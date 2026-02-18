import OpenAI from 'openai';
import { NormalizedIntakeContext } from '../types/intake';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Sop01Outputs {
   sop01DiagnosticMarkdown: string;
   sop01AiLeverageMarkdown: string;
   sop01DiscoveryQuestionsMarkdown: string;
   sop01RoadmapSkeletonMarkdown: string;
}

const SOP01_SYSTEM_PROMPT = `You are a senior AI consultant and strategic advisor specializing in operational diagnostics for service businesses.

Your task is to analyze multi-role intake data and produce 4 critical outputs for SOP-01 (Discovery & Diagnostic Process):

## OUTPUT 1: Company Diagnostic Map (sop01DiagnosticMarkdown)
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

## OUTPUT 2: AI Leverage Map (sop01AiLeverageMarkdown)
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

## OUTPUT 3: Discovery Call Questions (sop01DiscoveryQuestionsMarkdown)
Strategic questions to clarify gaps, validate hypotheses, and prioritize:

Coverage:
- Priority confirmation (what matters most right now?)
- Gap validation (is X really the bottleneck?)
- Process details (walk me through what happens when...)
- Volume/scale questions (how many leads/deals/clients per week?)
- Tool/tech specifics (what's working, what's not?)
- Team dynamics (who owns what, who's underwater?)
- Success metrics (how do you measure X today?)
- Urgency/timeline (what needs to happen in 30/60/90 days?)

Return as a clean Markdown list of exactly 15 questions.

## OUTPUT 4: Roadmap Skeleton (sop01RoadmapSkeletonMarkdown)
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
  "sop01DiagnosticMarkdown": "markdown string with full diagnostic",
  "sop01AiLeverageMarkdown": "markdown string with AI opportunities",
  "sop01DiscoveryQuestionsMarkdown": "markdown list of 15 questions",
  "sop01RoadmapSkeletonMarkdown": "markdown string with roadmap outline"
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

   const content = response.choices[0]?.message?.content;

   if (!content) {
      throw new Error('[SOP-01 Engine] No content returned from OpenAI');
   }

   let parsed: any;
   try {
      parsed = JSON.parse(content);
   } catch (err) {
      console.error('[SOP-01 Engine] Failed to parse JSON from model:', content.substring(0, 500));
      throw new Error('Failed to parse JSON response from SOP-01 engine');
   }

   // Validate schema
   if (!parsed.sop01DiagnosticMarkdown || typeof parsed.sop01DiagnosticMarkdown !== 'string') {
      throw new Error('Invalid SOP-01 output: missing or invalid sop01DiagnosticMarkdown');
   }
   if (!parsed.sop01AiLeverageMarkdown || typeof parsed.sop01AiLeverageMarkdown !== 'string') {
      throw new Error('Invalid SOP-01 output: missing or invalid sop01AiLeverageMarkdown');
   }
   if (!parsed.sop01DiscoveryQuestionsMarkdown || typeof parsed.sop01DiscoveryQuestionsMarkdown !== 'string') {
      throw new Error('Invalid SOP-01 output: missing or invalid sop01DiscoveryQuestionsMarkdown');
   }
   if (!parsed.sop01RoadmapSkeletonMarkdown || typeof parsed.sop01RoadmapSkeletonMarkdown !== 'string') {
      throw new Error('Invalid SOP-01 output: missing or invalid sop01RoadmapSkeletonMarkdown');
   }

   console.log('[SOP-01 Engine] Successfully generated outputs:');
   console.log(`  - Diagnostic Map: ${parsed.sop01DiagnosticMarkdown.length} chars`);
   console.log(`  - AI Leverage Map: ${parsed.sop01AiLeverageMarkdown.length} chars`);
   console.log(`  - Discovery Questions: ${parsed.sop01DiscoveryQuestionsMarkdown.length} chars`);
   console.log(`  - Roadmap Skeleton: ${parsed.sop01RoadmapSkeletonMarkdown.length} chars`);

   return {
      sop01DiagnosticMarkdown: parsed.sop01DiagnosticMarkdown,
      sop01AiLeverageMarkdown: parsed.sop01AiLeverageMarkdown,
      sop01DiscoveryQuestionsMarkdown: parsed.sop01DiscoveryQuestionsMarkdown,
      sop01RoadmapSkeletonMarkdown: parsed.sop01RoadmapSkeletonMarkdown,
   };
}
