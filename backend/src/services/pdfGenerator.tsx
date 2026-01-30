import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
    normalizeText,
    splitSentences,
    normalizeToMetric,
    isMeaningfulValue,
    mapSynthesisToSections,
    projectSections,
    type ExecutiveBriefSection,
    type MetricBlock
} from '@roadmap/shared';

/**
 * Executive Brief PDF Generator
 * 
 * RENDERING CONTRACT (v4):
 * - ZERO DRIFT: PDF mirrors UI section model
 * - NO HALLUCINATION: Decision Latency & Risk is PROSE ONLY (no Cause/Effect/Risk)
 * - COGNITIVE SPLITTING: Paragraphs split every 4 sentences
 * - TYPOGRAPHY: 1.45 line-height, 10pt spacing
 * - PAGE BREAKS: No mid-block splitting (wrap={false} on paragraph chunks)
 */

// PDF Styles
const styles = StyleSheet.create({
    page: {
        paddingTop: 79.2,   // 1.1in
        paddingBottom: 72,  // 1.0in
        paddingLeft: 72,
        paddingRight: 72,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.45,
        color: '#111827',
    },
    documentTitle: {
        fontSize: 18,
        lineHeight: 1.3,
        fontWeight: 600,
        marginBottom: 24,
        color: '#111827',
    },
    sectionHeader: {
        fontSize: 13,
        lineHeight: 1.3,
        fontWeight: 600,
        textTransform: 'uppercase',
        marginTop: 20,
        marginBottom: 10,
        color: '#111827',
    },
    bodyText: {
        fontSize: 11,
        lineHeight: 1.45,
        color: '#111827',
        marginBottom: 10,
    },
    metadata: {
        fontSize: 10,
        lineHeight: 1.4,
        fontWeight: 500,
        color: '#374151',
        marginBottom: 8,
    },
    advisory: {
        fontSize: 10,
        lineHeight: 1.45,
        fontStyle: 'italic',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 16,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginTop: 16,
        marginBottom: 16,
    },
    calloutBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        marginBottom: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    calloutText: {
        fontSize: 10,
        lineHeight: 1.45,
        color: '#374151',
    },
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 4,
    },
    bulletChar: {
        width: 12,
        fontSize: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 1.45,
    },
    metricFooter: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 24,
    },
    metricLabel: {
        fontSize: 8,
        textTransform: 'uppercase',
        color: '#6B7280',
        fontWeight: 700,
        letterSpacing: 1,
    },
    metricValue: {
        fontSize: 10,
        fontWeight: 600,
        color: '#374151',
        marginTop: 2,
    }
});



