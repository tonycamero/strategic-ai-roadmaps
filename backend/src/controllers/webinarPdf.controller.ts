
import { Request, Response } from 'express';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { assembleNarrative } from '../narrative/engine';

// Verdict map for role snapshots
const ROLE_VERDICTS: Record<string, string> = {
  owner: "You are absorbing system failures instead of enforcing structure.",
  sales: "Revenue depends on heroics instead of enforced follow-up.",
  ops: "Execution speed exceeds system control.",
  delivery: "Momentum decays after handoff due to unclear ownership."
};

// --- HTML TEMPLATE (Light Mode / Executive Brief) ---
const HTML_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Strategic AI Roadmap — Executive Indictment</title>
  <style>
    /* =========================================================
       EXECUTIVE BRIEF — LIGHT MODE (8.5x11 Letter)
       "Silk Glove" Tone
       ========================================================= */

    @page {
      size: Letter;
      margin: 0.85in; /* More generous margins */
    }

    :root {
      --bg: #FFFFFF;
      --text: #111827;           /* Cool Gray 900 */
      --text-soft: #4B5563;      /* Cool Gray 600 */
      --text-faint: #9CA3AF;     /* Cool Gray 400 */
      --panel: #F9FAFB;          /* Cool Gray 50 */
      --border: #E5E7EB;         /* Cool Gray 200 */
      
      --accent: #2563EB;         /* Professional Blue */
      --warn: #D97706;           /* Amber 600 */
      --danger: #DC2626;         /* Red 600 */
      
      --font-serif: Georgia, 'Times New Roman', Times, serif;
      --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    html, body {
      margin: 0; padding: 0;
      background: var(--bg); color: var(--text);
      font-family: var(--font-sans);
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-size: 11px;
      line-height: 1.5;
    }
    
    * { box-sizing: border-box; }

    .page { 
      position: relative; 
      page-break-after: always; 
      height: 100%; 
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    /* TYPOGRAPHY */
    .h1 { 
      font-family: var(--font-serif);
      font-size: 28px; 
      font-weight: 700; 
      color: var(--text);
      margin-bottom: 24px;
      line-height: 1.2;
    }
    
    .h2 { 
      font-family: var(--font-serif);
      font-size: 20px; 
      font-weight: 600; 
      color: var(--text);
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }

    .h3 { 
      font-family: var(--font-sans);
      font-size: 10px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      color: var(--text-faint); 
      margin-bottom: 8px; 
    }
    
    p { margin: 0 0 12px 0; color: var(--text-soft); font-size: 12px; }
    
    .body-serif {
      font-family: var(--font-serif);
      font-size: 13px;
      color: var(--text);
      line-height: 1.7;
    }

    /* CARD STYLES */
    .card { 
      background: var(--panel); 
      border: 1px solid var(--border); 
      border-radius: 4px; 
      padding: 20px; 
      margin-bottom: 20px; 
    }

    /* GRID */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

    /* EVIDENCE CARDS (Role Snapshots) */
    .evidence-card {
      margin-bottom: 16px;
      border-left: 2px solid var(--border);
      padding-left: 16px;
    }

    /* FOOTER */
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      color: var(--text-faint);
      font-size: 9px;
      margin-top: auto;
    }

    /* SPECIAL CALLOUTS */
    .quote-box {
      font-family: var(--font-serif);
      font-style: italic;
      font-size: 14px;
      color: var(--text-soft);
      padding: 0 24px;
      border-left: 2px solid var(--accent);
      margin: 32px 0;
    }

    .separation-line {
      text-align: center;
      margin: 48px 0;
      font-weight: bold;
      color: var(--text);
      font-family: var(--font-serif);
      font-size: 16px;
    }
    
  </style>
</head>
<body>

  <!-- PAGE 1: INVITATION -->
  <div class="page">
    <div>
      <div style="text-transform: uppercase; letter-spacing: 2px; color: var(--text-faint); font-size: 10px; margin-bottom: 48px;">
        Strategic AI Infrastructure // Executive Brief
      </div>
      
      <div class="h1">A Clear Look at How Execution<br>Is Really Working Inside Your Business</div>
      
      <div class="body-serif" style="margin-top: 32px; max-width: 85%;">
        <p>Thank you for taking the time to complete this diagnostic with honesty.</p>
        
        <p>Most leadership teams treat execution problems as resource problems. They believe if they push harder, hire more, or meet longer, the friction will dissolve.</p>
        
        <p>This document presents a different view. It is an examination of your underlying <strong>Execution System</strong>—the invisible architecture that dictates how energy converts into revenue.</p>
        
        <p>You do not need to agree with everything in these pages immediately. We simply ask that you sit with the evidence presented.</p>
        
        <p><strong>This is not a sales pitch.</strong> It is a structural indictment of the constraints limiting your growth, and a roadmap for removing them.</p>
      </div>
      
      <div class="quote-box">
        "The businesses that separate themselves in 2026 will be the ones that stop using AI for content, and start using it for systemic clarity."
      </div>
    </div>

    <div class="footer">
      <div>Prepared for Session {{teamSessionId}}</div>
      <div>Page 1 of 6</div>
    </div>
  </div>

  <!-- PAGE 2: SITUATION (DS1) -->
  <div class="page">
    <div>
      <div class="h3">The Verdict</div>
      <div class="h1">The Current Reality</div>
      
      <div class="card" style="border-left: 4px solid var(--accent); padding: 32px;">
        <div class="h2" style="border: none; margin-bottom: 16px; color: var(--accent);">Situation Report</div>
        <div class="body-serif">
          {{ds1_body}}
        </div>
      </div>
      
      <div class="h3" style="margin-top: 48px;">Why This Matters</div>
      <p style="font-size: 13px; max-width: 600px;">
        This is not a temporary dip in performance. It is a structural characteristic of how your organization is currently wired. Without intervention, this pattern will persist regardless of effort.
      </p>
    </div>

    <div class="footer">
      <div>Strategic AI Infrastructure</div>
      <div>Page 2 of 6</div>
    </div>
  </div>

  <!-- PAGE 3: EVIDENCE (Role Patterns) -->
  <div class="page">
    <div>
      <div class="h3">Exhibit A</div>
      <div class="h1">Systemic Evidence</div>
      <p style="margin-bottom: 32px;">Patterns detected across your leadership structure.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
      {{#each roles}}
      <div style="{{this.cardStyle}} display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 12px; align-items: start; border-radius: 8px; padding: 14px; page-break-inside: avoid;">
        <div>
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: {{this.roleColor}}; margin-bottom: 6px;">{{this.roleName}}</div>
            <div style="font-weight: 800; font-size: 13px; color: #1e293b; line-height: 1.3; margin-bottom: 4px;">{{this.verdict}}</div>
            <div style="font-size: 11px; color: #64748b; line-height: 1.3; margin-bottom: 8px;">{{this.headline}}</div>
            {{this.signalsHtml}}
            <div style="margin-top: 8px; font-size: 10px; font-style: italic; color: #94a3b8; border-left: 2px solid #e2e8f0; padding-left: 8px;">
              "{{this.diagnosis}}"
            </div>
        </div>
        <div>
            {{this.artifactHtml}}
        </div>
      </div>
      {{/each}}
      </div>
      
    </div>

    <div class="footer">
      <div>Strategic AI Infrastructure</div>
      <div>Page 3 of 6</div>
    </div>
  </div>

  <!-- PAGE 4: SYSTEMIC ANALYSIS (Lattice) -->
  <div class="page">
    <div>
      <div class="h3">Deep Dive</div>
      <div class="h1">The Core Mechanism</div>
      
      <div class="card">
        <div class="h3" style="color: var(--warn);">Primary Constraint</div>
        <div class="h2" style="font-size: 16px;">{{narrative.constraint.headline}}</div>
        <div class="body-serif" style="font-size: 12px; color: var(--text-soft);">{{narrative.constraint.body}}</div>
      </div>

      <div class="grid-2">
        <div>
          <div class="h3" style="color: var(--danger);">Compensation Pattern</div>
          <p>{{narrative.failureMode.body}}</p>
        </div>
        <div>
          <div class="h3">Trajectory</div>
           <p><strong>Outcome:</strong> {{narrative.outcome.headline}}</p>
           <p><strong>Severity:</strong> {{narrative.severity.headline}}</p>
           <p><strong>Timing:</strong> {{narrative.timing.headline}}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>Strategic AI Infrastructure</div>
      <div>Page 4 of 6</div>
    </div>
  </div>

  <!-- PAGE 5: CONSEQUENCE (DS2) -->
  <div class="page">
    <div>
      <div class="h3">Business Impact</div>
      <div class="h1">The Cost of Inaction</div>

      <div class="body-serif" style="margin-bottom: 48px;">
        {{ds2_body}}
      </div>

      <div class="separation-line">
        The Separation (2026)
      </div>

      <div class="grid-2">
         <div style="background: var(--panel); padding: 16px; border-radius: 4px;">
           <div class="h3">Traditional Operation</div>
           <p>Using AI for content, email, and efficiency tasks. Systems remain human-dependent and prone to fatigue.</p>
         </div>
         <div style="background: #EFF6FF; padding: 16px; border-radius: 4px; border: 1px solid var(--accent);">
           <div class="h3" style="color: var(--accent);">Systemic AI</div>
           <p>AI acting as the operating layer—enforcing process, verifying execution, and removing friction automatically.</p>
         </div>
      </div>
    </div>

    <div class="footer">
      <div>Strategic AI Infrastructure</div>
      <div>Page 5 of 6</div>
    </div>
  </div>

  <!-- PAGE 6: INVITATION (DS3) -->
  <div class="page">
    <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
      
      <div style="text-align: center; max-width: 600px; margin: 0 auto;">
         <div class="h3">The Path Forward</div>
         <div class="h1" style="margin-bottom: 32px;">A Decision for Architecture</div>
         
         <div class="body-serif" style="text-align: left; margin-bottom: 48px;">
           {{ds3_body}}
         </div>
         
         <div style="border-top: 1px solid var(--border); padding-top: 32px;">
           <p>If, after sitting with this, you decide to engage — the next step is not a tool, a tweak, or a workshop.</p>
           <p>It is the deliberate design of an execution system that removes this constraint.</p>
           <p style="margin-top: 24px; font-weight: 700;">We are ready when you are.</p>
         </div>
      </div>

    </div>

    <div class="footer">
      <div>Strategic AI Infrastructure</div>
      <div>Page 6 of 6</div>
    </div>
  </div>

</body>
</html>`;

export async function generateRolePdf(req: Request, res: Response) {
  res.status(501).json({ message: "Role PDF generation not yet implemented." });
}

function renderTemplate(template: string, data: any): string {
  let output = template;

  // Global replacements
  output = output.replace(/{{generatedAt}}/g, data.generatedAt || '');
  output = output.replace(/{{teamSessionId}}/g, data.teamSessionId || '');

  // DECISION SPINE MAPPING (Strict Array Indexing)
  // DS1 = Index 0 (Situation)
  // DS2 = Index 1 (Consequence)
  // DS3 = Index 2 (Mandate)
  const spine = data.narrative?.decisionSpine || [];
  const ds1 = spine[0] ? (spine[0].content?.body || spine[0].body) : "";
  const ds2 = spine[1] ? (spine[1].content?.body || spine[1].body) : "";
  const ds3 = spine[2] ? (spine[2].content?.body || spine[2].body) : "";

  output = output.replace(/{{ds1_body}}/g, ds1);
  output = output.replace(/{{ds2_body}}/g, ds2);
  output = output.replace(/{{ds3_body}}/g, ds3);

  // Narrative Replacements (Lattice)
  if (data.narrative) {
    output = output.replace(/{{narrative.overview.headline}}/g, data.narrative.overview?.headline || '');
    output = output.replace(/{{narrative.overview.body}}/g, data.narrative.overview?.body || '');
    output = output.replace(/{{narrative.constraint.headline}}/g, data.narrative.constraint?.headline || '');
    output = output.replace(/{{narrative.constraint.body}}/g, data.narrative.constraint?.body || '');
    output = output.replace(/{{narrative.failureMode.headline}}/g, data.narrative.failureMode?.headline || '');
    output = output.replace(/{{narrative.failureMode.body}}/g, data.narrative.failureMode?.body || '');
    output = output.replace(/{{narrative.timing.headline}}/g, data.narrative.timing?.headline || '');
    output = output.replace(/{{narrative.severity.headline}}/g, data.narrative.severity?.headline || '');
    output = output.replace(/{{narrative.outcome.headline}}/g, data.narrative.outcome?.headline || '');

    // Constraint Implications Loop
    const implications = data.narrative.constraint?.implications || [];
    let impHtml = "";
    if (implications.length > 0) {
      impHtml = '<ul>' + implications.map((i: string) => `<li>${i}</li>`).join('') + '</ul>';
    }
    // Note: Template doesn't strictly use this yet, but good to have if we need it
  }

  // ROLES LOOP
  const rolesRegex = /{{#each roles}}([\s\S]*?){{\/each}}/gm;
  output = output.replace(rolesRegex, (match, content) => {
    const roles = data.roles || [];
    if (!roles.length) return "";
    return roles.map((role: any) => {
      // 1. STYLE & COLOR LOGIC (Proven vs Inferred)
      const isReal = role.evidenceArtifact?.isRealArtifact === true;
      const roleColors: Record<string, string> = { owner: '#0ea5e9', sales: '#3b82f6', ops: '#f59e0b', delivery: '#10b981' }; // Diagnostic UI Palette
      const accent = roleColors[role.roleId] || '#64748b';

      const cardStyle = isReal
        ? `border: 1px solid ${accent}; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);` // Available/Proven (Active)
        : `border: 1px solid #e2e8f0;`; // Inferred (Passive)

      const roleColor = isReal ? accent : '#9ca3af';

      let item = content;
      item = item.replace(/{{this.cardStyle}}/g, cardStyle);
      item = item.replace(/{{this.roleColor}}/g, roleColor);
      item = item.replace(/{{this.roleName}}/g, role.roleName);

      // De-duplication: Hide Headline if redundant with Verdict
      const v = (role.verdict || "").trim().toLowerCase();
      const h = (role.headline || "").trim().toLowerCase();
      const showHeadline = (h && !v.includes(h) && h !== v);

      item = item.replace(/{{this.verdict}}/g, role.verdict || "");
      item = item.replace(/{{this.headline}}/g, showHeadline ? role.headline : "");

      // 2. SIGNALS LIST (Left Column)
      let signalsHtml = "";
      if (role.evidenceBlock && role.evidenceBlock.bullets) {
        const bullets = role.evidenceBlock.bullets
          .filter((b: string) => !b.toLowerCase().includes(h) && b.length > 5)
          .slice(0, 3)
          .map((b: string) => `<li style="margin-bottom: 3px;">${b}</li>`)
          .join('');

        signalsHtml = `
            <div style="margin-top: 8px;">
                <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Observed Signals</div>
                <ul style="margin: 0; padding-left: 14px; color: #334155; font-size: 10px; line-height: 1.4;">
                    ${bullets || '<li style="font-style:italic; color:#94a3b8">Pattern inferred from intake.</li>'}
                </ul>
            </div>`;
      }
      item = item.replace(/{{this.signalsHtml}}/g, signalsHtml);

      // 3. ARTIFACT PANEL (Right Column)
      const artifact = role.evidenceArtifact;
      let artifactHtml = "";

      if (isReal && artifact?.dataUrl) {
        // Real Artifact (Proven)
        const isSnapshot = artifact.type === 'snapshot';
        const fit = isSnapshot ? 'contain' : 'cover'; // Snapshots are text cards; prevent cropping
        const bg = isSnapshot ? '#0f172a' : '#000';   // Dark background for UI cards
        const overlayStyle = isSnapshot ? 'display: none;' : ''; // Remove gradient overlay for text cards

        artifactHtml = `
            <div style="height: 100%; min-height: 138px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: ${bg}; position: relative;">
               <img src="${artifact.dataUrl}" style="width: 100%; height: 100%; object-fit: ${fit}; display: block;" />
               <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 40px 12px 12px; pointer-events: none; ${overlayStyle}"></div>
            </div>`;
      } else {
        // Fallback Panel (Inferred)
        artifactHtml = `
            <div style="height: 100%; min-height: 138px; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; display: flex; align-items: center; justify-content: center; text-align: center; padding: 12px;">
                <div>
                   <div style="font-size: 10px; font-weight: 600; color: #64748b; margin-bottom: 4px;">No evidence artifact</div>
                   <div style="font-size: 9px; color: #94a3b8; font-style: italic;">Pattern inferred from<br>intake + role synthesis.</div>
                </div>
            </div>`;
      }
      item = item.replace(/{{this.artifactHtml}}/g, artifactHtml);

      item = item.replace(/{{this.diagnosis}}/g, role.diagnosis || "");
      return item;
    }).join('');
  });

  return output;
}

