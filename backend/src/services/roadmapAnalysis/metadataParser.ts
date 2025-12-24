/**
 * Roadmap Metadata Parser
 * 
 * Extracts structured signals from roadmap sections and diagnostics.
 * These signals are passed to the assistant to ground recommendations in actual data.
 */

export interface RoadmapSignals {
  topPainPoints: string[];
  leveragePlays: {
    title: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    system?: string;
  }[];
  quickWins: string[];
  workflowGaps: string[];
}

export interface RoadmapSection {
  id: string;
  sectionKey: string | null;
  sectionName: string;
  status: 'implemented' | 'in_progress' | 'planned';
  contentMarkdown: string;
}

export interface DiagnosticData {
  pains?: Record<string, number>; // domain -> pain score (1-10)
  maturity?: Record<string, number>; // domain -> maturity score (1-10)
  notes?: string[];
}

/**
 * Derive structured signals from roadmap sections and diagnostics.
 * 
 * Uses simple heuristics to extract:
 * - Top pain points (from content + diagnostics)
 * - Leverage plays (high impact / low effort)
 * - Quick wins (explicit quick wins in content)
 * - Workflow gaps (process inconsistencies)
 */
export function deriveRoadmapSignals(params: {
  roadmapSections: RoadmapSection[];
  diagnostics?: DiagnosticData;
}): RoadmapSignals {
  const { roadmapSections, diagnostics } = params;

  const signals: RoadmapSignals = {
    topPainPoints: [],
    leveragePlays: [],
    quickWins: [],
    workflowGaps: [],
  };

  // Parse roadmap sections for signals
  for (const section of roadmapSections) {
    const text = section.contentMarkdown.toLowerCase();
    const title = section.sectionName;
    const key = section.sectionKey;

    // Pain points
    if (text.includes('bottleneck') || text.includes('biggest pain') || text.includes('critical issue')) {
      signals.topPainPoints.push(`${title}: bottleneck or critical issue described in roadmap.`);
    }

    // Leverage plays (high impact + low effort)
    if ((text.includes('low effort') || text.includes('simple')) && 
        (text.includes('high impact') || text.includes('high roi'))) {
      signals.leveragePlays.push({
        title: `${title}`,
        impact: 'Described as high impact in roadmap content.',
        effort: 'low',
        system: key ?? undefined,
      });
    } else if (text.includes('medium effort') && text.includes('high impact')) {
      signals.leveragePlays.push({
        title: `${title}`,
        impact: 'Described as high impact in roadmap content.',
        effort: 'medium',
        system: key ?? undefined,
      });
    }

    // Quick wins
    if (text.includes('quick win') || text.includes('simple first version') || text.includes('easy to implement')) {
      signals.quickWins.push(`${title}: contains a quick win recommendation.`);
    }

    // Workflow gaps
    if (text.includes('no defined') || text.includes('inconsistent') || 
        text.includes('no process') || text.includes('manual') || text.includes('ad hoc')) {
      signals.workflowGaps.push(`${title}: lacks defined process or has consistency issues.`);
    }
  }

  // Fold high-pain diagnostics into topPainPoints
  if (diagnostics?.pains) {
    for (const [domain, score] of Object.entries(diagnostics.pains)) {
      if (score >= 8) {
        signals.topPainPoints.push(`Diagnostics: ${domain} is high pain (${score}/10).`);
      } else if (score >= 6) {
        signals.topPainPoints.push(`Diagnostics: ${domain} is moderate pain (${score}/10).`);
      }
    }
  }

  // Add maturity insights (low maturity = potential quick wins)
  if (diagnostics?.maturity) {
    for (const [domain, score] of Object.entries(diagnostics.maturity)) {
      if (score <= 3) {
        signals.workflowGaps.push(`Diagnostics: ${domain} has low maturity (${score}/10) - likely lacks defined process.`);
      }
    }
  }

  // Deduplicate (keep unique)
  signals.topPainPoints = [...new Set(signals.topPainPoints)];
  signals.quickWins = [...new Set(signals.quickWins)];
  signals.workflowGaps = [...new Set(signals.workflowGaps)];

  return signals;
}

/**
 * Format signals for display in prompt (compact representation)
 */
export function formatSignalsForPrompt(signals: RoadmapSignals): string {
  const lines: string[] = [];

  if (signals.topPainPoints.length > 0) {
    lines.push('Top Pain Points:');
    signals.topPainPoints.forEach(p => lines.push(`  - ${p}`));
  }

  if (signals.leveragePlays.length > 0) {
    lines.push('Leverage Plays (High Impact):');
    signals.leveragePlays.forEach(lp => lines.push(`  - ${lp.title} (${lp.effort} effort)`));
  }

  if (signals.quickWins.length > 0) {
    lines.push('Quick Wins:');
    signals.quickWins.forEach(qw => lines.push(`  - ${qw}`));
  }

  if (signals.workflowGaps.length > 0) {
    lines.push('Workflow Gaps:');
    signals.workflowGaps.forEach(wg => lines.push(`  - ${wg}`));
  }

  return lines.length > 0 ? lines.join('\n') : '(No structured signals extracted yet.)';
}
