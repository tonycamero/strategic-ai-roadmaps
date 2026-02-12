/**
 * Webinar Controller
 * Handles password auth, registration, and multi-role diagnostics
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { webinarSettings, webinarRegistrations, evidenceBindings, evidenceArtifacts } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import {
    FETA_REGISTRY,
    isValidRole,
    getNextStep,
    computeTeamSynthesis,
    getTeamTemplate,
    type RoleId,
    type TeamSessionData,
    type RoleAnswers,
    type RoleEvidence
} from '@roadmap/shared';
import { assembleNarrative } from '../narrative/engine.ts';

// In-memory session store with composite keys: ${role}:${sessionId}
const WEBINAR_SESSIONS = new Map<string, any>();

// Team session tracking: teamSessionId -> team data
interface TeamSession {
    teamSessionId: string;
    rolesCompleted: Record<RoleId, boolean>;
    roleAnswers: Record<RoleId, RoleAnswers>;
    roleEvidence: Record<RoleId, RoleEvidence>;
    roleSessions: Record<RoleId, string>;
    results?: any; // The calculated Board-Ready Packet
    narrative?: any; // The assembled Narrative Lattice (AssembledNarrative)
}

const TEAM_SESSIONS = new Map<string, TeamSession>();


interface AuthRequest {
    password: string;
}

interface RegisterRequest {
    name: string;
    email: string;
    company: string;
    role?: string;
    teamSize?: number;
    currentCrm?: string;
    bottleneck?: string;
    source?: string;
    metadata?: Record<string, any>;
}

interface DiagnosticChatRequest {
    sessionId?: string;
    role?: RoleId;
    message: string;
    teamSessionId?: string;  // Browser-managed team grouping
    evidence?: string;        // Optional free-text evidence for current step
}

/**
 * POST /api/public/webinar/auth
 * Validate webinar password
 */
export async function auth(req: Request, res: Response): Promise<void> {
    try {
        const { password } = req.body as AuthRequest;

        if (!password || password.trim().length === 0) {
            res.json({ ok: false, message: 'Password required' });
            return;
        }

        // Fetch current webinar settings
        const settings = await db.select().from(webinarSettings).limit(1);

        if (settings.length === 0) {
            console.error('[Webinar Auth] No webinar settings found');
            res.status(500).json({ ok: false, message: 'System configuration error' });
            return;
        }

        const { passwordHash, passwordVersion } = settings[0];

        // Validate password
        const isValid = await bcrypt.compare(password, passwordHash);

        if (isValid) {
            // Generate PDF access token (24h expiry)
            const jwt = require('jsonwebtoken');
            const PDF_SECRET = process.env.PDF_SECRET || 'webinar-pdf-secret-change-in-prod';

            const teamSessionId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

            const pdfToken = jwt.sign(
                {
                    teamSessionId,
                    passwordVersion,
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
                },
                PDF_SECRET
            );

            res.json({
                ok: true,
                passwordVersion,
                teamSessionId,
                pdfToken
            });
        } else {
            res.json({ ok: false, message: 'Invalid password' });
        }
    } catch (error: any) {
        console.error('[Webinar Auth] Error:', error);
        res.status(500).json({ ok: false, message: 'Authentication failed' });
    }
}

/**
 * POST /api/public/webinar/register
 * Register for webinar
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const data = req.body as RegisterRequest;

        // Basic validation
        if (!data.name || !data.email || !data.company) {
            res.status(400).json({ ok: false, message: 'Name, email, and company are required' });
            return;
        }

        // Insert registration
        await db.insert(webinarRegistrations).values({
            name: data.name,
            email: data.email,
            company: data.company,
            role: data.role || 'Not specified',
            teamSize: data.teamSize || 0,
            currentCrm: data.currentCrm || 'Not specified',
            bottleneck: data.bottleneck || 'Not specified',
            source: data.source,
            metadata: data.metadata || {},
            status: 'pending',
        });

        res.json({
            ok: true,
            message: "You're registered. We'll send the updated password."
        });
    } catch (error: any) {
        console.error('[Webinar Register] Error:', error);
        res.status(500).json({ ok: false, message: 'Registration failed' });
    }
}

/**
 * POST /api/public/webinar/diagnostic/chat
 * Multi-role deterministic diagnostic chat
 */
