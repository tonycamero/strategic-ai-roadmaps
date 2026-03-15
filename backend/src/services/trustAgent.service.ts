import OpenAI from 'openai';
import { resolveTenantLifecycleSnapshot, TenantLifecycleSnapshot } from './tenantStateAggregation.service';
import { snapshotIntegrityGate } from './trustAgent/snapshotIntegrityGate';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface OrgVector {
    organization_type: string;
    primary_constraint: string;
    failure_pattern: string;
    kpi_spine: string[];
    ai_priority_hierarchy: string[];
    risk_surface: string;
}

export type TrustAgentRole = 'Owner' | 'Operations' | 'Sales' | 'Delivery';

export interface TrustAgentAnalysis {
    snapshotHash: string;
    lifecycleStage: string;
    dominantConstraint: string;
    emergingSignals: string[];
    cascadeRisks: Array<{
        title: string;
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    simulations: Array<{
        scenario: string;
        leveragePoint: string;
        projectedOutcome: string;
    }>;
    governanceClassification: Array<{
        action: string;
        classification: 'REVERSIBLE_AUTOMATED' | 'REVERSIBLE_HUMAN' | 'IRREVERSIBLE_HUMAN';
        boundaryNotes: string;
    }>;
    roleAdaptiveNarrative: string;
}

/**
 * TrustAgent Service
 * 
 * Acts as the Organizational Intelligence Layer (Constraint Interpreter).
 * Follows the SITREP 2026-03-14 architecture:
 * Reality -> Verified State -> Agent Interpretation -> Executive Control.
 */
export class TrustAgentService {

    /**
     * Primary entry point for tenant analysis.
     */
    static async analyzeTenant(tenantId: string, role: TrustAgentRole): Promise<TrustAgentAnalysis> {
        // 1. Fetch Authoritative Ground Truth
        const rawSnapshot = await resolveTenantLifecycleSnapshot(tenantId);

        // 2. Snapshot Integrity Gate (Verified, Frozen State)
        const { snapshot, snapshotHash } = snapshotIntegrityGate(rawSnapshot);

        // 3. Context Assembly
        const orgVector = this.resolveOrgVector(snapshot);
        const context = this.assembleContext(snapshot, orgVector, role);

        // 4. Constraint Interpreter Execution
        const analysis = await this.performAnalysis(context, role);

        return {
            snapshotHash,
            ...analysis
        };
    }

    /**
     * Maps tenant metadata to the Org Vector reasoning gravity well.
     */
    private static resolveOrgVector(snapshot: TenantLifecycleSnapshot): OrgVector {
        const tenant = snapshot.tenant || {};
        const projection = snapshot.projection || {};

        return {
            organization_type: tenant.segment || 'Professional Services',
            primary_constraint: tenant.primaryBottleneck || 'Operational Throughput',
            failure_pattern: 'Lead response decay and handoff friction',
            kpi_spine: ['Cycle Time', 'Lead-to-Appt', 'Response Latency'],
            ai_priority_hierarchy: ['Capture', 'Qualification', 'Scheduling'],
            risk_surface: projection.analytics?.frictionMap?.highPriorityBottlenecks > 0 ? 'High' : 'Moderate'
        };
    }

    /**
     * Assembles the reasoning context for the LLM.
     */
    private static assembleContext(snapshot: TenantLifecycleSnapshot, vector: OrgVector, role: TrustAgentRole) {
        return {
            org_vector: vector,
            lifecycle_snapshot: {
                phase: snapshot.projection.lifecycle.currentPhase,
                workflow_completeness: snapshot.projection.workflow,
                friction_metrics: snapshot.projection.analytics.frictionMap,
                artifact_status: snapshot.projection.artifacts,
                recent_signals: snapshot.signals // Currently empty placeholder in snapshot
            },
            user_role: role
        };
    }

