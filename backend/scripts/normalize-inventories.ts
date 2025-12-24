#!/usr/bin/env ts-node
/**
 * Inventory Normalization Script
 * 
 * Converts markdown inventory files to canonical JSON format.
 * Handles schema variations and validates against the canonical schema.
 */

import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = path.join(__dirname, '../../docs/sop-ticket-inventories');
const OUTPUT_DIR = path.join(__dirname, '../src/trustagent/inventory');

interface RawInventoryItem {
  inventoryId: string;
  titleTemplate: string;
  category: string;
  valueCategory: string;
  ghlComponents?: string[];
  ghlTriggers?: string[];
  ghlActions?: string[];
  ghlLimitations?: string[];
  isSidecar?: boolean;
  sidecarCategory?: string;
  implementationStatus?: string;
  implementationPattern?: string;
  complexity?: string;
  dependencies?: string[];
  verticalTags?: string[];
  description?: string;
}

interface CanonicalInventoryItem {
  inventoryId: string;
  titleTemplate: string;
  category: string;
  valueCategory: string;
  ghlComponents: string[];
  ghlTriggers?: string[];
  ghlActions?: string[];
  ghlLimitations?: string[];
  isSidecar: boolean;
  sidecarCategory?: string;
  implementationStatus: 'production-ready' | 'pilot-available';
  description: string;
  implementationPattern: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  verticalTags: string[];
}

const FILE_MAPPING: Record<string, string> = {
  'pipeline_management_sops.md': 'pipeline.inventory.json',
  'crm_data_hygiene_sops.md': 'crm.inventory.json',
  'ops_workflows_sops.md': 'ops.inventory.json',
  'client_onboarding_sops.md': 'onboarding.inventory.json',
  'reporting_analytics_sop_inventory.md': 'reporting.inventory.json',
  'team_operations_sop_inventory.md': 'team.inventory.json',
  'chamber_of_commerce_sop_inventory.md': 'chamber.inventory.json',
  'phase_1_sidecar_sop_inventory.md': 'sidecars.inventory.json',
  'marketing_campaign_sops.md': 'marketing.inventory.json',
  'finance_and_billing_sops.md': 'finance.inventory.json',
};

function extractJsonFromMarkdown(markdown: string): RawInventoryItem[] {
  const items: RawInventoryItem[] = [];
  
  // Match both ```json and plain ``` blocks
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockRegex.exec(markdown)) !== null) {
    try {
      const jsonStr = match[1].trim();
      
      // Skip if it doesn't look like JSON
      if (!jsonStr.startsWith('{')) {
        continue;
      }
      
      // Handle trailing commas and incomplete objects
      let cleaned = jsonStr;
      
      // Remove trailing comma before closing brace
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to parse
      const parsed = JSON.parse(cleaned);
      if (parsed.inventoryId) {
        items.push(parsed);
      }
    } catch (err) {
      console.warn(`Failed to parse JSON block:`, match[1].substring(0, 100));
    }
  }
  
  return items;
}

function normalizeItem(raw: RawInventoryItem): CanonicalInventoryItem {
  // Normalize implementation status
  let implementationStatus: 'production-ready' | 'pilot-available' = 'production-ready';
  if (raw.implementationStatus) {
    const status = raw.implementationStatus.toLowerCase();
    if (status.includes('pilot')) {
      implementationStatus = 'pilot-available';
    }
  }
  
  // Normalize complexity
  let complexity: 'low' | 'medium' | 'high' = 'medium';
  if (raw.complexity) {
    const c = raw.complexity.toLowerCase();
    if (c === 'low' || c === 'medium' || c === 'high') {
      complexity = c as 'low' | 'medium' | 'high';
    }
  }
  
  // Build description from available fields
  let description = raw.description || raw.implementationPattern || raw.titleTemplate;
  
  // Ensure description exists
  if (!description) {
    description = `Implementation for ${raw.titleTemplate}`;
  }
  
  // Build implementation pattern
  let implementationPattern = raw.implementationPattern || raw.description || '';
  if (!implementationPattern) {
    implementationPattern = `Standard implementation for ${raw.category} category.`;
  }
  
  return {
    inventoryId: raw.inventoryId,
    titleTemplate: raw.titleTemplate,
    category: raw.category,
    valueCategory: raw.valueCategory,
    ghlComponents: raw.ghlComponents || [],
    ghlTriggers: raw.ghlTriggers,
    ghlActions: raw.ghlActions,
    ghlLimitations: raw.ghlLimitations,
    isSidecar: raw.isSidecar || false,
    sidecarCategory: raw.sidecarCategory,
    implementationStatus,
    description,
    implementationPattern,
    complexity,
    dependencies: raw.dependencies || [],
    verticalTags: raw.verticalTags || [],
  };
}

