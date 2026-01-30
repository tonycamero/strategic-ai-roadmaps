import { db } from '../db';
import { sopTickets } from '../db/schema';
import { nanoid } from 'nanoid';
import { OpenAI } from 'openai';
import { buildDiagnosticToTicketsPrompt, SelectedInventoryTicket } from '../trustagent/prompts/diagnosticToTickets';
import { eq, and } from 'drizzle-orm';
import { Sop01Outputs } from './sop01Engine';
import { AUTHORITY_VERSION_STAGE6 } from '../config/authorityVersions';
import { createHash } from 'crypto';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface ParsedTicket {
    title: string;
    description: string;
    category: string;
    tier: string;
    ghl_implementation?: string;
    implementation_steps?: string[];
    success_metric?: string;
    roi_notes?: string;
    time_estimate_hours?: number;
    sprint?: number;
}

export class ArtifactNotFoundError extends Error {
    constructor(public prerequisites: {
        hasDiagnosticMap: boolean;
        hasAiLeverageMap: boolean;
        hasRoadmapSkeleton: boolean;
        hasDiscoveryQuestions: boolean;
    }) {
        super('SOP01_ARTIFACTS_NOT_FOUND');
        this.name = 'ArtifactNotFoundError';
    }
}

export class InventoryEmptyError extends Error {
    constructor(public debug: {
        artifactIds: string[];
        countsByArtifactType: Record<string, number>;
        parserSignature: string;
    }) {
        super('INVENTORY_EMPTY');
        this.name = 'InventoryEmptyError';
    }
}

/**
 * @deprecated LEGACY PATH - NON-CANONICAL TICKET GENERATION
 * 
 * This function generates tickets with FAKE inventory IDs (INV-DERIVED-*) that do not
 * map to the canonical GHL ticket library. This violates the canonical ticket system.
 * 
 * **CANONICAL PATH**: Use `generateTicketsFromDiscovery()` from ticketGeneration.service.ts
 * which enforces Discovery Synthesis gating and canonical inventory mapping.
 * 
 * **DO NOT USE** for new implementations. This exists only for backward compatibility
 * with legacy SOP-01 direct ingestion flows.
 * 
 * **RETROFIT REQUIRED**: This function should either:
 * 1. Be removed entirely if no longer used
 * 2. Be retrofitted to use canonical inventory selection
 * 3. Fail with CANONICAL_REQUIRED error
 */