export async function diagnosticChat(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId, message, role: requestedRole, teamSessionId, evidence } = req.body as DiagnosticChatRequest;

        // Validate and default role
        const role: RoleId = (requestedRole && isValidRole(requestedRole)) ? requestedRole : 'owner';

        // Generate clean session ID
        const cleanSessionId = sessionId || `webinar-${Date.now()}-${Math.random()}`;

        // Composite key for role isolation
        const compositeKey = `${role}:${cleanSessionId}`;

        // Initialize or retrieve session state
        let state = WEBINAR_SESSIONS.get(compositeKey);
        if (!state) {
            // A1: Remove intro gate "H0" and start directly at "Q1"
            state = {
                step: 'Q1',
                answers: {
                    H0: 'H0_YES', // Pre-fill "Yes, let's do it"
                    Q1: null,
                    Q2: null,
                    Q3: null
                }
            };
            WEBINAR_SESSIONS.set(compositeKey, state);
        }

        // Get role config
        const roleConfig = FETA_REGISTRY[role];
        const { taxonomy, synthesis, selectSynthesis } = roleConfig;

        // A3: Capture step BEFORE processing message to associate evidence correctly
        const currentStep = state.step;

        let reply = "";
        let options: any[] = [];
        let cta: any = undefined;
        let reveal: any = undefined;
        let invalidAttempt = false;

        // Handle reset/init (empty message)
        if (!message || message.trim() === '') {
            state.step = 'Q1';
            state.answers = { H0: 'H0_YES', Q1: null, Q2: null, Q3: null };
        } else {
            // Validate answer
            if (state.step !== 'DONE' && state.step !== 'R1_REVEAL') {
                // Check if answer is valid for current step
                const currentQuestion = taxonomy[state.step];
                const isValid = currentQuestion?.options?.some((opt: any) => opt.id === message);

                if (isValid) {
                    // Record answer
                    state.answers[state.step] = message;

                    // Special handle: H0_NO -> Exit flow
                    if (state.step === 'H0' && message === 'H0_NO') {
                        state.step = 'EXIT_H0';
                    } else if (state.step === 'H0' && message === 'H0_EXIT') {
                        state.step = 'EXIT_H0';
                    } else {
                        // Advance normal
                        const next = getNextStep(state.step);
                        if (next === 'DONE' || next === 'R1_REVEAL') {
                            state.step = 'R1_REVEAL';
                        } else {
                            state.step = next;
                        }
                    }
                } else {
                    invalidAttempt = true;
                }
            }
        }

        // Generate response based on step
        try {
            if (state.step === 'EXIT_H0') {
                reply = "All good. If you want, you can explore another role or register for our webinar.";
                options = [];
                WEBINAR_SESSIONS.delete(compositeKey);
            } else if (state.step === 'Q1') {
                reply = invalidAttempt
                    ? "Please select one of the options below. " + (taxonomy?.Q1?.question || "")
                    : (taxonomy?.Q1?.question || "");
                options = taxonomy?.Q1?.options ? taxonomy.Q1.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
            } else if (state.step === 'Q2') {
                reply = invalidAttempt
                    ? "Please select one of the options below. " + (taxonomy?.Q2?.question || "")
                    : (taxonomy?.Q2?.question || "");
                options = taxonomy?.Q2?.options ? taxonomy.Q2.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
            } else if (state.step === 'Q3') {
                reply = invalidAttempt
                    ? "Please select one of the options below. " + (taxonomy?.Q3?.question || "")
                    : (taxonomy?.Q3?.question || "");
                options = taxonomy?.Q3?.options ? taxonomy.Q3.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
            } else if (state.step === 'R1_REVEAL') {
                // Synthesis reveal
                const synthesisKey = selectSynthesis(state.answers);
                const synthBlock = synthesis?.[synthesisKey];

                reply = "Here's what I see:";
                options = [];
                reveal = synthBlock;

                cta = { type: 'generate_mini_roadmap', label: 'Generate my 1-page Fix Plan' };

                WEBINAR_SESSIONS.delete(compositeKey);
            }
        } catch (error) {
            console.error("[Webinar Diagnostic] Error generating response:", error);
            reply = "I encountered an error processing the available options. Please try again.";
            options = [];
        }

        // Team session tracking (if teamSessionId provided)
        let progress = undefined;
        let teamReport = undefined;

        if (teamSessionId) {
            // Initialize or get team session
            let teamSession = TEAM_SESSIONS.get(teamSessionId);
            if (!teamSession) {
                teamSession = {
                    teamSessionId,
                    rolesCompleted: { owner: false, sales: false, ops: false, delivery: false },
                    roleAnswers: {} as Record<RoleId, RoleAnswers>,
                    roleEvidence: {} as Record<RoleId, RoleEvidence>,
                    roleSessions: {} as Record<RoleId, string>,
                };
                TEAM_SESSIONS.set(teamSessionId, teamSession);
            }

            // A3: Track evidence for the step that was just answered
            // If message was provided, use the step that was active before advancing
            // Otherwise, if it's the initial message (reset/init), we don't track evidence yet
            const stepForEvidence = (message && message.trim() !== '') ? currentStep : null;

            if (evidence && stepForEvidence && stepForEvidence.startsWith('Q')) {
                if (!teamSession.roleEvidence[role]) {
                    teamSession.roleEvidence[role] = {};
                }
                teamSession.roleEvidence[role][stepForEvidence as 'Q1' | 'Q2' | 'Q3'] = evidence;
            }

            // Mark role as complete when reveal is shown
            if (state.step === 'R1_REVEAL') {
                teamSession.rolesCompleted[role] = true;
                teamSession.roleAnswers[role] = {
                    Q1: state.answers.Q1,
                    Q2: state.answers.Q2,
                    Q3: state.answers.Q3,
                };
                teamSession.roleSessions[role] = cleanSessionId;
            }

            // Compute progress
            const completedCount = Object.values(teamSession.rolesCompleted).filter(Boolean).length;
            progress = {
                roles: teamSession.rolesCompleted,
                completedCount,
                isTeamComplete: completedCount === 4,
            };

            // If all 4 roles complete, compute team synthesis
            if (completedCount === 4) {
                try {
                    const taxonomies = {
                        owner: FETA_REGISTRY.owner.taxonomy,
                        sales: FETA_REGISTRY.sales.taxonomy,
                        ops: FETA_REGISTRY.ops.taxonomy,
                        delivery: FETA_REGISTRY.delivery.taxonomy,
                    };

                    const teamData: TeamSessionData = {
                        teamSessionId,
                        roleAnswers: teamSession.roleAnswers,
                        roleEvidence: teamSession.roleEvidence,
                    };

                    const teamOutput = computeTeamSynthesis(teamData, taxonomies);

                    teamReport = {
                        primaryConstraint: teamOutput.team.primaryConstraint,
                        alignment: teamOutput.team.alignmentLevel,
                        headline: teamOutput.team.headline,
                        summary: teamOutput.team.summary,
                        topSignals: teamOutput.team.topSignals,
                        whyThisCompounds: teamOutput.team.whyThisCompounds,
                        firstMoves: teamOutput.team.firstMoves,
                        risks: teamOutput.team.risks,
                        evidence: teamOutput.team.evidence,
                        contradictions: teamOutput.comparison.contradictions,
                        comparisonMatrix: teamOutput.comparison.matrix,
                    };
                } catch (error) {
                    console.error('[Team Synthesis] Error:', error);
                }
            }
        }

        // Return response
        res.json({
            sessionId: cleanSessionId,
            role,
            message: reply,
            reveal,
            options,
            cta,
            progress,
            teamReport,
        });
    } catch (error: any) {
        console.error('[Webinar Diagnostic] Error:', error);
        res.status(500).json({
            sessionId: req.body.sessionId || 'error',
            message: 'I encountered an issue processing your message. Please try again.',
            options: [],
        });
    }
}

