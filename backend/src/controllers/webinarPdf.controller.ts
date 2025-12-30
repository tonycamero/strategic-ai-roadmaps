
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

      {{#each roles}}
      <div class="evidence-card">
        <div class="h2" style="font-size: 14px; border:none; margin:0; text-transform:uppercase; letter-spacing:0.05em;">{{this.roleName}}</div>
        <div style="font-weight: 700; color: var(--text); margin-top: 4px;">{{this.headline}}</div>
        <p style="margin-top: 8px;">{{this.verdict}}</p>
        <div style="margin-top: 16px;">{{this.evidenceHtml}}</div>
      </div>
      {{/each}}
      
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
  // Custom simple regex replacer for role array
  const rolesRegex = /{{#each roles}}([\s\S]*?){{\/each}}/gm;
  output = output.replace(rolesRegex, (match, content) => {
    const roles = data.roles || [];
    if (!roles.length) return "";
    return roles.map((role: any) => {
      let item = content;
      item = item.replace(/{{this.roleName}}/g, role.roleName);
      item = item.replace(/{{this.headline}}/g, role.headline);
      item = item.replace(/{{this.verdict}}/g, role.verdict || "");

      // Evidence HTML Generation
      let evidenceHtml = "";
      if (role.evidenceArtifact?.type === 'snapshot') {
        evidenceHtml = `
          <div style="border: 1px solid var(--border); border-radius: 4px; overflow: hidden; position: relative;">
            <img src="${role.evidenceArtifact.imageUrl}" style="width: 100%; display: block;" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; font-size: 11px; font-weight: 600;">
              ${role.evidenceArtifact.caption}
            </div>
          </div>`;
      } else {
        // Fallback
        evidenceHtml = `
          <div style="background: var(--panel); padding: 12px; border-radius: 4px; border: 1px dashed var(--border); color: var(--text-faint); font-style: italic; font-size: 10px; text-align: center;">
            Pattern derived from cross-role intake responses.
          </div>`;
      }
      item = item.replace(/{{this.evidenceHtml}}/g, evidenceHtml);

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
      packet = calculateBoardReadyPacket(teamSessionId, rolePayloads);

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

    // AUGMENT ROLES WITH VERDICTS
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

    // --- PUPPETEER ---
    const chromiumAny = chromium as any;
    const browser = await puppeteer.launch({
      args: chromiumAny.args,
      defaultViewport: chromiumAny.defaultViewport,
      executablePath: await chromiumAny.executablePath(),
      headless: chromiumAny.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Strategic_Indictment_${teamSessionId}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);

  } catch (error) {
    console.error('[PDF Gen] Error:', error);
    res.status(500).json({ ok: false, message: 'PDF generation failed' });
  }
}
