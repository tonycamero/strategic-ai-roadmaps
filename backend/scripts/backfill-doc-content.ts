import { db } from '../src/db/index.js';
import { tenantDocuments } from '../src/db/schema.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function main() {
  const docs = await db.query.tenantDocuments.findMany();
  let updated = 0;

  for (const d of docs) {
    if (d.content) continue; // already populated

    const candidates: string[] = [];
    const filename = d.filename || path.basename(d.filePath || '');
    if (d.filePath) candidates.push(d.filePath);
    if (d.tenantId) {
      const subdir = d.sopNumber ? 'sop01' : (d.category === 'roadmap' ? 'roadmaps' : 'documents');
      candidates.push(path.join(os.tmpdir(), 'strategic-ai-roadmaps', subdir, d.tenantId, filename));
      candidates.push(path.join(process.cwd(), 'storage', subdir, d.tenantId, filename));
    }

    for (const fp of candidates) {
      try {
        const text = await fs.readFile(fp, 'utf-8');
        await db.update(tenantDocuments).set({ content: text, storageProvider: 'db' }).where(tenantDocuments.id.eq(d.id));
        updated++;
        break;
      } catch {}
    }
  }

  console.log(`Backfill complete. Updated ${updated} documents.`);
}

main().catch(err => { console.error(err); process.exit(1); });
