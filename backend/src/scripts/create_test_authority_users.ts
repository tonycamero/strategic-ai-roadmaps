#!/usr/bin/env node
/**
 * Create test users for SuperAdmin authority verification
 * Phase 1: Testing delegate and operator roles
 * 
 * Usage: node backend/src/scripts/create_test_authority_users.ts
 */

import bcrypt from 'bcryptjs';
import { db } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const TEST_PASSWORD = 'testpass123';

async function createTestUsers() {
    console.log('Creating test authority users...\n');

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    // Delegate user
    try {
        const [existing] = await db.select().from(users).where(eq(users.email, 'delegate@test.com')).limit(1);

        if (existing) {
            console.log('✓ Delegate user already exists:', existing.email);
        } else {
            await db.insert(users).values({
                email: 'delegate@test.com',
                passwordHash,
                role: 'delegate',
                name: 'Test Delegate',
                isInternal: true,
            });
            console.log('✓ Created delegate user: delegate@test.com');
        }
    } catch (error) {
        console.error('✗ Failed to create delegate user:', error);
    }

    // Operator user
    try {
        const [existing] = await db.select().from(users).where(eq(users.email, 'operator@test.com')).limit(1);

        if (existing) {
            console.log('✓ Operator user already exists:', existing.email);
        } else {
            await db.insert(users).values({
                email: 'operator@test.com',
                passwordHash,
                role: 'operator',
                name: 'Test Operator',
                isInternal: true,
            });
            console.log('✓ Created operator user: operator@test.com');
        }
    } catch (error) {
        console.error('✗ Failed to create operator user:', error);
    }

    console.log('\nTest users ready. Password for both: testpass123');
    console.log('\nYou can now run: bash scripts/verify_superadmin_authority.sh');
}

createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