/**
 * POST /api/public/webinar/diagnostic/team
 * Generate team strategy from collected role payloads
 */
export async function generateTeamResults(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId, rolePayloads } = req.body;

        if (!sessionId) {
            res.status(400).json({ ok: false, message: 'Session ID required' });
            return;
        }

        if (!rolePayloads || Object.keys(rolePayloads).length < 4) {
            res.status(400).json({ ok: false, message: 'All 4 roles must be completed' });
            return;
        }

        // Reshape payloads for shared logic
        // --- EXTRACTED LOGIC START ---
        const responseData = await calculateBoardReadyPacket(sessionId, rolePayloads);
        // --- EXTRACTED LOGIC END ---

        // PHASE 4C: Compute Narrative Lattice
        const narrative = assembleNarrative(responseData);

        // Valid roles: owner, sales, ops, delivery - (Used inside the helper now)

        // SAVE to memory (Legacy support / Cache)
        // We still keep this for now but the PDF controller will use stateless re-calculation
        const teamSession = TEAM_SESSIONS.get(sessionId);
        if (teamSession) {
            teamSession.results = responseData;
            teamSession.narrative = narrative;
        } else {
            TEAM_SESSIONS.set(sessionId, {
                teamSessionId: sessionId,
                rolesCompleted: { owner: true, sales: true, ops: true, delivery: true },
                roleAnswers: calculateRoleAnswers(rolePayloads), // Helper needed or just ignore for transient
                roleEvidence: {} as any, // irrelevant for cache now
                roleSessions: {} as any,
                results: responseData,
                narrative: narrative
            });
        }

        res.json({
            ok: true,
            teamResults: responseData,
            narrative: narrative // Return to UI for Phase 4D
        });
    } catch (error: any) {
        console.error('[Webinar Team Gen] Error:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to generate team strategy'
        });
    }
}

