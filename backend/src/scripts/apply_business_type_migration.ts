#!/usr/bin/env tsx
/**
 * Manual migration script for adding business_type column
 * Run this with: pnpm tsx src/scripts/apply_business_type_migration.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  console.log('🚀 Applying business_type migration...');
  
  try {
    // Check if column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name = 'business_type';
    `);
    
    if (checkResult.length > 0) {
      console.log('✅ Column business_type already exists. Skipping migration.');
      return;
    }
    
    // Apply migration
    console.log('📝 Adding business_type column to tenants table...');
    await db.execute(sql`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "business_type" text NOT NULL DEFAULT 'default';
    `);
    
    console.log('📝 Adding column comment...');
    await db.execute(sql`
      COMMENT ON COLUMN "tenants"."business_type" IS 'Business type profile: default (professional services) or chamber (chamber of commerce)';
    `);
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the backend: pnpm --filter backend dev');
    console.log('2. Start the frontend: pnpm --filter frontend dev');
    console.log('3. Navigate to /organization-type to select business type');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

applyMigration()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
