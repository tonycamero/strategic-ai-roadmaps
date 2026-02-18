import { OnepagerSpec } from '../types/OnepagerSpec';
import { evidenceMap, clusterMap, failureModeMap, assertEvidenceMapQuality } from './evidenceMap';
import { isUsableVoice, formatEvidenceQuote } from './voiceUtils'; // AG-TICKET-08

// Run quality check in development mode
if (import.meta.env?.DEV) {
    assertEvidenceMapQuality();
}

// AG-TICKET-12.1: Canonical Hero Diagnosis Map (Structural Conditions, Not Symptoms)
const HERO_DIAGNOSIS_MAP: Record<string, string> = {
    'SB-01': 'Critical context collapses across handoffs.',
    'SB-02': 'Responsibility dissolves between roles.',
    'SB-03': 'Growth is capped by human throughput.'
};

// Frontend-native synthesis logic (avoiding CommonJS import)
function selectSynthesis(answers: { Q1?: string; Q2?: string; Q3?: string }): string {
    const { Q1, Q2, Q3 } = answers;
    if (Q3 === 'A3_NONE') {
        return 'SB-02';
    }
    if (Q1 === 'A1_LOAD' || Q2 === 'A2_MAN' || Q2 === 'A2_FOUN') {
        return 'SB-03';
    }
    return 'SB-01';
}

export function shapeOnepager(
    raw: any,
    answers: Record<string, string> = {},
    voiceNotes: Record<string, string> = {}  // AG-TICKET-08: Use voice notes for evidence injection
): OnepagerSpec {
    // If no raw data and no answers, return fallback
    if (!raw && Object.keys(answers).length === 0) {
        return getFallbackOnepager();
    }

    // Map A-keys to Q-keys for shared logic compatibility
    const synthesisAnswers = {
        Q1: answers.A1 || '',
        Q2: answers.A2 || '',
        Q3: answers.A3 || ''
    };

    const cluster = selectSynthesis(synthesisAnswers);
    const diagnosis = clusterMap[cluster] || "Strategic Infrastructure Review";

    // Generate observations from evidence
    const observations: Array<{ claim: string; consequence: string; evidenceQuote?: string; voiceEvidence?: string }> = [];
    ['A1', 'A2', 'A3'].forEach(key => {
        const id = answers[key];
        if (id && evidenceMap[id as import('./evidenceMap').EvidenceId]) {
            const evidence = evidenceMap[id as import('./evidenceMap').EvidenceId];
            observations.push({
                claim: evidence.proof,
                consequence: evidence.why
            });
        }
    });

    // Fallback if no specific observations found
    if (observations.length === 0) {
        observations.push({
            claim: "Current workflows require excessive manual intervention.",
            consequence: "Every manual step introduces delay, risk, and cognitive overhead for your team."
        });
    }

    // Determine primary bottleneck
    const primaryEvidenceId = answers.A1 || answers.A2 || '';
    const primaryEvidence = primaryEvidenceId ? evidenceMap[primaryEvidenceId as import('./evidenceMap').EvidenceId] : undefined;

    // AG-TICKET-12.1: Use canonical structural diagnosis, never symptom narration
    const structuralDiagnosis = HERO_DIAGNOSIS_MAP[cluster] || "Your operations are constrained by underlying structural limits.";

    // Construct headline from canonical diagnosis
    const headline = {
        tension: structuralDiagnosis,  // AG-TICKET-12.1: Structural condition, not symptom
        diagnosis: diagnosis  // Classification label (Scale Ceiling, etc.)
    };

    const bottleneck: {
        name: string;
        summary: string;
        inevitability: string;
        evidenceQuote?: string;
        voiceEvidence?: string;  // AG-TICKET-11: Alias
    } = {
        name: diagnosis,
        summary: primaryEvidence
            ? `${primaryEvidence.proof} ${primaryEvidence.why}`
            : "The business is limited by bottlenecks that require high-level manual oversight.",
        inevitability: failureModeMap[cluster] || "Under volume, manual oversight becomes the single point of total failure."
    };

    // AG-TICKET-08: Inject voice evidence quotes (deterministic mapping)
    let hasVoiceNotes = false;

    // A1 voice → First observation
    if (observations[0] && isUsableVoice(voiceNotes.A1 || '')) {
        const quote = formatEvidenceQuote(voiceNotes.A1);
        observations[0].evidenceQuote = quote;
        observations[0].voiceEvidence = quote;  // AG-TICKET-11: Alias
        hasVoiceNotes = true;
    }

    // A2 voice → Second observation  
    if (observations[1] && isUsableVoice(voiceNotes.A2 || '')) {
        const quote = formatEvidenceQuote(voiceNotes.A2);
        observations[1].evidenceQuote = quote;
        observations[1].voiceEvidence = quote;  // AG-TICKET-11: Alias
        hasVoiceNotes = true;
    }

    // A3 voice → Bottleneck
    if (isUsableVoice(voiceNotes.A3 || '')) {
        const quote = formatEvidenceQuote(voiceNotes.A3);
        bottleneck.evidenceQuote = quote;
        bottleneck.voiceEvidence = quote;  // AG-TICKET-11: Alias
        hasVoiceNotes = true;
    }

    // First moves based on top constraints
    const firstMoves = [];
    if (answers.A1 === 'A1_FU' || answers.A1 === 'A1_RESP') {
        firstMoves.push({
            action: "Lead Triage Automation",
            why: "To capture and qualify inquiries instantly without human lag.",
            time: "Week 1",
            owner: "Ops Lead"
        });
    } else if (answers.A1 === 'A1_LOAD') {
        firstMoves.push({
            action: "Capacity Stress Test",
            why: "To identify exactly where the manual bridge collapses under volume.",
            time: "Week 1",
            owner: "Technical Lead"
        });
    } else {
        firstMoves.push({
            action: "Process Mapping",
            why: "To visualize every step where data or context is currently lost.",
            time: "Week 1",
            owner: "Operations"
        });
    }

    if (answers.A2 === 'A2_MAN' || answers.A2 === 'A2_FOUN') {
        firstMoves.push({
            action: "Asynchronous Handoffs",
            why: "To decouple execution from person-to-person synchronization.",
            time: "Week 2",
            owner: "Team"
        });
    } else {
        firstMoves.push({
            action: "Source of Truth Audit",
            why: "To consolidate fragmented data into a single operational view.",
            time: "Week 2",
            owner: "Lead Architect"
        });
    }

    firstMoves.push({
        action: "Automation Implementation",
        why: "To replace manual grunt work with persistent software agents.",
        time: "Week 3-4",
        owner: "Engineering"
    });

    return {
        headline,
        subhead: "A prioritized path to operational leverage and technical autonomy.",
        observations,
        bottleneck,
        firstMoves,
        risks: [
            "Cognitive Overload: Delaying systemic fixes leads to compounding technical debt.",
            "Market Lag: Competitors with automated follow-ups will eventually capture your margin."
        ],
        cta: {
            text: "Join the Eugene Cohort",
            link: "/signup"
        },
        meta: hasVoiceNotes ? { hasVoiceNotes: true } : undefined  // AG-TICKET-08
    };
}