/**
 * Helper to parse role answers for the cache fallback
 */
function calculateRoleAnswers(rolePayloads: any): Record<RoleId, RoleAnswers> {
    const roleAnswers = {} as Record<RoleId, RoleAnswers>;
    const roles: RoleId[] = ['owner', 'sales', 'ops', 'delivery'];
    for (const role of roles) {
        const payload = rolePayloads[role.toUpperCase()] || rolePayloads[role];
        if (payload) {
            roleAnswers[role] = payload.answers || {};
        }
    }
    return roleAnswers;
}


/**
 * Stateless calculator for Board-Ready Packet
 * Used by both JSON endpoint and PDF generator
 */
// Canonical Verdict Map for Evidence Parity
const ROLE_VERDICTS: Record<string, string> = {
    owner: "You are absorbing system failures instead of enforcing structure.",
    sales: "Revenue depends on heroics instead of enforced follow-up.",
    ops: "Execution speed exceeds system control.",
    delivery: "Momentum decays after handoff due to unclear ownership."
};

export async function calculateBoardReadyPacket(sessionId: string, rolePayloads: any): Promise<any> {
    // 1. Reshape inputs
    const roleAnswers = {} as Record<RoleId, RoleAnswers>;
    const roleEvidence = {} as Record<RoleId, RoleEvidence>;
    const roles: RoleId[] = ['owner', 'sales', 'ops', 'delivery'];

    for (const role of roles) {
        // FE sends keys as OWNER, SALES etc.
        const payload = rolePayloads[role.toUpperCase()] || rolePayloads[role];

        // Strict check: if a role is missing, we must throw or return error
        // But for this helper, assuming validation happened before calling
        if (!payload) {
            // If called from PDF controller with incomplete data, we might want to handle it
            // For now, assume callers validate
            throw new Error(`Missing payload for role: ${role}`);
        }

        roleAnswers[role] = payload.answers || {};
        roleEvidence[role] = payload.evidence || {};
    }

    const taxonomies = {
        owner: FETA_REGISTRY.owner.taxonomy,
        sales: FETA_REGISTRY.sales.taxonomy,
        ops: FETA_REGISTRY.ops.taxonomy,
        delivery: FETA_REGISTRY.delivery.taxonomy,
    };

    const teamData: TeamSessionData = {
        teamSessionId: sessionId,
        roleAnswers,
        roleEvidence
    };

    const teamOutput = computeTeamSynthesis(teamData, taxonomies);

    // --- MAPPING ---

    // 1. Role Summaries
    const roleSummaries = await Promise.all(roles.map(async role => {
        const roleConfig = FETA_REGISTRY[role];
        const synthesisKey = roleConfig.selectSynthesis(roleAnswers[role]);
        const synth = roleConfig.synthesis[synthesisKey];
        const evidenceParam = roleEvidence[role];

        const evidenceObserved = evidenceParam && Object.values(evidenceParam).length > 0
            ? Object.values(evidenceParam)[0]
            : null;

        const verdict = ROLE_VERDICTS[role] || "System check required.";

        return {
            roleId: role,
            roleName: role.charAt(0).toUpperCase() + role.slice(1) + (role === 'owner' ? ' / Executive' : ''),
            headline: synth.headline,
            signals: synth.signals,
            diagnosis: synth.diagnosis,
            evidenceObserved,
            evidenceArtifact: await getEvidenceArtifact(role, roleAnswers[role], sessionId),
            evidenceBlock: {
                title: synth.headline,
                bullets: synth.signals || [],
                verdict,
                diagnosis: synth.diagnosis
            },
            impactVector: "Dragging on capacity vs generating lift" // Simplified default for MVP
        };
    }));

    // 2. The Board (NOW / NEXT / LATER)
    const nowTickets = teamOutput.team.firstMoves.map(m => ({
        title: m.action,
        why: m.why,
        owner: m.owner,
        priority: "P0"
    }));

    const nextTickets = [
        {
            title: "Weekly constraint review",
            why: "Prevent regression to old habits",
            owner: "Owner",
            priority: "P1"
        },
        {
            title: "Automate handoff triggers",
            why: "Remove manual friction sources",
            owner: "Ops",
            priority: "P1"
        },
        {
            title: "Unified pipeline view",
            why: "Single source of truth for all roles",
            owner: "Sales",
            priority: "P1"
        }
    ];

    const laterTickets = [
        {
            title: "Full system audit",
            why: "Identify secondary constraints",
            owner: "Ops",
            priority: "P2"
        },
        {
            title: "Role scorecard revision",
            why: "Align incentives with new process",
            owner: "Owner",
            priority: "P2"
        }
    ];

    const board = {
        now: nowTickets,
        next: nextTickets,
        later: laterTickets
    };

    // 3. Contracts
    const contracts = {
        guardrails: teamOutput.team.risks,
        operatingRules: [
            "No verbal handoffs - all tickets must have evidence",
            "Constraint determines the pace of the system",
            "Escalate blocked tickets within 4 hours"
        ]
    };

    // 4. Team executive summary
    const team = {
        primaryConstraint: teamOutput.team.primaryConstraint,
        summary: teamOutput.team.summary,
        confidenceLabel: "High",
        keySignals: teamOutput.team.topSignals,
        leaks: teamOutput.team.topSignals,
        outcomes: ["Break the primary bottleneck", "Align leadership on root cause", "Unlock scalable execution"],
        alignment: teamOutput.team.alignmentLevel,
        contradictions: Array.isArray(teamOutput.comparison.contradictions)
            ? teamOutput.comparison.contradictions.join(" ")
            : (teamOutput.comparison.contradictions || "Multiple conflicting views detected.")
    };

    return {
        team,
        roleSummaries,
        board,
        contracts,
        meta: {
            teamSessionId: sessionId,
            generatedAt: new Date().toISOString()
        }
    };
}

