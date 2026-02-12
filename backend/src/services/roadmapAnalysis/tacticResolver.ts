/**
 * Tactical Frame Resolver
 * 
 * Computes a per-query reasoning frame that anchors the assistant's response.
 * The frame identifies:
 * - The main constraint (what's blocking progress)
 * - The primary system to focus on
 * - A leverage play (if available)
 * - Suggested micro-steps
 */

import type { RoadmapSignals, DiagnosticData } from './metadataParser.ts';

export interface TacticalFrame {
  mainConstraint?: string;
  primarySystem?: string;
  leveragePlay?: string;
  microSteps?: string[];
}

/**
 * Resolve tactical frame from signals, diagnostics, and current view.
 * 
 * Priority logic:
 * 1. If there's a clear high-pain domain (8+/10), anchor there
 * 2. If user is viewing a specific section, consider that as candidate focus
 * 3. Pick a leverage play if one exists
 * 4. Provide generic micro-steps tied to the primary system
 */
export function resolveTacticalFrame(params: {
  signals: RoadmapSignals;
  diagnostics?: DiagnosticData;
  currentView?: string | null; // roadmap section key or id
}): TacticalFrame {
  const { signals, diagnostics, currentView } = params;

  const frame: TacticalFrame = {
    mainConstraint: undefined,
    primarySystem: undefined,
    leveragePlay: undefined,
    microSteps: [],
  };

  // 1) High-pain domain (8+/10) becomes main constraint
  const highPainDomain = diagnostics?.pains
    ? Object.entries(diagnostics.pains)
        .sort((a, b) => b[1] - a[1]) // Highest first
        .find(([, score]) => score >= 8)
    : undefined;

  if (highPainDomain) {
    const [domain, score] = highPainDomain;
    frame.mainConstraint = `${domain} is a high-pain area (${score}/10).`;
    frame.primarySystem = domain;
  }

  // 2) If user is viewing a section, consider as candidate focus (if no high-pain override)
  if (!frame.primarySystem && currentView) {
    frame.primarySystem = currentView;
    frame.mainConstraint ??= `User is focused on ${currentView}.`;
  }

  // 3) Pick a leverage play if available (prefer low-effort)
  const lowEffortPlay = signals.leveragePlays.find(lp => lp.effort === 'low');
  const mediumEffortPlay = signals.leveragePlays.find(lp => lp.effort === 'medium');
  const leverage = lowEffortPlay ?? mediumEffortPlay;

  if (leverage) {
    frame.leveragePlay = `${leverage.title} (${leverage.effort} effort, high impact)`;
    
    // If leverage play has a system and we don't have a primary system yet, use it
    if (!frame.primarySystem && leverage.system) {
      frame.primarySystem = leverage.system;
      frame.mainConstraint ??= `Roadmap identifies ${leverage.system} as a high-leverage opportunity.`;
    }
  }

  // 4) Generate micro-steps based on primary system
  if (frame.primarySystem) {
    frame.microSteps = generateMicroSteps(frame.primarySystem, signals);
  } else {
    // No clear anchor - provide generic diagnostic steps
    frame.microSteps = [
      'Map your current biggest pain: is it leads, delivery, follow-up, or internal chaos?',
      'Identify the system where that pain lives (e.g., sales pipeline, client onboarding, fulfillment).',
      'Design one small, testable change to reduce friction in that system this week.',
    ];
  }

  return frame;
}

/**
 * Generate micro-steps tailored to a specific system.
 * These are outcome-oriented and testable.
 */
function generateMicroSteps(system: string, signals: RoadmapSignals): string[] {
  // Type guard: ensure system is a string
  if (!system || typeof system !== 'string') {
    return [
      'Map your current biggest pain: is it leads, delivery, follow-up, or internal chaos?',
      'Identify the system where that pain lives (e.g., sales pipeline, client onboarding, fulfillment).',
      'Design one small, testable change to reduce friction in that system this week.',
    ];
  }
  
  const systemLower = system.toLowerCase();

  // Check if there are workflow gaps for this system
  const hasGaps = signals.workflowGaps.some(gap => gap.toLowerCase().includes(systemLower));

  // Check if there's a quick win for this system
  const hasQuickWin = signals.quickWins.some(qw => qw.toLowerCase().includes(systemLower));

  const steps: string[] = [];

  if (hasGaps) {
    steps.push(
      `Map the current workflow for ${system} end-to-end.`,
      `Identify where leads/tasks drop off or get stuck in ${system}.`,
      `Define one simple process change to close the biggest gap this week.`
    );
  } else if (hasQuickWin) {
    steps.push(
      `Review the quick win recommended in the ${system} section.`,
      `Identify the simplest version of that win you can ship this week.`,
      `Test it with one customer/lead/workflow and measure the result.`
    );
  } else {
    // Generic steps for this system
    steps.push(
      `Map the current state of ${system}: what's working, what's broken?`,
      `Identify the top 1-2 friction points or bottlenecks.`,
      `Design a simple, testable change to remove one friction point this week.`
    );
  }

  return steps;
}

/**
 * Format tactical frame for display in prompt (compact representation)
 */
export function formatTacticalFrameForPrompt(frame: TacticalFrame): string {
  const lines: string[] = [];

  if (frame.mainConstraint) {
    lines.push(`Main Constraint: ${frame.mainConstraint}`);
  }

  if (frame.primarySystem) {
    lines.push(`Primary System: ${frame.primarySystem}`);
  }

  if (frame.leveragePlay) {
    lines.push(`Leverage Play: ${frame.leveragePlay}`);
  }

  if (frame.microSteps && frame.microSteps.length > 0) {
    lines.push('Suggested Micro-Steps:');
    frame.microSteps.forEach(step => lines.push(`  - ${step}`));
  }

  return lines.length > 0 ? lines.join('\n') : '(No tactical frame computed for this query.)';
}