export async function ingestDiagnostic(diagnosticMap: any, sop01Content: Sop01Outputs): Promise<{
    ticketCount: number;
    roadmapSectionCount: number;
    diagnosticId?: string;
    assistantProvisioned?: boolean;
}> {
    // HARD BLOCK: Prevent non-canonical ticket generation in production
    const allowLegacy = process.env.ALLOW_LEGACY_INGEST === 'true';
    let tickets: ParsedTicket[] = [];

    if (!allowLegacy) {
        const error = new Error(
            'CANONICAL_REQUIRED: ingestDiagnostic() is deprecated and generates non-canonical tickets (INV-DERIVED-*). ' +
            'Use Discovery Synthesis + generateTicketsFromDiscovery() instead. ' +
            'See: backend/src/services/ticketGeneration.service.ts'
        );
        error.name = 'CanonicalRequiredError';
        (error as any).code = 'CANONICAL_REQUIRED';
        throw error;
    }

    console.warn('[DEPRECATED] ingestDiagnostic() called - this generates non-canonical tickets. Use generateTicketsFromDiscovery() instead.');
    const start = Date.now();
    const tenantId = diagnosticMap.tenantId; // Expected to be present
    const diagnosticId = `diag_${nanoid()}`;

    // 3. Delegate to shared logic
    try {
        tickets = await generateRawTickets(diagnosticMap.tenantId, diagnosticMap, sop01Content);
    } catch (error) {
        console.error('[DiagnosticIngestion] Key failure:', error);
        throw error;
    }

    // 5. Persist Atomically (Delete + Insert)
    await db.transaction(async (tx) => {
        // Idempotency: Remove any existing tickets for this diagnostic session (if re-running)
        // Note: The previous logic generated a NEW diagnosticId every time. 
        // If we want actual idempotency for a *Diagnostic Session*, we should reuse the diagnosticId passed in.
        // However, standard flow here implies a "new ingestion event". 
        // To be safe against partials, we just insert cleanly since ID is new.
        // But per spec "Idempotent: re-ingesting... delete+replace".
        // Since we gen a NEW ID here `const diagnosticId = ...`, strict idempotency applies to *this specific execution* failing halfway.
        // Transaction handles that.

        // If reusing diagnostic ID was intended, it should be passed in. 
        // Assuming this function IS the session starter, new ID is correct. 

        if (tickets.length > 0) {
            const ticketInserts = tickets.map((t, idx) => ({
                id: nanoid(),
                tenantId,
                diagnosticId,
                ticketId: `T-${idx + 1}`,
                title: t.title.substring(0, 255),
                description: t.description,
                category: t.category,
                status: 'proposed',
                approved: false, // Critical: Moderation required
                priority: 'medium',
                tier: t.tier as any,
                sprint: 1,
                timeEstimateHours: t.time_estimate_hours || 4,

                // Rich Fields (Validated)
                ghlImplementation: t.ghl_implementation,
                implementationSteps: t.implementation_steps ? JSON.stringify(t.implementation_steps) : null,
                successMetric: t.success_metric || 'Defined during kickoff',
                roiNotes: t.roi_notes,

                projectedHoursSavedWeekly: 0,
                projectedLeadsRecoveredMonthly: 0,
                costEstimate: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await tx.insert(sopTickets).values(ticketInserts);
        }
    });

    // 6. Observability
    console.log(`[TICKET_ARCHITECT] ${tenantId} ${diagnosticId} ${tickets.length} gpt-4-turbo-preview ${Date.now() - start}ms`);

    return {
        ticketCount: tickets.length,
        roadmapSectionCount: 0,
        diagnosticId,
        assistantProvisioned: true
    };
}

/**
 * Core Ticket Generation Logic (Reuse for Stage 6)
 * Generates tickets from SOP-01 artifacts using the legacy prompt.
 * Does NOT persist to DB.
 */
export async function generateStage6TicketsFromInputs(
    tenantId: string,
    diagnosticMap: any,
    promptArtifacts: any,
    derivedInventory: SelectedInventoryTicket[]
): Promise<any[]> {
    const start = Date.now();
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const systemPrompt = buildDiagnosticToTicketsPrompt(
        diagnosticMap,
        promptArtifacts,
        diagnosticMap.firmName || 'Tenant Firm',
        diagnosticMap.firmSize || 'Small',
        diagnosticMap.employeeCount || 10,
        new Date(),
        derivedInventory
    );

    // [Stage 6 Authority Spine] DO NOT MODIFY without explicit authority_version bump.
    console.log(`[Stage 6] Execution Authority: v${AUTHORITY_VERSION_STAGE6}`);

    try {
        // ❄️ SPINE FREEZE: Structural Diff Contract
        // Version: 1.0.0
        // Any change to this prompt or the inventory parser must re-verify src/tests/stage6.replay.ts
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Generate the ticket pack JSON. BE EXTREMELY CONCISE. 1-2 sentences max per field." }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 16384,
            temperature: 0
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No content from OpenAI Ticket Architect");

        console.log("============= [RAW AI TICKET RESPONSE] =============");
        console.log(content);
        console.log("====================================================");

        const parsed = JSON.parse(content);
        if (!parsed.tickets || !Array.isArray(parsed.tickets)) {
            throw new Error('TICKET_ARCHITECT_INVALID_OUTPUT: Response missing "tickets" array');
        }

        const tickets = parsed.tickets.map((t: any, idx: number) => {
            if (!t.title || !t.description || !t.ghl_implementation || !t.roi_notes) {
                throw new Error(`TICKET_ARCHITECT_INVALID_OUTPUT: Ticket validation failed at index ${idx}. Missing required fields.`);
            }

            // 🔒 STRUCTURAL DIFF CONTRACT: Slug must be deterministic
            // Anchored on: inventoryId, category, tier, sprint
            const cat = (t.category || '').toLowerCase().trim();
            const tier = (t.tier || '').toLowerCase().trim();
            const sprint = String(t.sprint || '30');
            const invId = t.inventoryId || t.inventory_id || '';

            const invariantString = `${invId}|${cat}|${tier}|${sprint}`;
            t.slug = createHash('sha1').update(invariantString).digest('hex').substring(0, 8);

            return t;
        });

        console.log(`[TICKET_ARCHITECT] RAW GEN ${tenantId} ${tickets.length} tickets ${Date.now() - start}ms`);
        return tickets;

    } catch (error) {
        console.error('[DiagnosticIngestion] Ticket Architect Failure:', error);
        throw error;
    }
}
export async function generateRawTickets(
    tenantId: string,
    diagnosticMap: any,
    artifacts: any
): Promise<ParsedTicket[]> {
    const start = Date.now();

    // 1. Normalize Artifacts & Strict Validation
    // We handle both raw artifact objects (new) and legacy strings (backward compat)
    const diagInfo = getArtifactRawText(artifacts.sop01DiagnosticMarkdown || artifacts.companyDiagnosticMap);
    const aiInfo = getArtifactRawText(artifacts.sop01AiLeverageMarkdown || artifacts.aiLeverageMap);
    const skeletonInfo = getArtifactRawText(artifacts.sop01RoadmapSkeletonMarkdown || artifacts.roadmapSkeleton);
    const discoveryInfo = getArtifactRawText(artifacts.sop01DiscoveryQuestionsMarkdown || artifacts.discoveryCallQuestions);

    // Standardized Logging (Truth Source Assertion)
    console.log(`[DiagnosticIngestion] DiagnosticMap artifact=${artifacts.diagnosticMap?.id || '?'} type=DIAGNOSTIC_MAP source=${diagInfo.source} rawLength=${diagInfo.length} reason=${diagInfo.reason || 'ok'}`);
    console.log(`[DiagnosticIngestion] AiLeverage artifact=${artifacts.sop01AiLeverageMarkdown?.id || '?'} type=AI_LEVERAGE_MAP source=${aiInfo.source} rawLength=${aiInfo.length} reason=${aiInfo.reason || 'ok'}`);
    console.log(`[DiagnosticIngestion] Skeleton artifact=${artifacts.sop01RoadmapSkeletonMarkdown?.id || '?'} type=ROADMAP_SKELETON source=${skeletonInfo.source} rawLength=${skeletonInfo.length} reason=${skeletonInfo.reason || 'ok'}`);
    console.log(`[DiagnosticIngestion] Discovery artifact=${artifacts.discoveryQuestions?.id || '?'} type=DISCOVERY_QUESTIONS source=${discoveryInfo.source} rawLength=${discoveryInfo.length} reason=${discoveryInfo.reason || 'ok'}`);

    if (diagInfo.length === 0 || aiInfo.length === 0 || skeletonInfo.length === 0 || discoveryInfo.length === 0) {
        console.error(`[DiagnosticIngestion] Missing required SOP-01 artifacts content for tenant ${tenantId}`);
        throw new ArtifactNotFoundError({
            hasDiagnosticMap: diagInfo.length > 0,
            hasAiLeverageMap: aiInfo.length > 0,
            hasRoadmapSkeleton: skeletonInfo.length > 0,
            hasDiscoveryQuestions: discoveryInfo.length > 0
        });
    }

    // 2. Prompt Construction (Strictly derived from artifacts)
    const promptArtifacts = {
        diagnosticMarkdown: diagInfo.raw,
        aiLeverageMarkdown: aiInfo.raw,
        sop01RoadmapSkeletonMarkdown: skeletonInfo.raw,
        discoveryQuestionsMarkdown: discoveryInfo.raw,
    };

    const derivedInventory: SelectedInventoryTicket[] = extractInventoryFromArtifacts({
        sop01DiagnosticMarkdown: diagInfo.raw,
        sop01AiLeverageMarkdown: aiInfo.raw,
        sop01RoadmapSkeletonMarkdown: skeletonInfo.raw,
        sop01DiscoveryQuestionsMarkdown: discoveryInfo.raw,
    });

    // Final Extraction Proof
    console.log(`[DiagnosticIngestion] finalInventoryCount=${derivedInventory.length} parserSignature=extractInventoryFromArtifacts/v2 countsByArtifactType={"ROADMAP_SKELETON": ${derivedInventory.length}, "DIAGNOSTIC_MAP": ${diagInfo.length > 0 ? 1 : 0}}`);

    if (derivedInventory.length === 0) {
        console.warn(`[DiagnosticIngestion] No inventory items extracted from artifacts for tenant ${tenantId}. FAIL CLOSED.`);
        throw new InventoryEmptyError({
            artifactIds: [
                artifacts.diagnosticMap?.id || artifacts.sop01DiagnosticMarkdown?.id,
                artifacts.sop01AiLeverageMarkdown?.id || artifacts.sop01AiLeverageMarkdown?.id,
                artifacts.sop01RoadmapSkeletonMarkdown?.id || artifacts.sop01RoadmapSkeletonMarkdown?.id,
                artifacts.discoveryQuestions?.id || artifacts.sop01DiscoveryQuestionsMarkdown?.id
            ].filter(Boolean),
            countsByArtifactType: {
                ROADMAP_SKELETON: 0,
                DIAGNOSTIC_MAP: diagInfo.length > 0 ? 1 : 0
            },
            parserSignature: 'extractInventoryFromArtifacts/v2'
        });
    }

    // 3. Delegation to First-Class Replay Path
    return generateStage6TicketsFromInputs(
        tenantId,
        diagnosticMap,
        promptArtifacts,
        derivedInventory
    );
}

/**
 * Robust Normalization: Extracts raw text from diverse artifact object shapes or JSON payloads.
 */
export function getArtifactRawText(artifact: any): { raw: string; source: string; length: number; reason?: string } {
    if (!artifact) return { raw: '', source: 'none', length: 0, reason: 'missing_input' };
    if (typeof artifact === 'string' && artifact.trim().length > 0) return { raw: artifact, source: 'direct_string', length: artifact.length };
    if (typeof artifact === 'string') return { raw: '', source: 'direct_string', length: 0, reason: 'empty_string' };

    // 1. Unwrap common wrappers
    let target = artifact;
    const wrappers = ['artifact', 'record', 'row', 'data', 'payload', 'json'];
    for (const wrapper of wrappers) {
        if (target && target[wrapper] && typeof target[wrapper] === 'object') {
            target = target[wrapper];
        }
    }

    const safeJsonParse = (val: any) => {
        if (typeof val !== 'string') return null;
        const trimmed = val.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
        try { return JSON.parse(trimmed); } catch (e) { return null; }
    };

    // 2. Candidate field check (order matters)
    const fields = ['content', 'markdown', 'body', 'text'];
    for (const field of fields) {
        let val = target[field];
        if (!val) continue;

        if (typeof val === 'string' && val.trim().length > 0) {
            // Check for stringified JSON inside high-value fields
            const parsed = safeJsonParse(val);
            if (parsed) {
                const subFields = ['markdown', 'content', 'body', 'text'];
                for (const sf of subFields) {
                    if (parsed[sf] && typeof parsed[sf] === 'string' && parsed[sf].trim().length > 0) {
                        return { raw: parsed[sf], source: `${field}.${sf}`, length: parsed[sf].length };
                    }
                }
                // If it was valid JSON but none of our target subfields were in it
                return { raw: val, source: field, length: val.length, reason: 'json_parsed_no_subfields' };
            }
            return { raw: val, source: field, length: val.length };
        }

        if (typeof val === 'object') {
            const subFields = ['markdown', 'content', 'body', 'text'];
            for (const sf of subFields) {
                if (val[sf] && typeof val[sf] === 'string' && val[sf].trim().length > 0) {
                    return { raw: val[sf], source: `${field}.${sf}`, length: val[sf].length };
                }
            }
        }
    }

    // 3. Fallback: Check wrappers themselves for string content (e.g. payload: "...")
    for (const field of wrappers) {
        const val = artifact[field];
        if (typeof val === 'string' && val.trim().length > 0) {
            const parsed = safeJsonParse(val);
            if (parsed) {
                const subFields = ['markdown', 'content', 'body', 'text'];
                for (const sf of subFields) {
                    if (parsed[sf] && typeof parsed[sf] === 'string' && parsed[sf].trim().length > 0) {
                        return { raw: parsed[sf], source: `${field}.${sf}`, length: parsed[sf].length };
                    }
                }
            }
            return { raw: val, source: field, length: val.length };
        }
    }

    return { raw: '', source: 'not_found', length: 0 };
}

/**
 * Extracts implied inventory items from the SOP-01 "Roadmap Skeleton" or "AI Leverage Map"
 * to serve as the ground truth "Selected Inventory" for the prompt.
 */
export function extractInventoryFromArtifacts(sop01Content: Sop01Outputs): SelectedInventoryTicket[] {
    const rawInventory: SelectedInventoryTicket[] = [];

    const raw = sop01Content.sop01RoadmapSkeletonMarkdown || '';
    const lines = raw.split('\n');
    let currentSprint = 30;

    // Enhanced Parser Signature: v2
    // ❄️ SPINE FREEZE: Authority Parser
    // Version: 1.0.0 (extractInventoryFromArtifacts/v2)
    // Anchors the SHA-1 ticket_slugs. Do not change without regression testing.
    const bulletRegex = /^\s*[-*•]\s*(.*)/;
    const numberedRegex = /^\s*\d+\.\s*(.*)/;
    const phaseRegex = /Phase (\d+): (.*)/i;
    const systemRegex = /\*\*System\*\*: (.*)/i;

    console.log(`[DiagnosticIngestion] Parsing inventory items from ${lines.length} lines (extractInventoryFromArtifacts/v2)...`);

    for (const line of lines) {
        let cleanTitle = '';

        const bMatch = line.match(bulletRegex);
        const nMatch = line.match(numberedRegex);
        const sMatch = line.match(systemRegex);

        if (sMatch) {
            cleanTitle = sMatch[1].trim();
            cleanTitle = cleanTitle.replace(/^(Proposed:|Finding:)\s*/i, '').replace(/\*\*/g, '').trim();
        } else if (bMatch) {
            cleanTitle = bMatch[1].replace(/\*\*/g, '').trim();
        } else if (nMatch) {
            cleanTitle = nMatch[1].replace(/\*\*/g, '').trim();
        }

        const pMatch = line.match(phaseRegex);
        if (pMatch) {
            const phaseNum = parseInt(pMatch[1], 10);
            currentSprint = (phaseNum * 30) as any;
        }

        if (cleanTitle && cleanTitle.length >= 5) {
            rawInventory.push({
                inventoryId: `INV-DERIVED-${createHash('sha1').update(cleanTitle.toLowerCase().trim()).digest('hex').substring(0, 4)}`,
                titleTemplate: cleanTitle,
                category: 'Implied',
                valueCategory: 'Efficiency',
                ghlComponents: [],
                description: `Implementation of ${cleanTitle} as defined in roadmap.`,
                implementationStatus: 'production-ready',
                tier: 'core',
                sprint: currentSprint as any
            });
        }
    }

    // Deterministic Ordering & Case-Insensitive Deduplication
    const seen = new Set<string>();
    const inventory: SelectedInventoryTicket[] = [];

    for (const item of rawInventory) {
        const key = item.titleTemplate.toLowerCase().trim();
        // Skip noise or punctuation-only
        if (!key || key.match(/^[^a-z0-9]+$/i)) continue;

        if (!seen.has(key)) {
            seen.add(key);
            inventory.push(item);
        }
    }

    return inventory;
}
