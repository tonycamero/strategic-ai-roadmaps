/**
 * StrategyContext Builder Service
 * 
 * Builds StrategyContext from roadmap + diagnostics at runtime.
 * Wires together existing metadataParser + tacticResolver services.
 */

import type { StrategyContext, PersonaRole, RoadmapSignals, TacticalFrame } from '../types/strategyContext';
import { db } from '../db/index';
import { roadmapSections, intakes, roadmaps } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { deriveRoadmapSignals, formatSignalsForPrompt, type RoadmapSection, type DiagnosticData } from './roadmapAnalysis/metadataParser';
import { resolveTacticalFrame } from './roadmapAnalysis/tacticResolver';

export interface BuildStrategyContextParams {
  tenantId: string;
  personaRole: PersonaRole;
  currentView?: string | null; // roadmap section key user is viewing
  objectivesOverride?: string[]; // for testing/sandbox
}

/**
 * Build a StrategyContext object from roadmap + diagnostics.
 * This runs per-query (or can be cached per-tenant if needed).
 */
export async function buildStrategyContext(
  params: BuildStrategyContextParams,
): Promise<StrategyContext> {
  const { tenantId, personaRole, currentView, objectivesOverride } = params;

  // Load active roadmap for tenant
  const roadmap = await getActiveRoadmapForTenant(tenantId);
  
  // Load diagnostics for tenant
  const diagnostics = await getDiagnosticsForTenant(tenantId);

  // Load roadmap sections (join through roadmap to get tenant's sections)
  let sections: any[] = [];
  if (roadmap) {
    sections = await db.query.roadmapSections.findMany({
      where: eq(roadmapSections.roadmapId, roadmap.id),
    });
  }

  // Convert to RoadmapSection format for parser
  const roadmapSectionsData: RoadmapSection[] = sections.map(s => ({
    id: s.id,
    sectionKey: `section_${s.sectionNumber}`,
    sectionName: s.sectionName,
    status: s.status as 'implemented' | 'in_progress' | 'planned',
    contentMarkdown: s.contentMarkdown || '',
  }));

  // Extract roadmap signals using existing parser
  const signalsRaw = deriveRoadmapSignals({
    roadmapSections: roadmapSectionsData,
    diagnostics,
  });

  // Convert to StrategyContext format (rename fields for clarity)
  const roadmapSignals: RoadmapSignals = {
    pains: signalsRaw.topPainPoints,
    leveragePoints: signalsRaw.leveragePlays.map(lp => `${lp.title} (${lp.effort} effort)`),
    workflowGaps: signalsRaw.workflowGaps,
    quickWins: signalsRaw.quickWins,
  };

  // Resolve tactical frame using existing resolver
  const tacticalFrameRaw = resolveTacticalFrame({
    signals: signalsRaw,
    diagnostics,
    currentView,
  });

  // Convert to StrategyContext format
  const tacticalFrame: TacticalFrame = {
    primaryConstraint: tacticalFrameRaw.mainConstraint ?? null,
    leveragePlay: tacticalFrameRaw.leveragePlay ?? null,
    recommendedMicroSteps: tacticalFrameRaw.microSteps ?? [],
    systemInFocus: tacticalFrameRaw.primarySystem ?? null,
  };

  // Infer objectives from roadmap + diagnostics
  const objectives = objectivesOverride ?? inferObjectivesFromRoadmap(roadmapSectionsData, diagnostics);

  const strategyContext: StrategyContext = {
    tenantId,
    personaRole,
    roadmapSignals,
    tacticalFrame,
    objectives,
  };

  return strategyContext;
}

/**
 * Get active roadmap for tenant (adapter)
 */
async function getActiveRoadmapForTenant(tenantId: string): Promise<any> {
  const roadmap = await db.query.roadmaps.findFirst({
    where: and(
      eq(roadmaps.tenantId, tenantId),
      eq(roadmaps.status, 'delivered')
    ),
  });
  return roadmap ?? null;
}

/**
 * Get diagnostics for tenant (adapter)
 */
async function getDiagnosticsForTenant(tenantId: string): Promise<DiagnosticData | undefined> {
  const latestIntake = await db.query.intakes.findFirst({
    where: eq(intakes.tenantId, tenantId),
    orderBy: (intakes, { desc }) => [desc(intakes.createdAt)],
  });

  if (!latestIntake?.answers) {
    return undefined;
  }

  // Extract diagnostics from intake answers
  return extractDiagnosticsFromIntake(latestIntake.answers as any);
}

/**
 * Extract diagnostic data from intake answers (simple heuristic parser)
 */
function extractDiagnosticsFromIntake(answers: any): DiagnosticData | undefined {
  if (!answers || typeof answers !== 'object') {
    return undefined;
  }

  const diagnostics: DiagnosticData = {
    pains: {},
    maturity: {},
    notes: [],
  };

  // Parse pain scores
  for (const [key, value] of Object.entries(answers)) {
    if (key.toLowerCase().includes('pain') && typeof value === 'number') {
      const domain = key.replace(/pain/gi, '').replace(/([A-Z])/g, ' $1').trim();
      diagnostics.pains![domain] = value;
    }
    
    if (key.toLowerCase().includes('maturity') && typeof value === 'number') {
      const domain = key.replace(/maturity/gi, '').replace(/([A-Z])/g, ' $1').trim();
      diagnostics.maturity![domain] = value;
    }
    
    if (typeof value === 'string' && value.length > 20) {
      diagnostics.notes!.push(value);
    }
  }

  return Object.keys(diagnostics.pains!).length > 0 || Object.keys(diagnostics.maturity!).length > 0
    ? diagnostics
    : undefined;
}

/**
 * Infer high-level objectives from roadmap sections + diagnostics
 */
function inferObjectivesFromRoadmap(
  sections: RoadmapSection[],
  diagnostics?: DiagnosticData,
): string[] {
  const objectives: string[] = [];

  // Top roadmap sections (first 5)
  const topSections = sections
    .filter(s => s.status === 'planned' || s.status === 'in_progress')
    .slice(0, 5)
    .map(s => s.sectionName);

  objectives.push(...topSections);

  // Top pain areas from diagnostics
  if (diagnostics?.pains) {
    const topPains = Object.entries(diagnostics.pains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => `Address ${domain} pain`);

    objectives.push(...topPains);
  }

  return objectives;
}