// PDF Document Component
export function PrivateLeadershipBriefPDF({
    brief,
    firmName,
    generatedDate
}: {
    brief: any;
    firmName: string;
    generatedDate: string;
}) {
    const synthesis = brief.synthesis || {};
    const signals = brief.signals || {};
    const rawSections = mapSynthesisToSections(synthesis, signals);
    const sections = projectSections(rawSections, 'PRIVATE');

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Title */}
                <View>
                    <Text style={styles.documentTitle}>Executive Leadership–Only Brief</Text>
                    <Text style={styles.metadata}>{firmName.toUpperCase()}</Text>
                    <Text style={styles.metadata}>{generatedDate}</Text>
                    <Text style={[styles.advisory, { marginTop: 8 }]}>
                        CONFIDENTIAL — PRIVATE SYNTHESIS
                    </Text>
                </View>

                {/* Orientation (CALLOUT_BOX) */}
                <View style={styles.calloutBox}>
                    <Text style={[styles.sectionHeader, { marginTop: 0, fontSize: 11 }]}>
                        Orientation: What This Is (and Is Not)
                    </Text>
                    <Text style={styles.calloutText}>
                        This brief is a private synthesis of leadership-level signals surfaced during the Strategic AI Roadmap process.
                    </Text>
                    <Text style={[styles.calloutText, { marginTop: 8, fontStyle: 'italic' }]}>
                        It is not a performance evaluation, not a cultural diagnosis, and not intended for cross-functional distribution.
                        Its purpose is to surface patterns of perception, awareness, and signal flow that influence execution.
                    </Text>
                </View>

                {/* Metadata Strip (3-Column Grid v4) */}
                <View style={{ marginBottom: 20, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.metricLabel}>Constraint Consensus</Text>
                        <Text style={styles.metricValue}>{signals.constraintConsensusLevel || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.metricLabel}>Execution Risk</Text>
                        <Text style={styles.metricValue}>{signals.executionRiskLevel || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.metricLabel}>Org Clarity</Text>
                        <Text style={styles.metricValue}>{signals.orgClarityScore !== undefined ? `${signals.orgClarityScore}/100` : 'N/A'}</Text>
                    </View>
                </View>

                {/* Narrative Sections */}
                {sections.map((section) => (
                    <View key={section.id} wrap={true} style={{ marginTop: 20 }}>
                        <Text style={styles.sectionHeader}>{section.title}</Text>

                        {/* PATTERN_LIST: Intro + Blocks (wrap control) */}
                        {section.renderMode === 'PATTERN_LIST' && (
                            <View>
                                <Text style={[styles.advisory, { marginTop: 0, marginBottom: 12 }]}>{section.intro}</Text>
                                {(() => {
                                    const lines = (section.content as string).split('\n');
                                    const blocks: { type: 'PROSE' | 'BULLET', content: string }[] = [];
                                    lines.forEach(l => {
                                        const t = l.trim();
                                        if (!t) return;
                                        if (t.startsWith('•')) {
                                            blocks.push({ type: 'BULLET', content: t.replace(/^•\s*/, '') });
                                        } else {
                                            const last = blocks[blocks.length - 1];
                                            if (last && last.type === 'PROSE') last.content += " " + t;
                                            else blocks.push({ type: 'PROSE', content: t });
                                        }
                                    });

                                    return blocks.map((block, bIdx) => {
                                        if (block.type === 'BULLET') {
                                            return (
                                                <View key={bIdx} style={styles.bulletRow} wrap={false}>
                                                    <Text style={styles.bulletChar}>•</Text>
                                                    <Text style={styles.bulletText}>{block.content}</Text>
                                                </View>
                                            );
                                        }
                                        return splitSentences(block.content, 4).map((para, pIdx) => (
                                            <View key={`${bIdx}-${pIdx}`} wrap={false}>
                                                <Text style={styles.bodyText}>{para}</Text>
                                            </View>
                                        ));
                                    });
                                })()}
                            </View>
                        )}

                        {/* PROSE_NARRATIVE: Normalization + Splits (wrap control) */}
                        {section.renderMode === 'PROSE_NARRATIVE' && (
                            <View>
                                {splitSentences(section.content as string, 4).map((para, pIdx) => (
                                    <View key={pIdx} wrap={false}>
                                        <Text style={styles.bodyText}>{para}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* BULLET_LIST: Pure Enumeration */}
                        {section.renderMode === 'BULLET_LIST' && (
                            <View>
                                {(section.content as string[]).map((item, iIdx) => (
                                    <View key={iIdx} style={styles.bulletRow} wrap={false}>
                                        <Text style={styles.bulletChar}>•</Text>
                                        <Text style={styles.bulletText}>{String(item).replace(/^[•\-\*]\s+/, '').trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* METRIC_CALLOUT: Interpretation Box + Footer */}
                        {section.renderMode === 'METRIC_CALLOUT' && (
                            <View wrap={false}>
                                <View style={styles.calloutBox}>
                                    <View wrap={false}>
                                        <Text style={[styles.bodyText, { marginBottom: 0, fontStyle: 'italic' }]}>
                                            {normalizeText((section.content as MetricBlock).interpretation)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.metricFooter}>
                                    <View>
                                        <Text style={styles.metricLabel}>Calculated Level</Text>
                                        <Text style={styles.metricValue}>{(section.content as MetricBlock).level}</Text>
                                    </View>
                                    {(section.content as MetricBlock).capacityScore !== undefined && (
                                        <View>
                                            <Text style={styles.metricLabel}>Capacity Score</Text>
                                            <Text style={styles.metricValue}>{(section.content as MetricBlock).capacityScore}/10</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />
                    </View>
                ))}

                {/* Closing */}
                <View style={{ marginTop: 24, alignItems: 'center' }}>
                    <Text style={[styles.metadata, { letterSpacing: 2 }]}>— END OF BRIEF —</Text>
                </View>
            </Page>
        </Document>
    );
}

// Main render function
export async function renderPrivateLeadershipBriefToPDF(
    brief: any,
    firmName: string
): Promise<Buffer> {
    const { renderToBuffer } = await import('@react-pdf/renderer');

    const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const pdfDocument = (
        <PrivateLeadershipBriefPDF
            brief={brief}
            firmName={firmName || 'Untitled Firm'}
            generatedDate={generatedDate}
        />
    );

    return await renderToBuffer(pdfDocument);
}