export async function generateTeamPdf(req: Request, res: Response) {
  try {
    const { teamSessionId, rolePayloads } = req.body;

    if (!teamSessionId || !rolePayloads) {
      res.status(400).json({ ok: false, message: 'teamSessionId and rolePayloads required' });
      return;
    }

    // --- STATELESS GENERATION ---
    let packet;
    try {
      const { calculateBoardReadyPacket } = require('./webinar.controller');
      const { getEvidenceArtifactBytes } = require('../services/storage/evidenceStorage');

      packet = await calculateBoardReadyPacket(teamSessionId, rolePayloads);

      // --- SYSTEMIC EVIDENCE: FETCH ARTIFACT BYTES ---
      // 1. Try to fetch REAL uploaded artifacts first
      if (packet.roleSummaries) {
        await Promise.all(packet.roleSummaries.map(async (role: any) => {
          const artifact = role.evidenceArtifact;
          if (artifact && artifact.isRealArtifact && artifact.imageUrl) {
            try {
              const buffer = await getEvidenceArtifactBytes(artifact.imageUrl);
              const base64 = buffer.toString('base64');
              const mime = artifact.mimeType || 'image/png';
              artifact.dataUrl = `data:${mime};base64,${base64}`;
            } catch (err) {
              console.error(`[PDF Gen] Failed to fetch artifact for ${role.roleId}:`, err);
              // Do NOT set isRealArtifact=false yet; let Screenshot fallback handle it
              // artifact.isRealArtifact = false; 
            }
          }
        }));
      }

      // Compute Narrative
      const narrative = assembleNarrative(packet);
      packet.narrative = narrative;
    } catch (e: any) {
      console.error("Error calculating packet for PDF:", e);
      res.status(400).json({ ok: false, message: 'Invalid role payloads provided: ' + e.message });
      return;
    }

    if (!packet || !packet.team) {
      res.status(500).json({ ok: false, message: 'Failed to generate packet structure.' });
      return;
    }

    // --- PUPPETEER LAUNCH ---
    const chromiumAny = chromium as any;
    const browser = await puppeteer.launch({
      args: chromiumAny.args,
      defaultViewport: chromiumAny.defaultViewport,
      executablePath: await chromiumAny.executablePath(),
      headless: chromiumAny.headless,
    });

    try {
      const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

      // --- DETERMINISTIC ARTIFACT GENERATION (SCREENSHOTS) ---
      // For any role that lacks a valid dataUrl, generate a screenshot of the RoleEvidenceCard
      if (packet.roleSummaries) {
        console.log(`[PDF Gen] Starting screenshot generation for ${packet.roleSummaries.length} roles...`);
        await Promise.all(packet.roleSummaries.map(async (role: any) => {
          // Skip if we already have a real artifact with content
          if (role.evidenceArtifact?.isRealArtifact && role.evidenceArtifact?.dataUrl) {
            return;
          }

          try {
            // Construct Prop Payload
            const props = {
              roleId: role.roleId,
              roleName: role.roleName,
              headline: role.headline,
              signals: role.evidenceBlock?.bullets || [],
              diagnosis: role.diagnosis,
            };

            const json = JSON.stringify(props);
            const payload = Buffer.from(json).toString('base64');
            const url = `${FRONTEND_ORIGIN}/__render/role-evidence?payload=${encodeURIComponent(payload)}`;

            const page = await browser.newPage();
            // DEBUG: Capture browser logs to backend console
            page.on('console', msg => console.log('PAGE LOG:', msg.text()));
            page.on('pageerror', err => console.error('PAGE ERROR:', err));
            await page.setViewport({ width: 600, height: 600, deviceScaleFactor: 2 }); // High DPI capture

            // Navigate and wait for DOM content (safer than networkidle0 with Vite HMR)
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for and get the component (robust against load delays)
            const el = await page.waitForSelector('[data-testid="role-evidence-card"]', { timeout: 15000 });
            if (el) {
              const b64 = await el.screenshot({ encoding: 'base64' });
              // Hydrate the artifact slot
              role.evidenceArtifact = {
                isRealArtifact: true, // It is now "Real" (visual existence)
                type: 'snapshot',
                mimeType: 'image/png',
                dataUrl: `data:image/png;base64,${b64}`,
                caption: 'Role Evidence'
              };
            }
            await page.close();

          } catch (err) {
            console.error(`[PDF Gen] Screenshot failed for ${role.roleId}:`, err);
            // Fallback to text panel handled by HTML template logic if isRealArtifact remains false
          }
        }));
      }

      // AUGMENT ROLES WITH VERDICTS (for template rendering)
      const augmentedRoles = (packet.roleSummaries || []).map((r: any) => {
        const v = ROLE_VERDICTS[r.roleId] || "Structural alignment check required.";
        return { ...r, verdict: v };
      });

      const html = renderTemplate(HTML_TEMPLATE, {
        generatedAt: new Date().toLocaleDateString(),
        teamSessionId,
        team: packet.team,
        board: packet.board,
        contracts: packet.contracts,
        roles: augmentedRoles,
        narrative: {
          overview: packet.narrative?.overview?.content,
          constraint: packet.narrative?.constraint?.content,
          failureMode: packet.narrative?.failureMode?.content,
          timing: packet.narrative?.timing?.content,
          severity: packet.narrative?.severity?.content,
          outcome: packet.narrative?.outcome?.content,
          decisionSpine: (packet.narrative?.decisionSpine || []).map((b: any) => b.content),
        }
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: true
      });

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Strategic_Indictment_${teamSessionId}.pdf"`,
        'Content-Length': pdfBuffer.length
      });

      res.end(pdfBuffer);

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('[PDF Gen] Error:', error);
    res.status(500).json({ ok: false, message: 'PDF generation failed' });
  }
}
