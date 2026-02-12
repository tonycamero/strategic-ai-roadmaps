/**
 * Assistant Provisioning Service
 * 
 * Creates and updates OpenAI Assistants + vector stores per firm/role.
 * Each assistant is configured with firm-scoped prompt composition from agent_configs.
 */

import OpenAI from 'openai';
import fs from 'fs';
import { db } from '../db/index.ts';
import { agentConfigs, tenantDocuments, tenants, users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { AgentConfig } from '../types/agent.types.ts';
import { buildAgentSystemPrompt, buildContextFromConfig } from './agentPromptBuilder.service.ts';
import { computeCapabilityProfile } from '../shared/types/capability-profile.ts';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Runtime check for vector stores availability
 * Allows graceful degradation when SDK doesn't support it or it's disabled
 * Note: vectorStores moved from beta to top-level in OpenAI SDK 4.86+
 */
function hasVectorStoresSupport(): boolean {
    const hasAPI = !!(openai as any).vectorStores || !!(openai as any).beta?.vectorStores;
    const enabled = process.env.ENABLE_VECTOR_STORES !== 'false';
    return hasAPI && enabled;
}

/**
 * Compose full instructions from agent config fields (v2: static prompt only)
 */
async function composeInstructions(
    config: AgentConfig,
    firmName: string
): Promise<{ instructions: string; instructionsHash: string }> {
    // v2: Minimal context - no roadmap data in system prompt
    const ctx = {
        firmName,
        businessContext: undefined,
        roadmapSummary: undefined,
        roadmapSections: [],
        diagnosticSummary: undefined,
        roadmapSignals: undefined,
        tacticalFrame: undefined,
    };

    // Compute capability profile (default to owner for provisioning)
    const capabilityProfile = computeCapabilityProfile('owner', config.tenantId);

    // Build the minimal static system prompt
    const { instructions, instructionsHash } = buildAgentSystemPrompt(ctx, capabilityProfile);

    return { instructions, instructionsHash };
}

/**
 * Ensure vector store exists and is populated with firm documents
 * Returns vector store ID
 */
async function ensureVectorStore(config: AgentConfig): Promise<string | null> {
    // Check if vector stores are supported
    if (!hasVectorStoresSupport()) {
        console.log('[Provisioning] Vector stores disabled or unavailable – skipping');
        return null;
    }

    // If we already have a vector store, reuse it
    if (config.openaiVectorStoreId) {
        console.log('[Provisioning] Reusing existing vector store:', config.openaiVectorStoreId);
        return config.openaiVectorStoreId;
    }

    // Create new vector store
    // Note: vectorStores API is at top level (not beta) in SDK 4.86+
    const vectorStoresAPI = (openai as any).vectorStores || (openai as any).beta?.vectorStores;
    const vs = await vectorStoresAPI.create({
        name: `tenant_${config.tenantId}_${config.agentType}`,
    });

    console.log('[Provisioning] Created vector store:', vs.id);

    // Fetch documents for this tenant
    const docs = await db.query.tenantDocuments.findMany({
        where: eq(tenantDocuments.tenantId, config.tenantId),
    });

    // Filter to relevant categories (roadmaps, SOPs, reports)
    const filesToUpload = docs.filter((d) =>
        ['roadmap', 'sop_output', 'report'].includes(d.category ?? '')
    );

    console.log(`[Provisioning] Found ${filesToUpload.length} documents for tenant ${config.tenantId}`);

    // Upload files to vector store if any exist
    if (filesToUpload.length > 0) {
        console.log(`[Provisioning] Uploading ${filesToUpload.length} files to vector store...`);

        // Filter to files that exist on disk
        const existingFiles = filesToUpload.filter(d => fs.existsSync(d.filePath));

        if (existingFiles.length === 0) {
            console.warn('[Provisioning] No files exist on disk - skipping upload');
        } else {
            // Create file streams for upload
            const fileStreams = existingFiles.map(d => fs.createReadStream(d.filePath) as any);

            try {
                // Use fileBatches API to upload and poll
                await vectorStoresAPI.fileBatches.uploadAndPoll(vs.id, { files: fileStreams });
                console.log(`[Provisioning] Successfully uploaded ${existingFiles.length} files to vector store`);
            } catch (error: any) {
                console.error('[Provisioning] File upload failed:', error.message);
                // Don't fail provisioning if upload fails - Assistant can still function with instructions only
            }
        }
    }

    return vs.id;
}

/**
 * Provision or update an OpenAI Assistant for an agent config
 * Updates the agent_configs row with assistant and vector store IDs
 */
export async function provisionAssistantForConfig(
    configId: string,
    triggeredByUserId: string,
): Promise<{ assistantId: string; vectorStoreId?: string }> {
    console.log('[Provisioning] Starting provisioning for config:', configId);

    // Load config from DB
    const configRow = await db.query.agentConfigs.findFirst({
        where: eq(agentConfigs.id, configId),
    });

    if (!configRow) {
        throw new Error(`Agent config not found: ${configId}`);
    }

    // Convert to AgentConfig type
    const config: AgentConfig = {
        id: configRow.id,
        tenantId: configRow.tenantId,
        agentType: configRow.agentType as any,
        systemIdentity: configRow.systemIdentity,
        businessContext: configRow.businessContext,
        customInstructions: configRow.customInstructions,
        rolePlaybook: configRow.rolePlaybook,
        toolContext: configRow.toolContext || { tools: [] },
        openaiAssistantId: configRow.openaiAssistantId,
        openaiVectorStoreId: configRow.openaiVectorStoreId,
        openaiModel: configRow.openaiModel,
        lastProvisionedAt: configRow.lastProvisionedAt?.toISOString() ?? null,
        configVersion: configRow.configVersion,
        instructionsHash: configRow.instructionsHash,
        isActive: configRow.isActive,
        version: configRow.version,
        createdBy: configRow.createdBy,
        updatedBy: configRow.updatedBy,
        createdAt: configRow.createdAt?.toISOString?.() ?? '',
        updatedAt: configRow.updatedAt?.toISOString?.() ?? '',
    };

    // Get tenant name for instructions
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, config.tenantId),
    });

    if (!tenant) {
        throw new Error(`Tenant not found: ${config.tenantId}`);
    }

    const firmName = tenant.name;
    const { instructions, instructionsHash } = await composeInstructions(config, firmName);
    const vectorStoreId = await ensureVectorStore(config);

    const model = config.openaiModel || 'gpt-4-1106-preview';

    // Build tools and tool_resources based on vector store availability
    const tools: any[] = [];
    const toolResources: any = {};

    if (vectorStoreId) {
        console.log('[Provisioning] Vector store available, enabling file_search');
        tools.push({ type: 'file_search' });
        toolResources.file_search = { vector_store_ids: [vectorStoreId] };
    } else {
        console.log('[Provisioning] No vector store, assistant will use instructions only');
    }

    let assistant: OpenAI.Beta.Assistants.Assistant;

    const assistantParams: any = {
        model,
        instructions,
    };

    if (tools.length > 0) {
        assistantParams.tools = tools;
        assistantParams.tool_resources = toolResources;
    }

    // Update existing assistant or create new one
    if (config.openaiAssistantId) {
        console.log('[Provisioning] Updating existing assistant:', config.openaiAssistantId);
        assistant = await openai.beta.assistants.update(config.openaiAssistantId, assistantParams);
    } else {
        console.log('[Provisioning] Creating new assistant');
        assistant = await openai.beta.assistants.create({
            ...assistantParams,
            name: `${config.agentType} – ${firmName}`,
        });
    }

    console.log('[Provisioning] Assistant ready:', assistant.id);

    // Update agent_configs row with IDs and hash
    const updateData: any = {
        openaiAssistantId: assistant.id,
        instructionsHash,
        lastProvisionedAt: new Date(),
        updatedBy: triggeredByUserId && triggeredByUserId !== 'system' ? triggeredByUserId : null,
        updatedAt: new Date(),
    };

    if (vectorStoreId) {
        updateData.openaiVectorStoreId = vectorStoreId;
    }

    await db
        .update(agentConfigs)
        .set(updateData)
        .where(eq(agentConfigs.id, configId));

    console.log('[Provisioning] Config updated with assistant IDs');

    return {
        assistantId: assistant.id,
        vectorStoreId: vectorStoreId || undefined,
    };
}
