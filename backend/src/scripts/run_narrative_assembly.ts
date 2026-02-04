
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { assembleExecutiveNarrative, NarrativeContext } from '../services/narrativeAssembly.service';

const args = process.argv.slice(2);
let tenantIds: string[] = [];

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tenant' && args[i + 1]) {
        tenantIds.push(args[i + 1]);
        i++;
    }
}

if (tenantIds.length === 0) {
    console.error("Usage: tsx run_narrative_assembly.ts --tenant <ID> --tenant <ID>");
    process.exit(1);
}

const TIMESTAMP = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
const OUTPUT_ROOT = path.resolve(__dirname, '../../../docs/narrative-tests', TIMESTAMP);

// Normalize Template Hashing
// Replace Tenant Name -> <TENANT>
// Replace Top Keywords -> <KW>
function normalizeAndHash(context: NarrativeContext): string {
    let content = JSON.stringify({
        tensions: context.coreTensions,
        risks: context.impliedRisks,
        leverage: context.leveragePoints,
        framing: context.framing,
        findingsLabels: context.priorityFindings.map(f => f.label)
    });

    // 1. Replace Tenant Name
    content = content.replace(new RegExp(context.meta.tenantName, 'gi'), '<TENANT>');

    // 2. Replace Tokens from Fingerprint (Top 5)
    context.fingerprint.topKeywords.slice(0, 5).forEach((kw, idx) => {
        content = content.replace(new RegExp(kw, 'gi'), `<KW${idx}>`);
    });

    return crypto.createHash('sha256').update(content).digest('hex');
}

async function runBatch() {
    process.env.ENABLE_SQL_LOGGING = 'false';
    console.log(`Starting Narrative Assembly Batch (Fail-Closed V2 - STRICT)...`);
    console.log(`Output: ${OUTPUT_ROOT}`);

    if (!fs.existsSync(OUTPUT_ROOT)) {
        fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
    }

    const manifest: any = {
        timestamp: new Date().toISOString(),
        tenants: []
    };

    const hashRegistry: Map<string, string> = new Map(); // hash -> tenantName
    const diffData: any[] = [];
    let failureCount = 0;

    for (const id of tenantIds) {
        console.log(`\nSynthesizing: ${id}`);
        try {
            const context = await assembleExecutiveNarrative(id);

            // --- STRICT CHECK: Normalized Template Uniqueness ---
            const normalizedHash = normalizeAndHash(context);
            if (hashRegistry.has(normalizedHash)) {
                throw new Error(`Validation Failed: Normalized Template Identity Detected. Same structure as ${hashRegistry.get(normalizedHash)}.`);
            }
            hashRegistry.set(normalizedHash, context.meta.tenantName);

            // --- OUTPUT ---
            const safeName = context.meta.tenantName.replace(/[^a-zA-Z0-9]/g, '_');
            const tenantDir = path.join(OUTPUT_ROOT, safeName);
            if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir);

            const outPath = path.join(tenantDir, 'narrative.json');
            fs.writeFileSync(outPath, JSON.stringify(context, null, 2));
            console.log(`   ✅ Narrative Context saved: ${outPath}`);
            console.log(`   [Theme: ${context.fingerprint.dominantTheme}]`);

            // Collect Diff Data
            const activeSignals = context.fingerprint.themeSignals.filter(s => s.matchedKeywords.length > 0);

            diffData.push({
                name: context.meta.tenantName,
                hash: normalizedHash.slice(0, 8),
                keywords: context.fingerprint.topKeywords.slice(0, 5).join(', '),
                theme: context.fingerprint.dominantTheme,
                signals: activeSignals.map(s => `${s.theme}(${s.matchedKeywords.length})`).join(', ')
            });

            manifest.tenants.push({ id, name: context.meta.tenantName, status: 'success', path: outPath });

        } catch (e: any) {
            console.error(`   ❌ Failed: ${e.message}`);
            manifest.tenants.push({ id, status: 'error', error: e.message });
            failureCount++;
        }
    }

    // --- GENERATE DIFF SUMMARY ---
    let diffContent = `# Narrative Diff Summary (V2 Strict)\n\n**Run ID:** ${TIMESTAMP}\n\n`;

    if (diffData.length > 0) {
        diffContent += `## Uniqueness Verdict: ${failureCount === 0 ? 'PASS' : 'FAIL (Errors Present)'}\n\n`;
        diffContent += `| Tenant | Hash (Norm) | Theme | Top Keywords | Signals |\n`;
        diffContent += `|---|---|---|---|---|\n`;
        diffData.forEach(d => {
            diffContent += `| ${d.name} | \`${d.hash}\` | ${d.theme} | ${d.keywords} | ${d.signals} |\n`;
        });
    } else {
        diffContent += `No Successful Tenants for Comparison.`;
    }

    fs.writeFileSync(path.join(OUTPUT_ROOT, 'diff_summary.md'), diffContent);
    fs.writeFileSync(path.join(OUTPUT_ROOT, 'assembly_manifest.json'), JSON.stringify(manifest, null, 2));

    if (failureCount > 0) process.exit(1);
}

if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

runBatch().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
