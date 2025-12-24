/**
 * Comprehensive PDF Template (Cover + All Roles)
 * Implements exact canonical spec from print-first template
 */

import { PRINT_CSS } from './print.css';

interface RoleData {
    roleName: string;
    sessionId: string;
    kicker: string;
    primaryBottleneckName: string;
    headline: string;
    subhead: string;
    evidenceObserved: string;
    impactVector: string;
    evidenceQuote1?: string;
    evidenceQuote2?: string;
    findings: Array<{
        claim: string;
        consequence: string;
        evidence?: string;
    }>;
    primaryBottleneckSummary: string;
    compoundingTags: string[];
    bottleneckEvidence?: string;
    plan: Array<{
        week: string;
        action: string;
        why: string;
        owner: string;
    }>;
    risks: string[];
    ctaLink: string;
}

interface TeamPdfData {
    generatedAt: string;
    rolesCompleted: number;
    companyName?: string;
    contactName?: string;
    contactEmail?: string;
    teamSessionId: string;
    team: {
        primaryConstraint: string;
        headline: string;
        summary: string;
        alignment: string;
        contradictions: number;
        confidenceLabel: string;
        keySignals?: string[];
    };
    roles: RoleData[];
    year: number;
}

export function renderTeamPdfHtml(data: TeamPdfData): string {
    const esc = (text: any): string => {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const renderRole = (role: RoleData) => `
        <section class="page role">
            <header class="page-header">
                <div class="brand">
                    <div class="brand-badge"></div>
                    <div class="brand-name">Strategic AI Roadmap</div>
                </div>
                <div class="top-meta">
                    <span class="pill"><span class="dot"></span> ROLE: ${esc(role.roleName)}</span>
                    <span class="meta-item">Session: <strong>${esc(role.sessionId)}</strong></span>
                </div>
            </header>

            <!-- HERO -->
            <section class="no-split">
                <div class="section-kicker">${esc(role.kicker)}</div>
                <div class="card">
                    <div class="card-title">${esc(role.primaryBottleneckName)}</div>
                    <h2 class="h2">${esc(role.headline)}</h2>
                    <div class="subhead subhead-wide">${esc(role.subhead)}</div>

                    <div class="grid-2" style="margin-top:14px;">
                        <div class="card card-flat">
                            <div class="card-title">Evidence observed</div>
                            <div class="card-body">${esc(role.evidenceObserved)}</div>
                            ${role.evidenceQuote1 ? `<div class="quote">"${esc(role.evidenceQuote1)}"</div>` : ''}
                        </div>
                        <div class="card card-flat">
                            <div class="card-title">Impact vector</div>
                            <div class="card-body">${esc(role.impactVector)}</div>
                            ${role.evidenceQuote2 ? `<div class="quote">"${esc(role.evidenceQuote2)}"</div>` : ''}
                        </div>
                    </div>
                </div>
            </section>

            <!-- WHAT WE FOUND -->
            <section class="section">
                <div class="section-num">01</div>
                <div class="section-title">What We Found</div>

                <div class="grid-2">
                    ${role.findings.slice(0, 2).map(finding => `
                        <div class="card">
                            <div class="card-title">${esc(finding.claim)}</div>
                            <div class="card-body">${esc(finding.consequence)}</div>
                            ${finding.evidence ? `<div class="quote">"${esc(finding.evidence)}"</div>` : ''}
                        </div>
                    `).join('')}

                    ${role.findings[2] ? `
                        <div class="card" style="grid-column: 1 / -1;">
                            <div class="card-title">${esc(role.findings[2].claim)}</div>
                            <div class="card-body">${esc(role.findings[2].consequence)}</div>
                            ${role.findings[2].evidence ? `<div class="quote">"${esc(role.findings[2].evidence)}"</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </section>

            <!-- PRIMARY BOTTLENECK -->
            <section class="section">
                <div class="section-num">02</div>
                <div class="section-title">Primary Bottleneck</div>

                <div class="card no-split">
                    <div class="bottleneck-row">
                        <div>
                            <div class="card-title" style="margin-bottom:6px;">${esc(role.primaryBottleneckName)}</div>
                            <div class="card-body">${esc(role.primaryBottleneckSummary)}</div>
                        </div>
                        <span class="pill"><span class="dot dot-warn"></span> Compounding</span>
                    </div>

                    <div class="rule"></div>

                    <div class="card-title">Why This Compounds</div>
                    <div class="tag-row">
                        ${role.compoundingTags.map(tag => `
                            <span class="pill"><span class="dot dot-blue"></span> ${esc(tag)}</span>
                        `).join('')}
                    </div>

                    ${role.bottleneckEvidence ? `
                        <div class="quote" style="margin-top:12px;">"${esc(role.bottleneckEvidence)}"</div>
                    ` : ''}
                </div>
            </section>

            <!-- NEXT 30 DAYS -->
            <section class="section">
                <div class="section-num">03</div>
                <div class="section-title">Next 30 Days</div>

                <div class="plan">
                    ${role.plan.map(item => `
                        <div class="plan-row">
                            <div class="week">${esc(item.week)}</div>
                            <div class="plan-main">
                                <div class="plan-title">${esc(item.action)}</div>
                                <div class="plan-why">${esc(item.why)}</div>
                            </div>
                            <div class="owner-tag">${esc(item.owner)}</div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- STRATEGIC RISKS + CTA -->
            <section class="section">
                <div class="section-num">04</div>
                <div class="section-title">Strategic Risks</div>

                <div class="grid-2">
                    ${role.risks.map(risk => `
                        <div class="card">
                            <div class="risk">
                                <div class="risk-bullet"></div>
                                <div class="risk-text">${esc(risk)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="cta">
                    <div class="cta-title">Stopping Here Locks the Constraint in Place</div>
                    <div class="cta-body">
                        This report identifies the structural constraint limiting execution. The full Roadmap converts it into a sequenced plan,
                        system design, and decision structure — so the constraint stops compounding.
                    </div>
                    <a class="cta-btn" href="${esc(role.ctaLink)}">Convert This Diagnosis Into an Execution Roadmap</a>
                </div>
            </section>

            <footer class="page-footer">
                <div class="footer-left">
                    <span>© ${data.year} Strategic AI Infrastructure</span>
                    <span class="footer-dot"></span>
                    <span>CONFIDENTIAL</span>
                </div>
                <div class="footer-right">${esc(role.roleName)}</div>
            </footer>
        </section>
    `;

    return `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Strategic AI Roadmap — Team Diagnostic</title>
    <style>${PRINT_CSS}</style>
</head>

<body>
    <div class="doc">
        <!-- COVER PAGE -->
        <section class="page cover">
            <header class="page-header">
                <div class="brand">
                    <div class="brand-badge"></div>
                    <div class="brand-name">Strategic AI Roadmap</div>
                </div>

                <div class="top-meta">
                    <span class="pill"><span class="dot"></span> CONFIDENTIAL</span>
                    <span class="meta-item">Generated: <strong>${esc(data.generatedAt)}</strong></span>
                </div>
            </header>

            <div class="cover-hero">
                <div class="cover-row">
                    <div class="cover-left">
                        <h1 class="h1">Team Diagnostic Report</h1>
                        <p class="subhead">
                            A role-based diagnostic across Owner, Sales, Operations, and Delivery — designed to isolate the structural constraint
                            limiting execution, then map the first sequence of leverage moves.
                        </p>

                        <div class="cover-pills">
                            <span class="pill"><span class="dot dot-green"></span> Roles completed: ${data.rolesCompleted} / 4</span>
                            <span class="pill"><span class="dot dot-blue"></span> Primary constraint: ${esc(data.team.primaryConstraint)}</span>
                            <span class="pill"><span class="dot dot-warn"></span> Confidence: ${esc(data.team.confidenceLabel)}</span>
                        </div>
                    </div>

                    ${data.companyName || data.contactName ? `
                        <div class="cover-right">
                            ${data.companyName ? `<div class="meta-line">Company: <strong>${esc(data.companyName)}</strong></div>` : ''}
                            ${data.contactName ? `<div class="meta-line">Contact: <strong>${esc(data.contactName)}</strong></div>` : ''}
                            ${data.contactEmail ? `<div class="meta-line">Email: <strong>${esc(data.contactEmail)}</strong></div>` : ''}
                            <div class="meta-line">Team Session: <strong>${esc(data.teamSessionId)}</strong></div>
                        </div>
                    ` : ''}
                </div>

                <div class="cover-summary">
                    <div class="mini">
                        <div class="k">What this is</div>
                        <div class="v">A diagnostic, not a roadmap.</div>
                    </div>
                    <div class="mini">
                        <div class="k">What it finds</div>
                        <div class="v">Where execution breaks under stress.</div>
                    </div>
                    <div class="mini">
                        <div class="k">What's next</div>
                        <div class="v">Sequence + systems plan to remove the constraint.</div>
                    </div>
                </div>
            </div>

            <section class="section no-split">
                <div class="section-kicker">TEAM SYNTHESIS</div>
                <div class="card">
                    <div class="card-title">${esc(data.team.headline)}</div>
                    <div class="card-body">${esc(data.team.summary)}</div>

                    <div class="grid-2" style="margin-top:12px;">
                        <div class="card card-flat">
                            <div class="card-title">Alignment</div>
                            <div class="card-body">${esc(data.team.alignment)}</div>
                        </div>
                        <div class="card card-flat">
                            <div class="card-title">Contradictions</div>
                            <div class="card-body">${data.team.contradictions}</div>
                        </div>
                    </div>

                    ${data.team.keySignals && data.team.keySignals.length > 0 ? `
                        <div class="rule"></div>
                        <div class="card-title">Key signals</div>
                        <ul class="bullets">
                            ${data.team.keySignals.map(signal => `<li>${esc(signal)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </section>

            <footer class="page-footer">
                <div class="footer-left">
                    <span>© ${data.year} Strategic AI Infrastructure</span>
                    <span class="footer-dot"></span>
                    <span>CONFIDENTIAL</span>
                </div>
                <div class="footer-right">Cover</div>
            </footer>
        </section>

        <!-- ROLE PAGES -->
        ${data.roles.map(renderRole).join('\n')}
    </div>
</body>
</html>
    `;
}
