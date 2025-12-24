/**
 * SOP Inventory Service
 * 
 * Loads canonical SOP inventories from JSON files and provides query utilities.
 * All inventories are validated against the InventoryTicket schema.
 */

import { InventoryTicket } from '../types/inventory';
import * as path from 'path';
import * as fs from 'fs';

const INVENTORY_DIR = path.join(__dirname, '..', 'inventory');

const INVENTORY_FILES = [
  'pipeline.inventory.json',
  'crm.inventory.json',
  'ops.inventory.json',
  'onboarding.inventory.json',
  'marketing.inventory.json',
  'finance.inventory.json',
  'reporting.inventory.json',
  'team.inventory.json',
  'chamber.inventory.json',
  'sidecars.inventory.json',
];

let cachedInventory: InventoryTicket[] | null = null;

/**
 * Load all inventory files and merge into single array
 */
export function loadInventory(): InventoryTicket[] {
  if (cachedInventory) {
    return cachedInventory;
  }

  const allInventory: InventoryTicket[] = [];

  for (const filename of INVENTORY_FILES) {
    const filepath = path.join(INVENTORY_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      console.warn(`[Inventory] File not found: ${filename}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const items = JSON.parse(content) as InventoryTicket[];
      
      // Validate each item
      for (const item of items) {
        if (!item.inventoryId || !item.category || !item.valueCategory) {
          console.error(`[Inventory] Invalid item in ${filename}:`, item);
          throw new Error(`Invalid inventory item in ${filename}`);
        }
      }
      
      allInventory.push(...items);
      console.log(`[Inventory] Loaded ${items.length} items from ${filename}`);
    } catch (err) {
      console.error(`[Inventory] Failed to load ${filename}:`, err);
      throw err;
    }
  }

  cachedInventory = allInventory;
  console.log(`[Inventory] Total items loaded: ${allInventory.length}`);
  
  return allInventory;
}

/**
 * Get inventory filtered by vertical tags
 */
export function getInventoryForVertical(vertical: string): InventoryTicket[] {
  const all = loadInventory();
  
  // Generic always includes all non-vertical-specific items
  if (vertical === 'generic') {
    return all.filter(item => !item.verticalTags || item.verticalTags.length === 0);
  }
  
  // Return items that either have no vertical tags OR match the requested vertical
  return all.filter(item => 
    !item.verticalTags || 
    item.verticalTags.length === 0 || 
    item.verticalTags.includes(vertical)
  );
}

/**
 * Get specific inventory items by IDs
 */
export function getInventoryByIds(ids: string[]): InventoryTicket[] {
  const all = loadInventory();
  const idSet = new Set(ids);
  return all.filter(item => idSet.has(item.inventoryId));
}

/**
 * Get inventory by category
 */
export function getInventoryByCategory(category: string): InventoryTicket[] {
  const all = loadInventory();
  return all.filter(item => item.category === category);
}

/**
 * Get only GHL-native SOPs (exclude sidecars)
 */
export function getGHLNativeInventory(): InventoryTicket[] {
  const all = loadInventory();
  return all.filter(item => !item.isSidecar);
}

/**
 * Get only sidecar SOPs
 */
export function getSidecarInventory(): InventoryTicket[] {
  const all = loadInventory();
  return all.filter(item => item.isSidecar === true);
}

/**
 * Clear cache (for testing/dev)
 */
export function clearInventoryCache(): void {
  cachedInventory = null;
}

/**
 * Validate inventory integrity (check for duplicate IDs, missing dependencies)
 */
export function validateInventory(): { valid: boolean; errors: string[] } {
  const all = loadInventory();
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const item of all) {
    // Check for duplicate IDs
    if (ids.has(item.inventoryId)) {
      errors.push(`Duplicate inventory ID: ${item.inventoryId}`);
    }
    ids.add(item.inventoryId);

    // Check dependencies exist
    for (const depId of item.dependencies) {
      if (!ids.has(depId)) {
        errors.push(`${item.inventoryId} depends on non-existent ID: ${depId}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
