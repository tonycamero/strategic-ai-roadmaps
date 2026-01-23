/**
 * Canonical Ticket Verification Script
 * 
 * Verifies that all generated tickets map to canonical inventory IDs
 * and that the canonical system is functioning correctly.
 * 
 * Usage: npx tsx backend/scripts/verify_canonical_tickets.ts [tenantId]
 */

import { db } from '../src/db';
import { sopTickets, tenants } from '../src/db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { loadInventory, validateInventory } from '../src/trustagent/services/inventory.service';
import * as dotenv from 'dotenv';

dotenv.config();

interface VerificationResult {
    tenantId: string;
    tenantName: string;
    totalTickets: number;
    canonicalTickets: number;
    customTickets: number;
    invalidTickets: number;
    errors: string[];
    warnings: string[];
}

async function verifyCanonicalTickets(tenantId?: string): Promise<VerificationResult[]> {
    console.log('\n=== CANONICAL TICKET VERIFICATION ===\n');

    // Step 1: Validate canonical inventory integrity
    console.log('[Step 1] Validating canonical inventory...');
    const inventoryValidation = validateInventory();

    if (!inventoryValidation.valid) {
        console.error('❌ CRITICAL: Canonical inventory has errors:');
        inventoryValidation.errors.forEach(err => console.error(`  - ${err}`));
        throw new Error('Canonical inventory validation failed');
    }

    const canonicalInventory = loadInventory();
    const canonicalIds = new Set(canonicalInventory.map(item => item.inventoryId));
    console.log(`✅ Canonical inventory valid: ${canonicalInventory.length} items loaded`);
    console.log(`   Categories: ${new Set(canonicalInventory.map(i => i.category)).size}`);
    console.log(`   GHL-native: ${canonicalInventory.filter(i => !i.isSidecar).length}`);
    console.log(`   Sidecars: ${canonicalInventory.filter(i => i.isSidecar).length}\n`);

    // Step 2: Get tenants to verify
    const tenantsToVerify = tenantId
        ? await db.select().from(tenants).where(eq(tenants.id, tenantId))
        : await db.select().from(tenants).limit(10); // Limit to 10 for safety

    if (tenantsToVerify.length === 0) {
        console.log('⚠️  No tenants found to verify');
        return [];
    }

    console.log(`[Step 2] Verifying ${tenantsToVerify.length} tenant(s)...\n`);

    const results: VerificationResult[] = [];

    for (const tenant of tenantsToVerify) {
        const result: VerificationResult = {
            tenantId: tenant.id,
            tenantName: tenant.name,
            totalTickets: 0,
            canonicalTickets: 0,
            customTickets: 0,
            invalidTickets: 0,
            errors: [],
            warnings: [],
        };

        // Fetch all tickets for this tenant
        const tickets = await db
            .select()
            .from(sopTickets)
            .where(eq(sopTickets.tenantId, tenant.id));

        result.totalTickets = tickets.length;

        if (tickets.length === 0) {
            result.warnings.push('No tickets found for this tenant');
            results.push(result);
            continue;
        }

        // Verify each ticket
        for (const ticket of tickets) {
            if (!ticket.inventoryId) {
                // Custom ticket (allowed if explicitly marked)
                result.customTickets++;
                result.warnings.push(`Ticket ${ticket.ticketId} has no inventoryId (custom ticket)`);
            } else if (!canonicalIds.has(ticket.inventoryId)) {
                // Invalid: references non-existent canonical ID
                result.invalidTickets++;
                result.errors.push(
                    `Ticket ${ticket.ticketId} references unknown canonical ID: ${ticket.inventoryId}`
                );
            } else {
                // Valid canonical ticket
                result.canonicalTickets++;

                // Verify title/description match canonical
                const canonical = canonicalInventory.find(i => i.inventoryId === ticket.inventoryId);
                if (canonical) {
                    if (ticket.title !== canonical.titleTemplate) {
                        result.warnings.push(
                            `Ticket ${ticket.ticketId} title mismatch. Expected: "${canonical.titleTemplate}", Got: "${ticket.title}"`
                        );
                    }
                }
            }
        }

        results.push(result);
    }

    return results;
}

function printResults(results: VerificationResult[]) {
    console.log('\n=== VERIFICATION RESULTS ===\n');

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
        console.log(`\n📊 Tenant: ${result.tenantName} (${result.tenantId})`);
        console.log(`   Total Tickets: ${result.totalTickets}`);
        console.log(`   ✅ Canonical: ${result.canonicalTickets}`);
        console.log(`   ⚠️  Custom: ${result.customTickets}`);
        console.log(`   ❌ Invalid: ${result.invalidTickets}`);

        if (result.errors.length > 0) {
            console.log(`\n   ERRORS:`);
            result.errors.forEach(err => console.log(`     ❌ ${err}`));
            totalErrors += result.errors.length;
        }

        if (result.warnings.length > 0) {
            console.log(`\n   WARNINGS:`);
            result.warnings.forEach(warn => console.log(`     ⚠️  ${warn}`));
            totalWarnings += result.warnings.length;
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total Tenants Verified: ${results.length}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);

    if (totalErrors > 0) {
        console.log('\n❌ VERIFICATION FAILED: Canonical integrity violations detected');
        process.exit(1);
    } else if (totalWarnings > 0) {
        console.log('\n⚠️  VERIFICATION PASSED WITH WARNINGS');
        process.exit(0);
    } else {
        console.log('\n✅ VERIFICATION PASSED: All tickets are canonical-compliant');
        process.exit(0);
    }
}

async function main() {
    const tenantId = process.argv[2];

    if (tenantId) {
        console.log(`Verifying specific tenant: ${tenantId}`);
    } else {
        console.log('Verifying all tenants (limited to 10)...');
    }

    try {
        const results = await verifyCanonicalTickets(tenantId);
        printResults(results);
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED WITH ERROR:');
        console.error(error);
        process.exit(1);
    }
}

main();
