import { NormalizedIntakeContext } from './intake';

export interface RoadmapContext {
  tenantId: string;
  tenantName: string;

  normalizedIntakes: NormalizedIntakeContext;

  sop01: {
    sop01DiagnosticMarkdown: string;
    sop01AiLeverageMarkdown: string;
    sop01DiscoveryQuestionsMarkdown: string;
    sop01RoadmapSkeletonMarkdown: string;
  };

  discoveryNotes: string;
}

export interface RoadmapSections {
  summary: string;
  '01-executive-summary': string;
  '02-diagnostic-analysis': string;
  '03-system-architecture': string;
  '04-high-leverage-systems': string;
  '05-implementation-plan': string;
  '06-sop-pack': string;
  '07-metrics-dashboard': string;
  '08-appendix': string;
}
