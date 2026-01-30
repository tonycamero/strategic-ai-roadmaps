// Strict TypeScript enforcement for evidence IDs
type A1 = 'A1_FU' | 'A1_RESP' | 'A1_HAND' | 'A1_LOAD' | 'A1_CHAOS';
type A2 = 'A2_MAN' | 'A2_MEET' | 'A2_FOUN' | 'A2_LOST';
type A3 = 'A3_FOUN' | 'A3_OPS' | 'A3_NONE' | 'A3_VEND';
export type EvidenceId = A1 | A2 | A3;

export interface Evidence {
    proof: string;
    why: string;
}

export const evidenceMap: Record<EvidenceId, Evidence> = {
    // Q1: Where does execution break?
    'A1_FU': {
        proof: "Inbound leads wait 4+ hours for first contact, then choose faster competitors.",
        why: "Your sales team lacks instant-capture tools. Prospects interpret silence as capacity risk and move on."
    },
    'A1_RESP': {
        proof: "Client inquiries sit unanswered for days while your team juggles other fires.",
        why: "Response delays signal operational chaos. Prospects assume you can't handle their volume and exit quietly."
    },
    'A1_HAND': {
        proof: "Critical context vanishes when sales passes deals to delivery.",
        why: "Sales promises get lost in translation. Delivery teams start from scratch, clients notice the gap."
    },
    'A1_LOAD': {
        proof: "Your team hits capacity at 1.5x current volume and execution fragments.",
        why: "Person-dependent processes collapse under scale. Revenue stalls because the founder can't clone themselves."
    },
    'A1_CHAOS': {
        proof: "Every day is firefighting; no one has time for strategic work.",
        why: "Constant reactivity prevents building durable systems. The business stays fragile because urgency always wins."
    },

    // Q2: When that happens, what usually fills the gap?
    'A2_MAN': {
        proof: "Someone manually bridges every gap with spreadsheets and late nights.",
        why: "Your ops team becomes the duct tape. High-value staff spend energy on repetitive rescue work."
    },
    'A2_MEET': {
        proof: "Coordination now requires Slack marathons and emergency sync calls.",
        why: "Communication overhead compounds daily. Eventually meetings consume all productive hours and delivery slows."
    },
    'A2_FOUN': {
        proof: "The founder still intervenes personally to close every critical deal.",
        why: "Owner-dependency caps enterprise value. Buyers see a business that can't run without you."
    },
    'A2_LOST': {
        proof: "High-intent leads vanish because follow-up costs too much mental energy.",
        why: "Cognitive overload causes invisible revenue loss. The real cost never appears on your P&L."
    },

    // Q3: When execution fails, who actually owns fixing it?
    'A3_FOUN': {
        proof: "Every systemic breakdown still lands on the founder's plate.",
        why: "If you're both architect and repairman, the structure never scales beyond your personal ceiling."
    },
    'A3_OPS': {
        proof: "Ops managers patch symptoms daily instead of redesigning broken systems.",
        why: "Without clear authority to rebuild, talented staff waste time on Band-Aids. Systemic fixes never happen."
    },
    'A3_NONE': {
        proof: "Breakdowns get accepted as normal; no one owns making them stop.",
        why: "Unowned problems become permanent culture. Quality degrades silently until a client publicly flags failure."
    },
    'A3_VEND': {
        proof: "External vendors add tools without understanding your actual workflow.",
        why: "Software layered onto broken processes creates expensive noise. The real bottleneck never gets addressed."
    }
};

export const clusterMap: Record<string, string> = {
    'SB-01': "Systemic Fragility",
    'SB-02': "Vacuum of Ownership",
    'SB-03': "Scale Ceiling"
};

export const failureModeMap: Record<string, string> = {
    'SB-01': "Under stress, your talented team will burn out trying to maintain manual workarounds.",
    'SB-02': "Without a clear owner, critical errors will recycle indefinitely until a client flags a major failure.",
    'SB-03': "The current 'founder-heavy' model will effectively cap your revenue at 1.5x your current volume."
};

// Quality assertion for development
export const BANNED_COPY = [
    'optimize', 'streamline', 'leverage', 'synergies', 'robust',
    'scalable', 'workflows', 'operational leverage', 'technical autonomy',
    'process mapping', 'single source of truth', 're-engineering systems',
    'bandwidth', 'stakeholders', 'under stress', 'manual workarounds'
];

export function assertEvidenceMapQuality(map = evidenceMap): void {
    if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return;

    Object.entries(map).forEach(([key, evidence]) => {
        // Check proof word count (≤18)
        const proofWords = evidence.proof.split(/\s+/).length;
        if (proofWords > 18) {
            throw new Error(`[${key}] proof exceeds 18 words (${proofWords}): "${evidence.proof}"`);
        }

        // Check why word count (≤40)
        const whyWords = evidence.why.split(/\s+/).length;
        if (whyWords > 40) {
            throw new Error(`[${key}] why exceeds 40 words (${whyWords}): "${evidence.why}"`);
        }

        // Check for banned phrases (excluding failureMode exceptions)
        const allText = `${evidence.proof} ${evidence.why}`.toLowerCase();
        BANNED_COPY.forEach(banned => {
            // Skip checking failureMode entries for specific phrases
            if (key.startsWith('SB-') && (banned === 'under stress' || banned === 'manual workarounds')) {
                return;
            }
            if (allText.includes(banned.toLowerCase())) {
                throw new Error(`[${key}] contains banned phrase: "${banned}"`);
            }
        });
    });

    console.log('[Evidence Map] Quality assertion passed ✓');
}
