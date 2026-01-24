export * from './types';
export * from './authority';
export {
  BUSINESS_TYPE_PROFILES,
  DEFAULT_BUSINESS_TYPE,
  getBusinessTypeProfile,
  type BusinessTypeProfile,
} from './config/businessTypeProfiles';

// FETA (Founder Evidence Taxonomy Assessment)
export { FETA_REGISTRY, isValidRole, type RoleId, type RoleConfig } from './feta/registry';
export { FETA_CANONICAL_TAXONOMY, FETA_CANONICAL_SYNTHESIS } from './feta/canonical';
export { getNextStep, selectSynthesis, isValidAnswer } from './feta/logic';
export * from './feta/team';
// Executive Brief Exports
export {
  normalizeText,
  isMeaningfulValue,
  splitSentences,
  normalizeToMetric,
  projectToSystem,
  validateSection,
  missingSignalsToHuman,
  mapSynthesisToSections,
  projectSections
} from './executiveBrief';

// Roadmap Contract Exports
export { SECTION_CONFIG } from './roadmap.contract';

// Roadmap Logic Exports
export { assembleRoadmap, projectRoadmap } from './roadmap';

// Canonical Schema Exports
export type {
  CanonicalDiscoveryNotes,
  CanonicalFinding,
  CanonicalFindingsObject,
  CanonicalTicket,
  CanonicalRoadmap,
  TicketClass,
  RoadmapSectionType
} from './canon';
