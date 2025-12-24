/**
 * Role Report PDF Template
 * Implements exact layout spec from META-TICKET
 */

import { PRINT_CSS } from './print.css';

interface RoleReportData {
    role: 'owner' | 'sales' | 'ops' | 'delivery';
    bottleneck: string;
    tensionStatement: string;
    evidenceObserved: string[];
    whatWeFound: Array<{ title: string; explanation: string }>;
    bottleneckDetail: string;
    next30Days: Array<{ week: string; action: string; owner: string }>;
    strategicRisks: string[];
    generatedAt?: string;
}

export function renderRoleReportHtml(data: RoleReportData): string {
    const roleNames = {
        owner: 'Owner',
        sales: 'Sales',
        ops: 'Operations',
        delivery: 'Delivery'
    };

    const roleName = roleNames[data.role];

    const coverPage = `
        <div class="page cover">
            <div class="cover-header">Strategic AI Roadmap</div>
            <div class="cover-edition">Webinar Edition</div>
            <div class="cover-role">${roleName}</div>
            <div class="cover-bottleneck">${esc(data.bottleneck)}</div>
            <div class="cover-statement">${esc(data.tensionStatement)}</div>
            <div class="cover-footer">
                © 2025 Strategic AI Infrastructure • CONFIDENTIAL
                ${data.generatedAt ? ` • ${data.generatedAt}` : ''}
            </div>
        </div>
    `;

    const contentPages = `
        <div class="page content-page">
            <div class="title-strip">
                <h1>${roleName} Analysis</h1>
                <div class="subtitle">Primary Bottleneck: ${esc(data.bottleneck)}</div>
            </div>

            <div class="section no-break">
                <h2 class="section-title">Evidence Observed</h2>
                <div class="card">
                    <ul>
                        ${data.evidenceObserved.map(e => `<li>${esc(e)}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="section no-break">
                <h2 class="section-title">What We Found</h2>
                ${data.whatWeFound.map(item => `
                    <div class="card">
                        <h3>${esc(item.title)}</h3>
                        <p>${esc(item.explanation)}</p>
                    </div>
                `).join('')}
            </div>

            <div class="section no-break">
                <h2 class="section-title">Primary Bottleneck</h2>
                <div class="card">
                    <h3>${esc(data.bottleneck)}</h3>
                    <p>${esc(data.bottleneckDetail)}</p>
                </div>
            </div>

            <div class="page-footer">
                <span class="page-number">Page 2</span>
                <span class="brand-line">Strategic AI Infrastructure</span>
            </div>
        </div>

        <div class="page content-page">
            <div class="section">
                <h2 class="section-title">Next 30 Days</h2>
                <div class="timeline">
                    ${data.next30Days.map(item => `
                        <div class="timeline-item no-break">
                            <div class="week">${esc(item.week)}</div>
                            <div class="action">${esc(item.action)}</div>
                            <div class="owner">Owner: ${esc(item.owner)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section no-break">
                <h2 class="section-title">Strategic Risks</h2>
                <div class="card">
                    <ul>
                        ${data.strategicRisks.map(r => `<li>${esc(r)}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="cta-block no-break">
                <h4>Convert This Diagnosis Into an Execution Roadmap</h4>
                <p>This diagnostic reveals where execution breaks. The next step is translating these insights into a sequenced, owner-assigned roadmap.</p>
            </div>

            <div class="page-footer">
                <span class="page-number">Page 3</span>
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
            ${contentPages}
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
