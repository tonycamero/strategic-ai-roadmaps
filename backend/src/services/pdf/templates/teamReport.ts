/**
 * Team Report PDF Template
 * Renders team synthesis with role comparisons
 */

import { PDF_STYLES } from './styles.ts';
import { buildCoverPage } from './cover.ts';

interface TeamReportPayload {
    teamReport: {
        headline?: string;
        summary?: string;
        primaryConstraint?: string;
        alignment?: 'HIGH' | 'MED' | 'LOW';
        topSignals?: string[];
        whyThisCompounds?: string[];
        firstMoves?: Array<{
            action: string;
            why: string;
            owner: string;
            time: string;
        }>;
        risks?: string[];
        evidence?: Array<{
            role: string;
            step: string;
            quote: string;
        }>;
        contradictions?: Array<{
            axis: string;
            pair: [string, string];
            description: string;
            recommendedProbe?: string;
        }>;
        comparisonMatrix?: Array<{
            axis: string;
            label: string;
            verdict: 'ALIGNED' | 'MISALIGNED';
            owner: any;
            sales: any;
            ops: any;
            delivery: any;
        }>;
    };
    meta?: {
        companyName?: string;
    };
}

export function buildTeamReportHtml(payload: TeamReportPayload): string {
    const { teamReport, meta } = payload;

    const coverHtml = buildCoverPage({
        title: 'Team Diagnostic Report',
        subtitle: 'Cross-Functional Analysis',
        companyName: meta?.companyName,
    });

    const contentHtml = `
    <div class="page">
      <div class="section">
        <h2 class="section-title">Team Synthesis</h2>
        <div class="card">
          <h3>${escapeHtml(teamReport.headline || 'Team Analysis')}</h3>
          <p>${escapeHtml(teamReport.summary || '')}</p>
          ${teamReport.alignment ? `
            <p>
              <strong>Team Alignment:</strong> 
              <span class="badge badge-${teamReport.alignment.toLowerCase()}">${teamReport.alignment}</span>
            </p>
          ` : ''}
          ${teamReport.primaryConstraint ? `
            <p><strong>Primary Constraint:</strong> ${escapeHtml(teamReport.primaryConstraint)}</p>
          ` : ''}
        </div>
      </div>

      ${teamReport.topSignals && teamReport.topSignals.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Top Signals</h2>
          <div class="card">
            <ul>
              ${teamReport.topSignals.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      ${teamReport.whyThisCompounds && teamReport.whyThisCompounds.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Why This Compounds</h2>
          <div class="card">
            <ul>
              ${teamReport.whyThisCompounds.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
    </div>

    ${teamReport.firstMoves && teamReport.firstMoves.length > 0 ? `
      <div class="page">
        <div class="section">
          <h2 class="section-title">First Moves</h2>
          <div class="first-moves-grid">
            ${teamReport.firstMoves.map(move => `
              <div class="first-move">
                <h4>${escapeHtml(move.action)}</h4>
                <div class="why">${escapeHtml(move.why)}</div>
                <div class="meta">
                  <span><strong>Owner:</strong> ${escapeHtml(move.owner)}</span>
                  <span><strong>Timeline:</strong> ${escapeHtml(move.time)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${teamReport.risks && teamReport.risks.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Risks</h2>
            <div class="card">
              <ul>
                ${teamReport.risks.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${teamReport.comparisonMatrix && teamReport.comparisonMatrix.length > 0 ? `
      <div class="page">
        <div class="section">
          <h2 class="section-title">Role Comparison Matrix</h2>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Owner</th>
                <th>Sales</th>
                <th>Ops</th>
                <th>Delivery</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              ${teamReport.comparisonMatrix.map(row => `
                <tr>
                  <td><strong>${escapeHtml(row.label)}</strong></td>
                  <td>${escapeHtml(row.owner?.choiceLabel || '-')}</td>
                  <td>${escapeHtml(row.sales?.choiceLabel || '-')}</td>
                  <td>${escapeHtml(row.ops?.choiceLabel || '-')}</td>
                  <td>${escapeHtml(row.delivery?.choiceLabel || '-')}</td>
                  <td>
                    <span class="badge badge-${row.verdict === 'ALIGNED' ? 'aligned' : 'misaligned'}">
                      ${row.verdict}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${teamReport.contradictions && teamReport.contradictions.length > 0 ? `
      <div class="page">
        <div class="section">
          <h2 class="section-title">Key Contradictions</h2>
          ${teamReport.contradictions.map(c => `
            <div class="card">
              <h3>${escapeHtml(c.pair.join(' vs '))}</h3>
              <p>${escapeHtml(c.description)}</p>
              ${c.recommendedProbe ? `
                <p><strong>Recommended probe:</strong> ${escapeHtml(c.recommendedProbe)}</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      ${coverHtml}
      ${contentHtml}
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
    if (!text) return '';
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
