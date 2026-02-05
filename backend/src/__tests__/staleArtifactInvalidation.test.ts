/**
 * EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022
 * Stale Artifact Invalidation - Integration Test
 * 
 * This test verifies the stale artifact detection logic in isolation.
 * It tests the core comparison logic without requiring full service mocking.
 */

import { describe, it, expect } from 'vitest';

describe('Stale Artifact Detection Logic', () => {
    it('should detect stale artifact when artifact.createdAt < brief.updatedAt', () => {
        // Simulate brief regenerated on Feb 3
        const brief = {
            updatedAt: new Date('2026-02-03T22:00:00Z'),
            generatedAt: new Date('2026-01-30T00:50:00Z')
        };

        // Simulate old artifact created on Jan 30
        const existingArtifact = {
            createdAt: new Date('2026-01-30T00:50:00Z')
        };

        // Apply stale detection logic (from executiveBriefDelivery.ts)
        const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
        const artifactStamp = existingArtifact?.createdAt || new Date(0);
        const isStale = existingArtifact && artifactStamp < briefStamp;

        // Assert: Artifact should be stale
        expect(isStale).toBe(true);
        expect(artifactStamp.getTime()).toBeLessThan(briefStamp.getTime());
    });

    it('should NOT detect stale artifact when artifact.createdAt >= brief.updatedAt', () => {
        // Simulate brief last updated on Jan 30
        const brief = {
            updatedAt: new Date('2026-01-30T00:50:00Z'),
            generatedAt: new Date('2026-01-30T00:50:00Z')
        };

        // Simulate fresh artifact created on Feb 3
        const existingArtifact = {
            createdAt: new Date('2026-02-03T22:00:00Z')
        };

        // Apply stale detection logic (from executiveBriefDelivery.ts)
        const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
        const artifactStamp = existingArtifact?.createdAt || new Date(0);
        const isStale = existingArtifact && artifactStamp < briefStamp;

        // Assert: Artifact should NOT be stale
        expect(isStale).toBe(false);
        expect(artifactStamp.getTime()).toBeGreaterThanOrEqual(briefStamp.getTime());
    });

    it('should handle missing updatedAt by falling back to generatedAt', () => {
        // Simulate brief with no updatedAt (legacy)
        const brief = {
            updatedAt: null,
            generatedAt: new Date('2026-02-03T22:00:00Z')
        };

        // Simulate old artifact
        const existingArtifact = {
            createdAt: new Date('2026-01-30T00:50:00Z')
        };

        // Apply stale detection logic
        const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
        const artifactStamp = existingArtifact?.createdAt || new Date(0);
        const isStale = existingArtifact && artifactStamp < briefStamp;

        // Assert: Should use generatedAt and detect stale
        expect(briefStamp).toEqual(brief.generatedAt);
        expect(isStale).toBe(true);
    });

    it('should handle missing artifact gracefully', () => {
        const brief = {
            updatedAt: new Date('2026-02-03T22:00:00Z'),
            generatedAt: new Date('2026-01-30T00:50:00Z')
        };

        const existingArtifact = null;

        // Apply stale detection logic
        const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
        const artifactStamp = existingArtifact?.createdAt || new Date(0);
        const isStale = existingArtifact && artifactStamp < briefStamp;

        // Assert: No artifact means not stale (will trigger regeneration via different path)
        expect(isStale).toBeFalsy(); // null is falsy, which is correct
    });

    it('should handle edge case: artifact and brief created at exact same time', () => {
        const timestamp = new Date('2026-02-03T22:00:00Z');

        const brief = {
            updatedAt: timestamp,
            generatedAt: timestamp
        };

        const existingArtifact = {
            createdAt: timestamp
        };

        // Apply stale detection logic
        const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
        const artifactStamp = existingArtifact?.createdAt || new Date(0);
        const isStale = existingArtifact && artifactStamp < briefStamp;

        // Assert: Same timestamp means NOT stale (artifact is current)
        expect(isStale).toBe(false);
    });
});
