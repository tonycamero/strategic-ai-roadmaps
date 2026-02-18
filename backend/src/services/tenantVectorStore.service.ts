/**
 * Tenant Vector Store Service (V2 Architecture)
 * 
 * Manages per-tenant vector stores independent of assistant provisioning.
 * Each tenant has ONE vector store containing all their roadmap/SOP/report documents.
 * The v2 Roadmap Coach assistant attaches these vector stores at query time.
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index';
import { tenantVectorStores, tenantDocuments, discoveryCallNotes } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check if vector stores are enabled and supported
 */
function hasVectorStoresSupport(): boolean {
  const hasAPI = !!(openai as any).vectorStores || !!(openai as any).beta?.vectorStores;
  const enabled = process.env.ENABLE_VECTOR_STORES !== 'false';
  return hasAPI && enabled;
}

/**
 * Get vector stores API (handles SDK version differences)
 */
function getVectorStoresAPI() {
  return (openai as any).vectorStores || (openai as any).beta?.vectorStores;
}

/**
 * Get or create a vector store for a tenant
 * Returns vector store ID
 */
export async function getOrCreateVectorStore(tenantId: string): Promise<string> {
  if (!hasVectorStoresSupport()) {
    throw new Error('Vector stores are disabled or unavailable');
  }

  // Check if tenant already has a vector store
  const existing = await db.query.tenantVectorStores.findFirst({
    where: eq(tenantVectorStores.tenantId, tenantId),
  });

  if (existing) {
    console.log('[TenantVectorStore] Reusing existing vector store:', existing.vectorStoreId);
    return existing.vectorStoreId;
  }

  // Create new vector store
  const vectorStoresAPI = getVectorStoresAPI();
  const vs = await vectorStoresAPI.create({
    name: `tenant_${tenantId}`,
  });

  console.log('[TenantVectorStore] Created vector store:', vs.id);

  // Save to database
  await db.insert(tenantVectorStores).values({
    tenantId,
    vectorStoreId: vs.id,
    lastRefreshedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Upload initial documents
  await refreshVectorStoreContent(tenantId);

  return vs.id;
}

/**
 * Refresh vector store content with latest documents
 * Uploads all roadmap/SOP/report documents for the tenant
 */
export async function refreshVectorStoreContent(tenantId: string): Promise<void> {
  if (!hasVectorStoresSupport()) {
    console.warn('[TenantVectorStore] Vector stores disabled, skipping refresh');
    return;
  }

  console.log('[TenantVectorStore] Refreshing content for tenant:', tenantId);

  // Get vector store ID
  const store = await db.query.tenantVectorStores.findFirst({
    where: eq(tenantVectorStores.tenantId, tenantId),
  });

  if (!store) {
    console.warn('[TenantVectorStore] No vector store found, creating one...');
    await getOrCreateVectorStore(tenantId);
    return;
  }

  // Fetch documents for this tenant
  const docs = await db.query.tenantDocuments.findMany({
    where: eq(tenantDocuments.tenantId, tenantId),
  });

  // Filter to relevant categories (roadmap, sop_output, report)
  const filesToUpload = docs.filter((d) =>
    ['roadmap', 'sop_output', 'report'].includes(d.category ?? '')
  );

  console.log(`[TenantVectorStore] Found ${filesToUpload.length} documents for tenant ${tenantId}`);

  // Also fetch discovery notes (stored separately from tenant_documents)
  const [discoveryNote] = await db
    .select()
    .from(discoveryCallNotes)
    .where(eq(discoveryCallNotes.tenantId, tenantId))
    .orderBy(desc(discoveryCallNotes.createdAt))
    .limit(1);

  // If discovery notes exist, create a temporary markdown file
  let discoveryNotesFile: string | null = null;
  if (discoveryNote && discoveryNote.notes) {
    const tmpDir = path.join(__dirname, '../../uploads/tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    
    discoveryNotesFile = path.join(tmpDir, `discovery-notes-${tenantId}.md`);
    const discoveryContent = `# Discovery Call Notes\n\n${discoveryNote.notes}`;
    await fs.promises.writeFile(discoveryNotesFile, discoveryContent, 'utf-8');
    
    console.log(`[TenantVectorStore] Created temporary discovery notes file`);
  }

  // Filter to files that exist on disk
  const existingFiles = filesToUpload.filter(d => fs.existsSync(d.filePath));

  if (existingFiles.length === 0 && !discoveryNotesFile) {
    console.warn('[TenantVectorStore] No documents or discovery notes to upload');
    return;
  }

  const totalFiles = existingFiles.length + (discoveryNotesFile ? 1 : 0);
  console.log(`[TenantVectorStore] Uploading ${totalFiles} files to vector store...`);

  // Create file streams for upload
  const fileStreams = existingFiles.map(d => fs.createReadStream(d.filePath) as any);
  
  // Add discovery notes file if it exists
  if (discoveryNotesFile) {
    fileStreams.push(fs.createReadStream(discoveryNotesFile) as any);
  }

  try {
    const vectorStoresAPI = getVectorStoresAPI();
    await vectorStoresAPI.fileBatches.uploadAndPoll(store.vectorStoreId, { files: fileStreams });
    
    console.log(`[TenantVectorStore] Successfully uploaded ${totalFiles} files`);

    // Clean up temporary discovery notes file
    if (discoveryNotesFile) {
      try {
        await fs.promises.unlink(discoveryNotesFile);
        console.log(`[TenantVectorStore] Cleaned up temporary discovery notes file`);
      } catch (cleanupError) {
        console.warn('[TenantVectorStore] Failed to cleanup temp file:', cleanupError);
      }
    }

    // Update last_refreshed_at timestamp
    await db
      .update(tenantVectorStores)
      .set({ lastRefreshedAt: new Date(), updatedAt: new Date() })
      .where(eq(tenantVectorStores.tenantId, tenantId));

  } catch (error: any) {
    console.error('[TenantVectorStore] Upload failed:', error.message);
    
    // Clean up temporary discovery notes file on error
    if (discoveryNotesFile) {
      try {
        await fs.promises.unlink(discoveryNotesFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error(`Failed to refresh vector store: ${error.message}`);
  }
}

/**
 * Delete a vector store for a tenant
 * WARNING: This permanently deletes all embedded documents
 */
export async function deleteVectorStore(tenantId: string): Promise<void> {
  if (!hasVectorStoresSupport()) {
    console.warn('[TenantVectorStore] Vector stores disabled, skipping delete');
    return;
  }

  const store = await db.query.tenantVectorStores.findFirst({
    where: eq(tenantVectorStores.tenantId, tenantId),
  });

  if (!store) {
    console.warn('[TenantVectorStore] No vector store found for tenant:', tenantId);
    return;
  }

  console.log('[TenantVectorStore] Deleting vector store:', store.vectorStoreId);

  try {
    const vectorStoresAPI = getVectorStoresAPI();
    await vectorStoresAPI.del(store.vectorStoreId);
    
    // Remove from database
    await db.delete(tenantVectorStores).where(eq(tenantVectorStores.tenantId, tenantId));
    
    console.log('[TenantVectorStore] Vector store deleted successfully');
  } catch (error: any) {
    console.error('[TenantVectorStore] Delete failed:', error.message);
    throw new Error(`Failed to delete vector store: ${error.message}`);
  }
}