function validateItem(item: CanonicalInventoryItem, filename: string): string[] {
  const errors: string[] = [];
  
  if (!item.inventoryId) errors.push(`${filename}: Missing inventoryId`);
  if (!item.titleTemplate) errors.push(`${filename}: Missing titleTemplate`);
  if (!item.category) errors.push(`${filename}: Missing category`);
  if (!item.valueCategory) errors.push(`${filename}: Missing valueCategory`);
  if (!item.description) errors.push(`${filename}: Missing description`);
  if (!item.implementationPattern) errors.push(`${filename}: Missing implementationPattern`);
  
  // Validate arrays
  if (!Array.isArray(item.ghlComponents)) {
    errors.push(`${filename}: ghlComponents must be an array`);
  }
  if (!Array.isArray(item.dependencies)) {
    errors.push(`${filename}: dependencies must be an array`);
  }
  if (!Array.isArray(item.verticalTags)) {
    errors.push(`${filename}: verticalTags must be an array`);
  }
  
  // Sidecar validation
  if (item.isSidecar && !item.sidecarCategory) {
    errors.push(`${filename}: Sidecar item ${item.inventoryId} missing sidecarCategory`);
  }
  
  return errors;
}

async function main() {
  console.log('🔧 Normalizing SOP inventories...\n');
  
  const allErrors: string[] = [];
  let totalProcessed = 0;
  let totalItems = 0;
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Process each file
  for (const [sourceFile, targetFile] of Object.entries(FILE_MAPPING)) {
    const sourcePath = path.join(DOCS_DIR, sourceFile);
    const targetPath = path.join(OUTPUT_DIR, targetFile);
    
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourceFile}`);
      continue;
    }
    
    console.log(`📄 Processing ${sourceFile}...`);
    
    try {
      // Read markdown
      const markdown = fs.readFileSync(sourcePath, 'utf-8');
      
      // Extract JSON blocks
      const rawItems = extractJsonFromMarkdown(markdown);
      console.log(`   Found ${rawItems.length} items`);
      
      // Normalize each item
      const normalized = rawItems.map(raw => normalizeItem(raw));
      
      // Validate
      const errors: string[] = [];
      normalized.forEach(item => {
        const itemErrors = validateItem(item, sourceFile);
        errors.push(...itemErrors);
      });
      
      if (errors.length > 0) {
        allErrors.push(...errors);
        console.log(`   ❌ ${errors.length} validation errors`);
        errors.slice(0, 3).forEach(err => console.log(`      - ${err}`));
        if (errors.length > 3) {
          console.log(`      ... and ${errors.length - 3} more`);
        }
      } else {
        console.log(`   ✅ All items valid`);
      }
      
      // Write output
      fs.writeFileSync(
        targetPath,
        JSON.stringify(normalized, null, 2),
        'utf-8'
      );
      
      console.log(`   💾 Wrote ${normalized.length} items to ${targetFile}\n`);
      
      totalProcessed++;
      totalItems += normalized.length;
      
    } catch (err) {
      console.error(`   ❌ Error processing ${sourceFile}:`, err);
      allErrors.push(`${sourceFile}: ${err}`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${totalProcessed}/${Object.keys(FILE_MAPPING).length}`);
  console.log(`   Total items: ${totalItems}`);
  console.log(`   Validation errors: ${allErrors.length}`);
  
  if (allErrors.length > 0) {
    console.log('\n❌ Validation errors found:');
    allErrors.forEach(err => console.log(`   - ${err}`));
    process.exit(1);
  }
  
  console.log('\n✅ All inventories normalized successfully!');
  console.log(`   Output directory: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
