export interface CanonicalDiscoveryNotes {
    sessionMetadata: {
        date: string;
        attendees: string;
        firmName: string;
        duration: string;
    };
    currentBusinessReality: string; // Factual description
    primaryFrictionPoints: string; // Specific problems
    desiredFutureState: string; // Explicit goals
    technicalOperationalEnvironment: string; // Constraints & Assets
    explicitClientConstraints: string; // Hard boundaries
}

export interface CanonicalFinding {
    id: string; // FND-<SessionDate>-<SectionHash>-<Index>
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
    description: string; // Verbatim substring
    sourceSection: keyof CanonicalDiscoveryNotes;
    sourceTextHash: string;
    // Optional typed fields per schema
    metricValue?: number;
    metricUnit?: string;
    statedCost?: string;
    targetMetric?: string;
    targetDate?: string;
    constraintCategory?: 'Budget' | 'Timeline' | 'Technical' | 'Regulatory';
}

export interface CanonicalFindingsObject {
    tenantId: string;
    generatedAt: string;
    discoveryRef: string; // Reference to Discovery Artifact ID
    findings: CanonicalFinding[];
}

export type TicketClass = 'Diagnostic' | 'Optimization' | 'ConstraintCheck' | 'CapabilityBuild';

export interface CanonicalTicket {
    id: string; // TCK-<FindingHashPrefix>-<Type>-<Index>
    tenantId: string;
    title: string;
    description: string;
    class: TicketClass;
    findingIds: string[]; // Must be non-empty

    // Specific fields based on type (merged for flat structure or strictly typed)
    // Per schema invariants:
    investigationScope?: string; // Diagnostic
    requiredAccess?: string; // Diagnostic
    targetOutcome?: string; // Optimization
    currentMetric?: string; // Optimization
    validationCriteria?: string; // ConstraintCheck
    regulatoryReference?: string; // ConstraintCheck
    capabilityDefinition?: string; // CapabilityBuild
    successMetric?: string; // CapabilityBuild

    // Status
    status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
}

export type RoadmapSectionType =
    | 'Diagnostic & Audit Plane'
    | 'Operational Frictions'
    | 'Capability Construction'
    | 'Unassigned / Backlog';

export interface CanonicalRoadmap {
    id: string; // RMP-<CompilerVersion>-<TimestampHash>
    tenantId: string;
    sourceTicketIds: string[];
    compilerTimestamp: string;
    schemaVersion: string;

    sections: {
        title: RoadmapSectionType;
        tickets: CanonicalTicket[]; // Ordered deterministically
    }[];
}