    /**
     * Calls OpenAI with the Constraint Interpreter system prompt.
     */
    private static async performAnalysis(context: any, role: TrustAgentRole): Promise<Omit<TrustAgentAnalysis, 'snapshotHash'>> {
        const systemPrompt = `
You are the Trust Console Agent, the Organizational Intelligence Layer for Strategic AI Roadmaps.
Your identity is a STRATEGIC THINKING PARTNER, not a roadmap assistant.

IDENTITY:
- You are a CONTRAINT INTERPRETER and SIMULATION ENGINE.
- You reveal the physics of the organization.
- You are ADVISORY-ONLY. You suggest, you do not execute.

REASONING FRAMEWORK:
1. IDENTIFY CONSTRAINTS: Where is the systemic bottleneck?
2. SIMULATE CASCADES: If left unaddressed, how does this fail in the 2nd and 3rd order?
3. CLASSIFY GOVERNANCE:
   - REVERSIBLE_AUTOMATED: Routing/Config changes.
   - REVERSIBLE_HUMAN: Managerial adjustments.
   - IRREVERSIBLE_HUMAN: Strategic/Financial/Hiring decisions.
4. ROLE-ADAPTIVE: Target depth and framing for [${role}].

INPUT CONTEXT:
${JSON.stringify(context, null, 2)}

OUTPUT FORMAT:
Return a valid JSON object matching the following structure:
{
  "lifecycleStage": "...",
  "dominantConstraint": "...",
  "emergingSignals": ["..."],
  "cascadeRisks": [{ "title": "...", "description": "...", "severity": "LOW|MEDIUM|HIGH" }],
  "simulations": [{ "scenario": "...", "leveragePoint": "...", "projectedOutcome": "..." }],
  "governanceClassification": [{ "action": "...", "classification": "...", "boundaryNotes": "..." }],
  "roleAdaptiveNarrative": "..." (Framed for the ${role} role)
}
        `.trim();


        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Analyze the current organizational state and reveal the underlying system physics." }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("Agent failed to produce analysis content.");

        return JSON.parse(content);
    }

    /**
     * Entry point for conversational queries.
     * Grounded in the latest structural analysis and UI context.
     */
    static async query(tenantId: string, role: string, question: string, consoleContext?: any): Promise<string> {
        // 1. Fetch Authoritative Ground Truth
        const rawSnapshot = await resolveTenantLifecycleSnapshot(tenantId);

        // 2. Snapshot Integrity Gate
        const { snapshot } = snapshotIntegrityGate(rawSnapshot);

        // 3. Context Assembly
        const orgVector = this.resolveOrgVector(snapshot);
        const context = this.assembleContext(snapshot, orgVector, role as TrustAgentRole);

        // 4. Perform Grounded Query
        // EXEC-TICKET-ROI-05: Include ROI context when available
        const roiContext = consoleContext?.roi
            ? `
ROI ECONOMIC CONTEXT (from intake baseline):
- Revenue Unlock Range: ${consoleContext.roi.revenueUnlock || 'Not available'}
- Operational Hours Recovered: ${consoleContext.roi.hoursRecovered || 'Not available'}
- Throughput Increase: ${consoleContext.roi.throughputLift || 'Not available'}
- Speed to Value: ${consoleContext.roi.speedToValue || 'Not available'}

When asked about revenue risk, trapped value, or financial impact, lead with these figures.
Pattern: "Packaging coordination issues may reduce operational throughput by approximately [X]%, representing an estimated [revenue range] in annual revenue exposure if unresolved."
`
            : '';

        const systemPrompt = `
You are the Trust Console Agent.
You are a strategic thinking partner for the [${role}] role.

USER CONTEXT:
The user is currently viewing the following area of the platform:
- Page: ${consoleContext?.page || 'Strategic Overview'}
- Panel: ${consoleContext?.panel || 'Primary Navigation'}

Your responses MUST be grounded in the verified organizational snapshot provided below.
If the question is related to the specific panel the user is viewing, prioritize those insights.
${roiContext}
ORGANIZATIONAL CONTEXT:
${JSON.stringify(context, null, 2)}

IDENTITY:
- Reveal the physics of the organization.
- Prioritize constraints and systemic risks.
- Advisory-only. Suggest; do not execute.

Keep responses concise, formatted with markdown, and professional.
`.trim();

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ]
        });

        return response.choices[0].message.content || "Agent failed to produce a response.";
    }
}
