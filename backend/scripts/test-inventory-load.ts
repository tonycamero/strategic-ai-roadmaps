#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

const INVENTORY_DIR = path.join(__dirname, '../src/trustagent/inventory');

const files = fs.readdirSync(INVENTORY_DIR).filter(f => f.endsWith('.json'));

console.log(`\n📦 Loading ${files.length} inventory files...\n`);

let totalItems = 0;
let totalGhlNative = 0;
let totalSidecars = 0;

for (const file of files) {
  const filepath = path.join(INVENTORY_DIR, file);
  const content = fs.readFileSync(filepath, 'utf-8');
  const items = JSON.parse(content);
  
  const sidecars = items.filter((i: any) => i.isSidecar).length;
  const ghlNative = items.length - sidecars;
  
  console.log(`✅ ${file.padEnd(30)} ${items.length.toString().padStart(3)} items (${ghlNative} GHL-native, ${sidecars} sidecars)`);
  
  totalItems += items.length;
  totalGhlNative += ghlNative;
  totalSidecars += sidecars;
}

console.log(`\n📊 Total: ${totalItems} SOPs`);
console.log(`   - GHL-native: ${totalGhlNative}`);
console.log(`   - Sidecars: ${totalSidecars}`);
console.log(`\n✅ All inventories loaded successfully!\n`);
