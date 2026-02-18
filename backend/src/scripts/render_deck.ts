
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NarrativeContext } from '../services/narrativeAssembly.service';

/**
 * RENDERER WRAPPER
 * 1. Reads narrative.json
 * 2. Runs Investor-Safe QA Locks
 * 3. Renders PDF via Puppeteer
 */

// --- QA LOCKS ---
function runQALocks(narrative: NarrativeContext): void {
    const jsonStr = JSON.stringify(narrative);

    // 1. Typo Lock
    if (jsonStr.includes('Bottlebeck')) throw new Error("QA Lock: Found 'Bottlebeck' typo.");
    if (jsonStr.includes('Folowup')) throw new Error("QA Lock: Found 'Folowup' typo.");

    // 2. Keyword Hygiene
    const keywords = narrative.fingerprint.topKeywords;
    if (keywords.length < 5) throw new Error("QA Lock: Too few keywords.");

    // 3. Subtype Lock
    if (narrative.fingerprint.dominantTheme === "Operational Stabilization" && !narrative.fingerprint.opsSubtype) {
        throw new Error("QA Lock: Operational Stabilization requires opsSubtype.");
    }

    // 4. Maturity Reconciliation
    const breakdown = narrative.fingerprint.maturityBreakdown;
    const totalWeight = breakdown.reduce((acc: number, b: any) => acc + (b.weight || 0), 0);
    // Tolerance of 1 point for rounding differences
    if (Math.abs(totalWeight - 100) > 1) throw new Error(`QA Lock: Maturity weights sum to ${totalWeight}, expected 100.`);

    const weightedScore = breakdown.reduce((acc: number, b: any) => acc + (b.score * (b.weight || 0)), 0) / totalWeight;
    if (Math.abs(Math.round(weightedScore) - narrative.fingerprint.maturityScore) > 2) {
        throw new Error(`QA Lock: Maturity Score Mismatch. Calc: ${Math.round(weightedScore)}, Record: ${narrative.fingerprint.maturityScore}`);
    }

    console.log("✅ Investor-Safe QA Locks Passed.");
}

// --- HTML TEMPLATE ---
function getHtml(narrative: NarrativeContext): string {
    const { meta, fingerprint, priorityFindings, executiveSummary, evidence } = narrative;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: sans-serif; padding: 40px; color: #111827; }
            h1 { font-size: 24px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
            h2 { font-size: 18px; color: #374151; margin-top: 30px; }
            .meta { font-size: 10px; color: #9CA3AF; margin-bottom: 40px; }
            .highlight { background: #EFF6FF; padding: 20px; border-left: 4px solid #3B82F6; margin: 20px 0; }
            .fingerprint-panel { background: #F3F4F6; padding: 15px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; }
            .score-box { font-size: 32px; font-weight: bold; color: #1F2937; }
            .finding { margin-bottom: 20px; }
            .label { font-weight: bold; font-size: 14px; }
            .why { font-style: italic; color: #4B5563; }
            .quote-box { font-size: 11px; background: #FFF; border: 1px solid #E5E7EB; padding: 10px; margin-bottom: 10px; }
            .attribution { font-size: 9px; color: #9CA3AF; text-align: right; margin-top: 4px; }
        </style>
    </head>
    <body>
        <div class="meta">
            GENERATED: ${meta.generatedAt} | TENANT: ${meta.tenantName.toUpperCase()} | SOURCES: ${meta.dataSources.join(', ')}
        </div>

        <h1>Executive Diagnostic Indictment</h1>

        <div class="fingerprint-panel">
            <div>
                <div style="font-weight:bold; color:#6B7280; margin-bottom:4px;">DOMINANT THEME</div>
                <div style="font-size:16px;">${fingerprint.dominantTheme}</div>
                ${fingerprint.opsSubtype ? `<div style="color:#2563EB; font-weight:bold; margin-top:4px;">[ ${fingerprint.opsSubtype} ]</div>` : ''}
                <div style="margin-top:10px;">
                    Keywords: ${fingerprint.topKeywords.slice(0, 5).join(', ')}
                </div>
            </div>
            <div>
                <div style="font-weight:bold; color:#6B7280; margin-bottom:4px;">MATURITY SCORE</div>
                <div class="score-box">${fingerprint.maturityScore}</div>
                <div style="margin-top:8px;">
                     ${fingerprint.maturityBreakdown.map(b => `<div>${b.category}: <b>${b.score}</b></div>`).join('')}
                </div>
            </div>
        </div>

        <h2>Executive Summary</h2>
        <div class="highlight">
            ${executiveSummary}
        </div>

        <h2>Priority Findings</h2>
        ${priorityFindings.map(f => `
            <div class="finding">
                <div class="label" style="color: ${f.severity === 'high' ? '#DC2626' : '#D97706'}">
                    [${f.severity.toUpperCase()}] ${f.label}
                </div>
                <div class="why">${f.why}</div>
            </div>
        `).join('')}

        <h2>Core Tensions</h2>
        <ul>
            ${narrative.coreTensions.map(t => `<li>${t}</li>`).join('')}
        </ul>

        <h2>Implied Risks</h2>
        <ul>
            ${narrative.impliedRisks.map(r => `<li>${r}</li>`).join('')}
        </ul>

        <div style="page-break-before: always;"></div>
        <h1>Evidence Appendix</h1>
        
        <h3>Constraints</h3>
        ${evidence.topConstraints.map(e => `
            <div class="quote-box">
                "${e.quote}"
                <div class="attribution">— ${e.role} (Source: ${e.sourceId})</div>
            </div>
        `).join('')}

        <h3>Friction</h3>
        ${evidence.topFriction.map(e => `
            <div class="quote-box">
                "${e.quote}"
                <div class="attribution">— ${e.role} (Source: ${e.sourceId})</div>
            </div>
        `).join('')}

    </body>
    </html>
    `;
}

// --- MAIN RUNNER ---
async function renderDeck(runId: string, tenantName: string) {
    // 1. Read JSON
    const cleanTenant = tenantName.replace(/ /g, '_');
    // From backend/src/scripts to ../../../docs/narrative-renders
    const jsonPath = path.resolve(__dirname, `../../../docs/narrative-renders/${runId}/${cleanTenant}/narrative.json`);

    if (!fs.existsSync(jsonPath)) {
        console.error(`FATAL: Input narrative not found at ${jsonPath}`);
        process.exit(1);
    }

    const narrative = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as NarrativeContext;

    // 2. QA Gating
    try {
        runQALocks(narrative);
    } catch (e: any) {
        console.error(`❌ QA GATE FAILED for ${tenantName}: ${e.message}`);
        process.exit(1);
    }

    // 3. Render HTML
    const html = getHtml(narrative);

    // 4. Puppeteer PDF (using local chrome or puppeteer default for simplicity in script)
    // Note: In prod/lambda we use sparticuz, here in script we can rely on local install or packaged
    // 4. Puppeteer PDF
    console.log("Generating PDF...");

    // Auto-detect chrome path or use default
    // In WSL, it might be at /usr/bin/google-chrome or /usr/bin/chromium-browser
    const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';

    const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = path.resolve(__dirname, `../../../docs/narrative-renders/${runId}/${cleanTenant}/narrative.pdf`);
    await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });

    await browser.close();
    console.log(`✅ PDF Generated: ${pdfPath}`);
}

// CLI Args: tsx render_deck.ts <RunID> <TenantName>
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: tsx render_deck.ts <RunID> <TenantName>");
} else {
    renderDeck(args[0], args[1]);
}
