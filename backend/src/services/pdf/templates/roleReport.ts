/**
 * Role Report PDF Template
 * Renders individual role diagnostic output
 */

import { PDF_STYLES } from './styles.ts';
import { buildCoverPage } from './cover.ts';

interface RoleReportPayload {
    role: string;
    report: {
        headline?: string;
        signals?: string[];
        diagnosis?: string;
        synthesis?: any;
    };
    meta?: {
        companyName?: string;
        attendeeName?: string;
    };
}

export function buildRoleReportHtml(payload: RoleReportPayload): string {
    const { role, report, meta } = payload;

    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const title = `Strategic AI Roadmap: ${roleName} Diagnostic`;

    // Extract synthesis data
    const synthesis = report.synthesis || report;
    const headline = synthesis.headline || report.headline || 'Diagnostic Results';
    const signals = synthesis.signals || report.signals || [];
    const diagnosis = synthesis.diagnosis || report.diagnosis || '';

    const coverHtml = buildCoverPage({
        title,
        subtitle: roleName + ' Role Analysis',
        companyName: meta?.companyName,
        attendeeName: meta?.attendeeName,
    });

    const contentHtml = `
    <div class="page">
      <div class="section">
        <h2 class="section-title">Key Finding</h2>
        <div class="card">
          <h3>${escapeHtml(headline)}</h3>
          <p>${escapeHtml(diagnosis)}</p>
        </div>
      </div>

      ${signals && signals.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Signals</h2>
          <div class="card">
            <ul>
              ${signals.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        Strategic AI Roadmap Portal - ${roleName} Diagnostic
      </div>
    </div>
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