export function getFallbackOnepager(): OnepagerSpec {
    return {
        headline: {
            tension: "Your operations are constrained by manual coordination overhead.",
            diagnosis: "Strategic Infrastructure Review"
        },
        subhead: "This document synthesizes our initial discovery findings into a prioritized roadmap.",
        observations: [
            {
                claim: "Current workflows rely heavily on manual intervention at lead-capture.",
                consequence: "Every manual step introduces delay, risk, and cognitive overhead for your team."
            },
            {
                claim: "Data is siloed across various channels.",
                consequence: "Information fragmentation causes duplicated work and inconsistent client experiences."
            },
            {
                claim: "Execution depends on high-touch founder involvement.",
                consequence: "This creates a permanent ceiling on growth velocity and enterprise value."
            }
        ],
        bottleneck: {
            name: "Founder Dependency Ceiling",
            summary: "The business is limited by bottlenecks that require high-level manual oversight. Critical decisions and executions rely on founder availability.",
            inevitability: "Without structural changes, growth will linearly increase founder workload until capacity is reached."
        },
        firstMoves: [
            {
                action: "Infrastructure Audit",
                why: "Identify source of truth for all client data.",
                time: "Days 1-7",
                owner: "Strategy Lead"
            },
            {
                action: "Handoff Optimization",
                why: "Automate the transition from Sales to Delivery.",
                time: "Days 8-14",
                owner: "Ops Lead"
            },
            {
                action: "Dashboard Deployment",
                why: "Gain visibility into bottleneck triggers.",
                time: "Days 15-30",
                owner: "Tech Lead"
            }
        ],
        risks: [
            "Technical debt from manual workarounds.",
            "Loss of proprietary context during scaling."
        ],
        cta: {
            text: "Join the Next Cohort",
            link: "/signup"
        }
    };
}
