import { db } from './src/db/index.js';
import { executiveBriefArtifacts, tenants } from './src/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

(async () => {
    try {
        // Find Shakey's tenant
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.name, "Shakey's Pizza"))
            .limit(1);

        if (!tenant) {
            console.log("ERROR: Shakey's tenant not found");
            console.log('Searching for similar names...');
            const allTenants = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
            console.log('Available tenants:', allTenants.map(t => t.name).join(', '));
            process.exit(1);
        }

        console.log('Found tenant:', tenant.name, '(ID:', tenant.id + ')');

        // Find latest PDF artifact
        const [artifact] = await db
            .select()
            .from(executiveBriefArtifacts)
            .where(and(
                eq(executiveBriefArtifacts.tenantId, tenant.id),
                eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
            ))
            .orderBy(desc(executiveBriefArtifacts.createdAt))
            .limit(1);

        if (!artifact) {
            console.log("ERROR: No PDF artifacts found for Shakey's");
            process.exit(1);
        }

        console.log('\n=== LATEST PDF ARTIFACT ===');
        console.log('Artifact ID:', artifact.id);
        console.log('Created At:', artifact.createdAt);
        console.log('File Name:', artifact.fileName);
        console.log('File Path:', artifact.filePath);
        console.log('File Size:', (artifact.fileSize / 1024).toFixed(2), 'KB');
        console.log('Checksum:', artifact.checksum);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
