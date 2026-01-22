import { db } from '../src/db';
import { tenants, diagnostics, tenantDocuments } from '../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function updateDiagnosticWithQuestions() {
    console.log('🔍 Finding BrightFocus Marketing tenant...');

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.name, 'BrightFocus Marketing'))
        .limit(1);

    if (!tenant) {
        console.error('❌ Tenant not found');
        process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Get the latest diagnostic
    const [diagnostic] = await db
        .select()
        .from(diagnostics)
        .where(eq(diagnostics.tenantId, tenant.id))
        .orderBy(desc(diagnostics.createdAt))
        .limit(1);

    if (!diagnostic) {
        console.error('❌ No diagnostic found for tenant');
        process.exit(1);
    }

    console.log(`✅ Found diagnostic: ${diagnostic.id}`);

    // Fetch discovery call questions from tenant_documents (Output-3)
    const [discoveryQuestionsDoc] = await db
        .select()
        .from(tenantDocuments)
        .where(
            and(
                eq(tenantDocuments.tenantId, tenant.id),
                eq(tenantDocuments.sopNumber, 'SOP-01'),
                eq(tenantDocuments.outputNumber, 'Output-3')
            )
        )
        .limit(1);

    if (!discoveryQuestionsDoc) {
        console.error('❌ Discovery questions document (Output-3) not found');
        process.exit(1);
    }

    console.log(`✅ Found discovery questions document`);
    console.log(`📄 Questions preview: ${discoveryQuestionsDoc.content?.substring(0, 100)}...`);

    // Update the diagnostic with the questions
    const currentDiscoveryQuestions = diagnostic.discoveryQuestions as Record<string, any>;

    await db
        .update(diagnostics)
        .set({
            discoveryQuestions: {
                ...currentDiscoveryQuestions,
                questions: discoveryQuestionsDoc.content || ''
            },
            updatedAt: new Date()
        })
        .where(eq(diagnostics.id, diagnostic.id));

    console.log('✅ Diagnostic updated with discovery questions!');
    console.log('🎉 You can now refresh the page to see the questions in the modal');

    process.exit(0);
}

updateDiagnosticWithQuestions().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
