/**
 * Team Report PDF Template
 * Multi-role synthesis with comparison matrix
 */

import { PRINT_CSS } from './print.css';

interface TeamReportData {
    primaryConstraint: string;
    alignment: 'HIGH' | 'MED' | 'LOW';
    rolesCompleted: { owner: boolean; sales: boolean; ops: boolean; delivery: boolean };
    headline: string;
    summary: string;
    topSignals: string[];
    comparisonMatrix: Array<{
        dimension: string;
        owner: string;
        sales: string;
        ops: string;
        delivery: string;
        verdict: 'ALIGNED' | 'MISALIGNED';
    }>;
    contradictions: Array<{
        pair: string;
        description: string;
        probe: string;
    }>;
    firstMoves: Array<{
        week: string;
        action: string;
        owner: string;
    }>;
    generatedAt?: string;
}

export function renderTeamReportHtml(data: TeamReportData): string {
    const coverPage = `
        <div class="page cover">
            <div class="cover-header">Team Diagnostic Report</div>
            <div class="cover-edition">Cross-Functional Analysis</div>
            <div class="cover-bottleneck">${esc(data.primaryConstraint)}</div>
            <div class="cover-statement">
                Team Alignment: <span class="badge badge-${data.alignment.toLowerCase()}">${data.alignment}</span>
            </div>
            <div class="cover-role" style="margin-top: 2rem;">
                Roles Completed:
                ${data.rolesCompleted.owner ? '✓ Owner' : '○ Owner'} •
                ${data.rolesCompleted.sales ? '✓ Sales' : '○ Sales'} •
                ${data.rolesCompleted.ops ? '✓ Operations' : '○ Operations'} •
                ${data.rolesCompleted.delivery ? '✓ Delivery' : '○ Delivery'}
            </div>
            <div class="cover-footer">
                © 2025 Strategic AI Infrastructure • CONFIDENTIAL
                ${data.generatedAt ? ` • ${data.generatedAt}` : ''}
            </div>
        </div>
    `;

    const synthesisPage = `
        <div class="page content-page">
            <div class="title-strip">
                <h1>Team Synthesis</h1>
                <div class="subtitle">${esc(data.primaryConstraint)} • Alignment: ${data.alignment}</div>
            </div>

            <div class="section no-break">
                <h2 class="section-title">Key Finding</h2>
                <div class="card">
                    <h3>${esc(data.headline)}</h3>
                    <p>${esc(data.summary)}</p>
                </div>
            </div>

            <div class="section no-break">
                <h2 class="section-title">Top Signals</h2>
                <div class="card">
                    <ul>
                        ${data.topSignals.map(s => `<li>${esc(s)}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="page-footer">
                <span class="page-number">Page 2</span>
                <span class="brand-line">Strategic AI Infrastructure</span>
            </div>
        </div>
    `;

    const comparisonPage = `
        <div class="page content-page">
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
                        ${data.comparisonMatrix.map(row => `
                            <tr>
                                <td><strong>${esc(row.dimension)}</strong></td>
                                <td>${esc(row.owner)}</td>
                                <td>${esc(row.sales)}</td>
                                <td>${esc(row.ops)}</td>
                                <td>${esc(row.delivery)}</td>
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

            ${data.contradictions.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Key Contradictions</h2>
                    ${data.contradictions.map(c => `
                        <div class="card no-break">
                            <h3>${esc(c.pair)}</h3>
                            <p>${esc(c.description)}</p>
                            <p><strong>Recommended probe:</strong> ${esc(c.probe)}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="page-footer">
                <span class="page-number">Page 3</span>
                <span class="brand-line">Strategic AI Infrastructure</span>
            </div>
        </div>
    `;

    const firstMovesPage = `
        <div class="page content-page">
            <div class="section">
                <h2 class="section-title">First Moves (Next 30 Days)</h2>
                <div class="timeline">
                    ${data.firstMoves.map(move => `
                        <div class="timeline-item no-break">
                            <div class="week">${esc(move.week)}</div>
                            <div class="action">${esc(move.action)}</div>
                            <div class="owner">Owner: ${esc(move.owner)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="cta-block no-break">
                <h4>Convert This Team Diagnosis Into an Execution Roadmap</h4>
                <p>This report reveals systemic patterns across roles. The next step is aligning on shared priorities and translating insights into coordinated action.</p>
            </div>

            <div class="page-footer">
                <span class="page-number">Page 4</span>
                <span class="brand-line">Strategic AI Infrastructure</span>
            </div>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${PRINT_CSS}</style>
        </head>
        <body>
            ${coverPage}
            ${synthesisPage}
            ${comparisonPage}
            ${firstMovesPage}
        </body>
        </html>
    `;
}

function esc(text: string): string {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