// Export session stores for PDF controller (INTERNAL USE ONLY - not exposed via API)
export { WEBINAR_SESSIONS, TEAM_SESSIONS };

// --- EVIDENCE SELECTION LOGIC ---

function getSignalScore(role: RoleId, answers: RoleAnswers): number {
    let score = 0;
    const a1 = answers.Q1 || '';
    const a2 = answers.Q2 || '';
    const a3 = answers.Q3 || '';

    // 1. Repetition / Manual Work
    // (Owner: A1_CHAOS, Sales: S2_MANUAL, Ops: O2_MANUAL, Delivery: D1_REWORK)
    if (['A1_CHAOS', 'S2_MANUAL', 'O2_MANUAL', 'D1_REWORK'].includes(a1) ||
        ['S2_MANUAL', 'O2_MANUAL'].includes(a2)) {
        score++;
    }

    // 2. Friction / Stall / Delay
    // (Owner: A1_FU, A1_RESP; Sales: S2_SPEED; Ops: O3_DELAY; Delivery: D1_HANDOFF)
    if (['A1_FU', 'A1_RESP', 'S2_SPEED', 'D1_HANDOFF'].includes(a1) ||
        ['O3_DELAY'].includes(a3)) {
        score++;
    }

    // 3. Ownership Ambiguity / Overload
    // (Owner: A3_NONE, A3_FOUN; Sales: S2_AUTHORITY, S3_FOUNDER; Ops: O2_OWNERSHIP; Delivery: D2_PRIORITIES)
    if (['A3_NONE', 'A3_FOUN', 'S3_FOUNDER'].includes(a3) ||
        ['S2_AUTHORITY', 'O2_OWNERSHIP', 'D2_PRIORITIES'].includes(a2)) {
        score++;
    }

    return score;
}

