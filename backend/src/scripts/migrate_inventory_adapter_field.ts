/**
 * Migrate all inventory JSON files to add explicit `adapter` and `requiresCustomDev` fields.
 * Replaces implicit isSidecar inference with canonical adapter field.
 * isSidecar is retained as @deprecated for backward-compat.
 */
import * as fs from 'fs';
import * as path from 'path';

const INVENTORY_DIR = path.join(__dirname, '../trustagent/inventory');

const FILES = [
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

let totalMigrated = 0;

for (const filename of FILES) {
    const filepath = path.join(INVENTORY_DIR, filename);

    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  Not found: ${filename}`);
        continue;
    }

    const raw = fs.readFileSync(filepath, 'utf-8');
    const items = JSON.parse(raw) as any[];

    const migrated = items.map((item: any) => {
        // Derive adapter from isSidecar if not already present
        if (!item.adapter) {
            item.adapter = item.isSidecar === true ? 'sidecar' : 'ghl';
        }

        // Add requiresCustomDev if not already present
        // sidecars require custom dev by definition (external service)
        if (item.requiresCustomDev === undefined) {
            item.requiresCustomDev = item.isSidecar === true;
        }

        return item;
    });

    fs.writeFileSync(filepath, JSON.stringify(migrated, null, 2), 'utf-8');
    console.log(`✅ ${filename}: ${migrated.length} items migrated`);
    totalMigrated += migrated.length;
}

console.log(`\n✅ Done. Total items migrated: ${totalMigrated}`);
