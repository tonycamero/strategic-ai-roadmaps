
import { db } from './src/db';
import { tenants, diagnostics } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Searching for BrightFocus Marketing...');
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.name, 'BrightFocus Marketing'))
        .limit(1);

    if (!tenant) {
        console.error('Tenant not found');
        return;
    }

    console.log('Tenant:', {
        id: tenant.id,
        name: tenant.name,
        lastDiagnosticId: tenant.lastDiagnosticId,
    });

    if (tenant.lastDiagnosticId) {
        console.log(`Checking for diagnostic with ID: ${tenant.lastDiagnosticId}`);
        const [diagById] = await db
            .select()
            .from(diagnostics)
            .where(eq(diagnostics.id, tenant.lastDiagnosticId))
            .limit(1);

        console.log('Diagnostic by ID found?', !!diagById);
        if (diagById) {
            console.log('Diag Status:', diagById.status);
        } else {
            console.log('Diagnostic ID exists on Tenant but not in Diagnostics table - ORPHANED ID');
        }
    } else {
        console.log('Tenant has NO lastDiagnosticId set.');
    }

    console.log(`Checking for ALL diagnostics for tenant ${tenant.id}`);
    const allDiags = await db
        .select()
        .from(diagnostics)
        .where(eq(diagnostics.tenantId, tenant.id));

    console.log('All diagnostics for tenant:', allDiags.length);
    allDiags.forEach(d => console.log(`- ID: ${d.id}, Status: ${d.status}, Created: ${d.createdAt}`));

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
