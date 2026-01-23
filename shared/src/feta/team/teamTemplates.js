"use strict";
/**
 * FE-TA Team Synthesis Templates
 * Deterministic templates for headlines, summaries, and first moves per constraint
 *
 * IMPORTANT: All strings use ASCII quotes only (no smart quotes)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAM_TEMPLATES = void 0;
exports.getTeamTemplate = getTeamTemplate;
exports.TEAM_TEMPLATES = {
    'Context Collapse': {
        headline: `Your team is compensating for context collapse - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: context is not persisting across handoffs. This is solvable, but only as a system-level fix.`,
        summaryMed: `Some roles see context loss; others see different breakpoints. The real issue: information dies between stages.`,
        summaryLow: `Each role diagnoses differently, but context collapse underlies multiple failures. Misalignment itself reveals the gap.`,
        topSignals: [
            'Critical information drops at handoffs',
            'Teams restart understanding mid-stream',
            'Rework cycles and scope drift are normalized'
        ],
        whyThisCompounds: [
            'Each handoff creates information loss',
            'Downstream teams operate on assumptions',
            'Client confusion reflects internal fragmentation'
        ],
        firstMoves: [
            { action: 'Define the handoff contract', why: 'Stop rework + client confusion', owner: 'Ops Lead', time: 'Week 1' },
            { action: 'Single source of truth for scope + status', why: 'Eliminate guesswork', owner: 'Ops', time: 'Week 2' },
            { action: 'Automate client update triggers', why: 'Enforce visibility', owner: 'Delivery', time: 'Weeks 3-4' }
        ],
        risks: [
            'Workarounds will persist unless handoffs are enforced systemically',
            'Scope drift will continue even with better communication'
        ]
    },
    'Revenue Leak': {
        headline: `Your team is compensating for revenue leak - and the mismatch is the signal.`,
        summaryHigh: `All roles see follow-up failures. This is not a sales problem - it is a system problem.`,
        summaryMed: `Sales feels the pain; others see adjacent symptoms. The real issue: follow-up is not enforced structurally.`,
        summaryLow: `Each role diagnoses differently, but revenue is leaking silently. Misalignment reveals fragmented accountability.`,
        topSignals: [
            'Follow-ups rely on memory instead of enforcement',
            'High-intent prospects fall through cracks',
            'Pipeline confidence is emotional, not evidential'
        ],
        whyThisCompounds: [
            'No structural enforcement of follow-up',
            'Lead volume grows faster than attention',
            'Revenue loss is invisible until retrospective'
        ],
        firstMoves: [
            { action: 'Lead response SLA with enforcement', why: 'Stop silent revenue leak', owner: 'Sales', time: 'Week 1' },
            { action: 'Automated follow-up sequences', why: 'Remove dependency on memory', owner: 'Sales Ops', time: 'Week 2' },
            { action: 'Pipeline visibility dashboard', why: 'Make leaks visible in real-time', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Manual follow-up will continue to fail under load',
            'Revenue leak will accelerate as volume grows'
        ]
    },
    'Founder-as-Buffer': {
        headline: `Your team is compensating for founder-as-buffer - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: founder intervention is masking systemic gaps. Growth is blocked.`,
        summaryMed: `Some roles depend on founder; others work around it. The real issue: no delegation infrastructure.`,
        summaryLow: `Each role experiences founder bottleneck differently. Misalignment shows the constraint's reach.`,
        topSignals: [
            'Founder steps in to unblock deals and decisions',
            'Authority routes upward by default',
            'Process discipline erodes under pressure'
        ],
        whyThisCompounds: [
            'No clear delegation rules',
            'Team lacks decision authority',
            'Founder becomes single point of failure'
        ],
        firstMoves: [
            { action: 'Decision routing map', why: 'Clarify what routes to founder vs. team', owner: 'Founder', time: 'Week 1' },
            { action: 'Delegation rules + thresholds', why: 'Empower team to execute', owner: 'Founder + Ops', time: 'Week 2' },
            { action: 'Approval automation + notifications', why: 'Remove founder from low-value decisions', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Revenue appears healthy only because founder compensates',
            'Growth ceiling hits when founder time saturates'
        ]
    },
    'Manual Drag': {
        headline: `Your team is compensating for manual drag - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: manual processes dominate. Automation is the unlock.`,
        summaryMed: `Some roles feel manual burden; others see different constraints. The real issue: compounding inefficiency.`,
        summaryLow: `Each role experiences manual work differently. Misalignment reveals where automation creates most leverage.`,
        topSignals: [
            'Manual steps multiply as volume grows',
            'Errors increase with workload',
            'Team velocity does not match effort'
        ],
        whyThisCompounds: [
            'Each manual step adds latency',
            'Error rate increases with volume',
            'Team burns energy on repetition instead of value'
        ],
        firstMoves: [
            { action: 'Audit manual steps by function', why: 'Identify highest-volume repeatable work', owner: 'Ops', time: 'Week 1' },
            { action: 'Automate top 3 manual workflows', why: 'Reclaim 20+ hours/week', owner: 'Ops + Delivery', time: 'Weeks 2-3' },
            { action: 'Trigger-based automation rules', why: 'Enforce consistency automatically', owner: 'Ops', time: 'Week 4' }
        ],
        risks: [
            'Manual work will scale faster than team capacity',
            'Quality will erode as volume increases'
        ]
    },
    'Scale Ceiling': {
        headline: `Your team is compensating for a scale ceiling - and the mismatch is the signal.`,
        summaryHigh: `All roles see volume breaking execution. Current bridges work for 50 clients but fail at 100.`,
        summaryMed: `Some roles feel volume pressure; others see different limits. The real issue: no structural reinforcement.`,
        summaryLow: `Each role experiences scale differently. Misalignment reveals where infrastructure is missing.`,
        topSignals: [
            'Execution degrades as volume increases',
            'Team velocity does not match workload',
            'Quality depends on heroic effort'
        ],
        whyThisCompounds: [
            'Current processes rely on manual judgment',
            'No structural capacity buffers',
            'Growth creates compounding friction'
        ],
        firstMoves: [
            { action: 'Define capacity limits per function', why: 'Make ceiling visible before hitting it', owner: 'Ops', time: 'Week 1' },
            { action: 'Build trigger-based triage system', why: 'Route work intelligently at scale', owner: 'Ops', time: 'Week 2' },
            { action: 'Automate high-frequency workflows', why: 'Remove volume dependency on people', owner: 'Ops + Delivery', time: 'Weeks 3-4' }
        ],
        risks: [
            'Current manual bridges will break unpredictably',
            'Quality will degrade silently under load'
        ]
    },
    'Reactive Operating System': {
        headline: `Your team is compensating for reactive chaos - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: firefighting is the operating model. This hardens if not corrected.`,
        summaryMed: `Some roles firefight constantly; others see adjacent symptoms. The real issue: no proactive structure.`,
        summaryLow: `Each role experiences chaos differently. Misalignment shows how reactive patterns compound.`,
        topSignals: [
            'Meetings replace execution',
            'Priority shifts constantly',
            'Stability depends on specific people'
        ],
        whyThisCompounds: [
            'No early-warning systems',
            'Issues surface as crises',
            'Team energy spent on triage instead of prevention'
        ],
        firstMoves: [
            { action: 'Define what "proactive" looks like per function', why: 'Shift from reactive to planned', owner: 'Leadership', time: 'Week 1' },
            { action: 'Build health monitoring dashboard', why: 'Surface issues before they become crises', owner: 'Ops', time: 'Week 2' },
            { action: 'Automated escalation rules', why: 'Enforce proactive intervention', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Firefighting will persist unless replaced with structural prevention',
            'Team burnout will accelerate'
        ]
    },
    'No Ownership Layer': {
        headline: `Your team is compensating for missing ownership - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: ownership is unclear. Nothing gets fixed because no one owns the fix.`,
        summaryMed: `Some roles feel ownership gaps; others see adjacent issues. The real problem: accountability vacuum.`,
        summaryLow: `Each role experiences ownership differently. Misalignment reveals where ownership structure is missing.`,
        topSignals: [
            'Issues recycle without resolution',
            'No clear owner for cross-functional problems',
            'Workarounds replace accountability'
        ],
        whyThisCompounds: [
            'No one explicitly owns the "fix"',
            'Problems escalate silently',
            'Team avoids ownership to avoid blame'
        ],
        firstMoves: [
            { action: 'RACI matrix for top 10 recurring issues', why: 'Make ownership explicit', owner: 'Leadership', time: 'Week 1' },
            { action: 'Ownership assignment rules', why: 'Enforce accountability structurally', owner: 'Ops', time: 'Week 2' },
            { action: 'Automated ownership notifications', why: 'Remove ambiguity from escalation', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Ownership vacuum will persist even with good intentions',
            'Cross-functional issues will continue to fall through cracks'
        ]
    },
    'Stack Noise': {
        headline: `Your team is compensating for stack fragmentation - and the mismatch is the signal.`,
        summaryHigh: `All roles agree: tool sprawl creates friction. Consolidation is the unlock.`,
        summaryMed: `Some roles blame tools; others see different constraints. The real issue: data lives in silos.`,
        summaryLow: `Each role experiences tool friction differently. Misalignment shows where integration creates leverage.`,
        topSignals: [
            'Data lives in multiple disconnected systems',
            'Teams switch tools constantly',
            'Single source of truth does not exist'
        ],
        whyThisCompounds: [
            'Each tool adds context-switching cost',
            'Data fragmentation increases with tools',
            'Decisions rely on reconstructing reality from silos'
        ],
        firstMoves: [
            { action: 'Audit current stack usage', why: 'Identify redundancy and gaps', owner: 'Ops', time: 'Week 1' },
            { action: 'Define single source of truth per data type', why: 'Reduce fragmentation', owner: 'Ops', time: 'Week 2' },
            { action: 'Consolidate or integrate top 3 disconnected tools', why: 'Eliminate context-switching', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Tool sprawl will continue even with new systems',
            'Data fragmentation will worsen as team grows'
        ]
    },
    'Systemic Fragmentation': {
        headline: `Your team is compensating for systemic fragmentation - and the mismatch is the signal.`,
        summaryHigh: `Team sees the same problems but from different angles. Alignment creates opportunity.`,
        summaryMed: `Some patterns emerge, but diagnosis varies. The real issue: no shared problem definition.`,
        summaryLow: `Each role sees a different problem. Misalignment itself is diagnostic - the system lacks shared truth.`,
        topSignals: [
            'Each function optimizes locally',
            'Cross-functional coordination is manual',
            'Systemic issues appear as isolated symptoms'
        ],
        whyThisCompounds: [
            'No shared problem definition',
            'Solutions optimize for local maxima',
            'Systemic drag increases with each workaround'
        ],
        firstMoves: [
            { action: 'Define shared problem statement', why: 'Align team on what to solve', owner: 'Leadership', time: 'Week 1' },
            { action: 'Cross-functional diagnostic session', why: 'Surface hidden dependencies', owner: 'Leadership', time: 'Week 2' },
            { action: 'Pilot systemic fix in one area', why: 'Prove compounding value', owner: 'Ops', time: 'Weeks 3-4' }
        ],
        risks: [
            'Local optimizations will continue to create global friction',
            'Misalignment will widen as each function acts independently'
        ]
    }
};
/**
 * Get team template for a primary constraint and alignment level
 */
function getTeamTemplate(primaryConstraint, alignmentLevel) {
    const template = exports.TEAM_TEMPLATES[primaryConstraint] || exports.TEAM_TEMPLATES['Systemic Fragmentation'];
    let summary;
    switch (alignmentLevel) {
        case 'HIGH':
            summary = template.summaryHigh;
            break;
        case 'MED':
            summary = template.summaryMed;
            break;
        case 'LOW':
            summary = template.summaryLow;
            break;
    }
    return { template, summary };
}
