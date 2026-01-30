export interface OnepagerSpec {
    headline: {
        tension: string;      // Lived operational pain
        diagnosis: string;    // SB label (Systemic Fragility, etc.)
    };
    subhead: string;

    observations: Array<{
        claim: string;        // What is happening (evidence.proof)
        consequence: string;  // Why it hurts (evidence.why)
        evidenceQuote?: string;  // AG-TICKET-08: Optional user voice evidence
        voiceEvidence?: string;  // AG-TICKET-11: Alias for evidenceQuote (same value)
    }>;

    bottleneck: {
        name: string;
        summary: string;           // Causal chain (2-3 sentences)
        inevitability: string;     // Why this compounds (failureMode)
        evidenceQuote?: string;    // AG-TICKET-08: Optional user voice evidence
        voiceEvidence?: string;    // AG-TICKET-11: Alias for evidenceQuote (same value)
    };

    firstMoves: Array<{
        action: string;
        why: string;
        time: string;
        owner: string;
    }>;

    risks: string[];

    cta: {
        text: string;
        link: string;
    };

    meta?: {
        hasVoiceNotes: boolean;  // AG-TICKET-08: Tracks if any voice evidence was injected
    };
}