async function getEvidenceArtifact(role: RoleId, answers: RoleAnswers, teamSessionId: string) {
    // 0. Try to fetch REAL artifact from DB first (Systemic Evidence v2)
    try {
        const bindings = await db.select().from(evidenceBindings)
            .where(and(
                eq(evidenceBindings.teamSessionId, teamSessionId),
                eq(evidenceBindings.role, role),
                eq(evidenceBindings.slotKey, 'primary') // V1: always grab primary for now
            ))
            .limit(1);

        if (bindings.length > 0) {
            const binding = bindings[0];
            const artifact = await db.select().from(evidenceArtifacts)
                .where(eq(evidenceArtifacts.id, binding.artifactId))
                .limit(1);

            if (artifact.length > 0) {
                return {
                    type: 'snapshot',
                    caption: artifact[0].caption || "Evidence Snapshot",
                    imageUrl: artifact[0].publicUrl,
                    mimeType: artifact[0].mimeType,
                    isRealArtifact: true
                };
            }
        }
    } catch (e) {
        console.error("Failed to fetch real evidence artifact:", e);
    }

    // 1. Global Eligibility Filter (Must satisfy >= 2 signals)
    const score = getSignalScore(role, answers);

    if (score < 2) {
        return {
            type: 'fallback',
            caption: "Pattern derived from cross-role intake responses."
        };
    }

    // 2. Select Snapshot Claim based on Specific Role Logic
    let caption = "High-friction point detected in workflow."; // Default

    const a1 = answers.Q1 || '';
    const a2 = answers.Q2 || '';
    const a3 = answers.Q3 || '';

    if (role === 'owner') {
        if (a3 === 'A3_FOUN' || a2 === 'A2_FOUN') {
            caption = "Owner absorbing operational overhead.";
        } else if (a1 === 'A1_HAND') {
            caption = "Owner bridging multiple role gaps.";
        }
    } else if (role === 'sales') {
        if (a3 === 'S3_FOUNDER') {
            caption = "Leadership covering manual follow-up.";
        } else if (a1 === 'S1_FOLLOWUP' && a2 === 'S2_MANUAL') {
            caption = "Stalled leads due to manual process.";
        }
    } else if (role === 'ops') {
        if (a3 === 'O3_FIRE' || a3 === 'O3_HERO') {
            caption = "Priority overrides disrupting flow.";
        } else if (a2 === 'O2_OWNERSHIP' || a2 === 'O2_WORKAROUNDS') {
            caption = "Tasks reassigned due to unclear ownership.";
        }
    } else if (role === 'delivery') {
        if (a1 === 'D1_HANDOFF') {
            caption = "Gap in post-sale requirement transfer.";
        } else if (a2 === 'D2_PRIORITIES' || a2 === 'D2_CONTEXT') {
            caption = "Delivery ownership ambiguous.";
        }
    }

    // 3. Return Artifact
    return {
        type: 'snapshot',
        caption,
        // Placeholder for evidence snapshot
        // In production, this would point to a generated visual based on the specific interaction
        imageUrl: `https://dummyimage.com/600x300/f1f5f9/475569.png&text=${role.toUpperCase()}+Workflow+Snapshot`
    };
}


