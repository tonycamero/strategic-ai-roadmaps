
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { executeSynthesisPipeline, extractFacts, extractPatterns, synthesizeAssertions, assembleSections, getValidationBreakdown } from '../../../services/executiveBriefSynthesis.service';
import { ExecutiveAssertionBlock } from '../../../types/executiveBrief';

// Manually enable Mode 2 for forensic replay if needed, but per ticket instructions we stick to deterministic first.
// "Run pipeline (in a deterministic non-LLM mode; if Mode 2 exists, disable it for this step)."
process.env.EXEC_BRIEF_MODE2_EXPANSION_ENABLED = 'false';

const FIXTURES_DIR = join(__dirname, '../../fixtures/executiveBriefSynthesis');
const OUTPUT_FILE = join(__dirname, '../../../../../docs/forensics/EXEC-BRIEF-FORENSIC-AUTOPSY-015.md');

const FIXTURES = [
    'fixture_minimal_valid.json',
    'fixture_typical_valid.json',
    'fixture_high_variance_valid.json'
];

interface ReplayStats {
    fixtureName: string;
    vectors: number;
    facts: number;
    patterns: number;
    assertionCandidates: number;
    validAssertions: number;
    finalSelected: number;
    rejections: {
        total: number;
        byType: Record<string, number>;
        examples: Record<string, string[]>;
    };
    routing: Record<string, number>;
    consultantSpeak: string[];
}

function analyzeConsultantSpeak(text: string): string[] {
    const OFFENDING_PHRASES = [
        "execution drag", "risk exposure identified", "signals detected",
        "structural constraints", "operational blind spots", "leverage point",
        "contextual understanding", "resource allocation patterns"
    ];
    return OFFENDING_PHRASES.filter(phrase => text.toLowerCase().includes(phrase));
}

async function replayFixture(filename: string): Promise<ReplayStats> {
    const raw = readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
    const data = JSON.parse(raw);

    // 1. Facts
    const facts = extractFacts(data.vectors);

    // 2. Patterns
    const patterns = extractPatterns(facts);

    // 3. Candidates (Method A)
    const candidates = synthesizeAssertions(patterns);

    // 4. Validation Rejection Ledger
    const breakdown = {
        total: 0,
        byType: {} as Record<string, number>,
        examples: {} as Record<string, string[]>
    };

    // Determine rejections manually to catch them before they filter
    // We instantiate a fresh breakdown logic or use getValidationBreakdown
    // But getValidationBreakdown counts aggregated. We need specific IDs.

    candidates.forEach(c => {
        const errors: string[] = [];
        if (c.assertion.split(' ').length > 24) errors.push('ASSERTION_TOO_LONG');
        if (c.evidence.length < 1 || c.evidence.length > 3) errors.push('INVALID_EVIDENCE_COUNT');
        if (!c.implication) errors.push('MISSING_IMPLICATION');
        if (!c.constraint_signal) errors.push('MISSING_CONSTRAINT_SIGNAL');

        if (errors.length > 0) {
            breakdown.total++;
            errors.forEach(e => {
                breakdown.byType[e] = (breakdown.byType[e] || 0) + 1;
                if (!breakdown.examples[e]) breakdown.examples[e] = [];
                if (breakdown.examples[e].length < 3) breakdown.examples[e].push(c.id);
            });
        }
    });

    // 5. Full Pipeline Execution (to capture routing & final selection)
    const result = await executeSynthesisPipeline(data.vectors);

    // 6. Routing Ledger
    const routing: Record<string, number> = {
        OPERATING_REALITY: 0,
        CONSTRAINT_LANDSCAPE: 0,
        BLIND_SPOT_RISKS: 0,
        ALIGNMENT_SIGNALS: 0
    };

    // Map output paragraphs back to sections
    if (result.content.sections) {
        Object.entries(result.content.sections).forEach(([key, paras]) => {
            if (key !== 'EXEC_SUMMARY') routing[key] = (paras as string[]).length;
        });
    }

    // 7. Consultant Speak Analysis
    const fullText = Object.values(result.content).filter(v => typeof v === 'string').join(' ');
    const detectedSpeak = analyzeConsultantSpeak(fullText);

    return {
        fixtureName: filename,
        vectors: data.vectors.length,
        facts: facts.length,
        patterns: patterns.length,
        assertionCandidates: candidates.length,
        validAssertions: candidates.length - breakdown.total, // Approx
        finalSelected: result.executiveAssertionBlock.length,
        rejections: breakdown,
        routing,
        consultantSpeak: [...new Set(detectedSpeak)]
    };
}

async function runForensics() {
    console.log("Running Forensic Replay...");
    const stats: ReplayStats[] = [];

    for (const f of FIXTURES) {
        try {
            stats.push(await replayFixture(f));
        } catch (err) {
            console.error(`Failed to replay ${f}:`, err);
        }
    }

    console.log("JSON_OUTPUT_START");
    console.log(JSON.stringify(stats, null, 2));
    console.log("JSON_OUTPUT_END");
}

runForensics();
