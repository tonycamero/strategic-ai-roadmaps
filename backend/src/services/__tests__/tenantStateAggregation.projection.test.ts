import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getTenantLifecycleView } from '../tenantStateAggregation.service';
import { db } from '../../db/index';

// Mock DB
vi.mock('../../db/index', () => ({
    db: {
        select: vi.fn(),
        from: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
    }
}));

describe('TenantStateAggregation — Invariant Freeze (Day-1)', () => {
    const tenantId = 'test-tenant-id';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper to mock a successful sequence using a call-order-tracking approach
    const mockDbSequence = (opts: {
        intakes: any[],
        discoveryComplete: boolean,
        intakeWindowState: string,
        canonicalFindingsExists: boolean
    }) => {
        let callIndex = 0;
        const mockImpl = () => {
            const query: any = {
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: (onFulfilled: any) => {
                    callIndex++;
                    let res: any;

                    switch (callIndex) {
                        case 1: // 1. Fetch Core Identity (tenants)
                            res = [{ id: tenantId, name: 'Test Firm', status: 'ACTIVE' }];
                            break;
                        case 2: // resolveLifecycle (tenants)
                            res = [{ intakeWindowState: opts.intakeWindowState }];
                            break;
                        case 3: // resolveGovernance (executiveBriefs - 1. Fetch latest)
                            res = [{ id: 'brief-1', status: 'APPROVED' }];
                            break;
                        case 4: // resolveGovernance (auditEvents - 2. Approval Event)
                            res = [{ createdAt: new Date() }];
                            break;
                        case 5: // resolveGovernance (auditEvents - 3. Delivery Event)
                            res = [];
                            break;
                        case 6: // resolveWorkflow (tenants - discoveryComplete)
                            res = [{ id: tenantId, discoveryComplete: opts.discoveryComplete }];
                            break;
                        case 7: // resolveWorkflow (intakes - allIntakes)
                            res = opts.intakes;
                            break;
                        case 8: // resolveWorkflow (tenantDocuments - SOP-01 docs)
                            res = [{ outputNumber: 'Output-1' }, { outputNumber: 'Output-2' }, { outputNumber: 'Output-3' }, { outputNumber: 'Output-4' }];
                            break;
                        case 9: // resolveWorkflow (discoveryCallNotes - discoveryNote)
                            res = opts.discoveryComplete ? [{ id: 'd1' }] : [];
                            break;
                        case 10: // resolveWorkflow (tenantDocuments - roadmap docs)
                            res = [{ section: 'summary' }, { section: '01-executive-summary' }, { section: '02-diagnostic-analysis' }, { section: '03-system-architecture' }, { section: '04-high-leverage-systems' }, { section: '05-implementation-plan' }, { section: '06-sop-pack' }, { section: '07-metrics-dashboard' }, { section: '08-appendix' }];
                            break;
                        case 11: // resolveWorkflow (intakeVectors - count)
                            res = [{ count: 0 }];
                            break;
                        case 12: // resolveWorkflow (intakeClarifications - outstanding)
                            res = [];
                            break;
                        case 13: // resolveWorkflow (discoveryCallNotes - discoveryIngested)
                            res = [{ id: 'd1' }];
                            break;
                        case 14: // resolveArtifacts (executiveBriefs - 1. Brief)
                            res = [{ id: 'brief-1' }];
                            break;
                        case 15: // resolveArtifacts (tenants - 2. Diagnostic pointer)
                            res = [{ lastDiagnosticId: 'diag-1' }];
                            break;
                        case 16: // resolveArtifacts (diagnostics - 2. currentDiag - ONLY CALLED IF POINTER EXISTS)
                            res = [{ id: 'diag-1', status: 'locked' }];
                            break;
                        case 17: // resolveArtifacts (roadmaps - 3. Roadmap)
                            res = [{ id: 'road-1' }];
                            break;
                        case 18: // resolveArtifacts (tenantDocuments - 4. canonical findings)
                            res = opts.canonicalFindingsExists ? [{ id: 'find-1', category: 'findings_canonical' }] : [];
                            break;
                        case 19: // resolveTickets (sopTickets - combined stats)
                            res = [{ total: 1, pending: 0, approved: 1, rejected: 0 }];
                            break;
                        case 20: // resolveOperator (auditEvents - CONFIRMED_DIAGNOSTIC_SUFFICIENCY)
                            res = [{ createdAt: new Date() }];
                            break;
                        default:
                            res = [];
                    }
                    return Promise.resolve(res).then(onFulfilled);
                }
            };
            return query;
        };
        (db.select as any).mockImplementation(mockImpl);
    };

    // Helper to map projection structure to the user's abstract invariant domains safely
    function evaluateDomain(projection: any) {
        return {
            minimumIntakeSatisfied: projection.workflow.completedIntakeCount >= 2,
            fullIntakeSatisfied: projection.workflow.intakesComplete,
            synthesisEligible: projection.capabilities.generateSynthesis.allowed,
            lockEligible: projection.capabilities.lockDiagnostic.allowed,
            hasCanonicalFindings: projection.artifacts.hasCanonicalFindings
        };
    }

    describe('Domain Invariants', () => {

        it('CASE 1 — Owner only → synthesis blocked, lifecycle invalid', async () => {
            mockDbSequence({
                intakes: [{ role: 'owner', status: 'completed', completedAt: new Date() }],
                discoveryComplete: false,
                intakeWindowState: 'OPEN',
                canonicalFindingsExists: false
            });

            const projection = await getTenantLifecycleView(tenantId);
            const domain = evaluateDomain(projection);

            expect(domain.minimumIntakeSatisfied).toBe(false);
            expect(domain.synthesisEligible).toBe(false);
            expect(domain.lockEligible).toBe(false);
        });

        it('CASE 2 — Owner + 1 role → synthesis allowed, lifecycle invalid', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: false
            });

            const projection = await getTenantLifecycleView(tenantId);
            const domain = evaluateDomain(projection);

            expect(domain.minimumIntakeSatisfied).toBe(true);
            expect(domain.fullIntakeSatisfied).toBe(false);
            expect(domain.synthesisEligible).toBe(true);
            expect(domain.lockEligible).toBe(false);
        });

        it('CASE 3 — All 4 roles → synthesis + lifecycle valid', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: false
            });

            const projection = await getTenantLifecycleView(tenantId);
            const domain = evaluateDomain(projection);

            expect(domain.minimumIntakeSatisfied).toBe(true);
            expect(domain.fullIntakeSatisfied).toBe(true);
            expect(domain.synthesisEligible).toBe(true);
            expect(domain.lockEligible).toBe(true);
        });

        it('CASE 4 — Canonical findings present → hard lock', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: true // HARD LOCK!
            });

            const projection = await getTenantLifecycleView(tenantId);
            const domain = evaluateDomain(projection);

            expect(projection.artifacts.hasCanonicalFindings).toBe(true);
            expect(projection.capabilities.generateSynthesis.allowed).toBe(false);
            expect(projection.capabilities.lockDiagnostic.allowed).toBe(false);
            expect(projection.derived.blockingReasons).toContain('TERMINAL_HARD_LOCK');
        });

        it('CASE 5 — Race: canonical findings between reads', async () => {
            // Step A: Initial state (ready for synthesis)
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: false
            });

            const p1 = await getTenantLifecycleView(tenantId);
            expect(p1.capabilities.generateSynthesis.allowed).toBe(true);
            expect(p1.capabilities.lockDiagnostic.allowed).toBe(true);

            // Step B: Simulate findings insertion
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: true // Findings inserted!
            });

            const p2 = await getTenantLifecycleView(tenantId);
            expect(p2.artifacts.hasCanonicalFindings).toBe(true);
            expect(p2.capabilities.generateSynthesis.allowed).toBe(false);
            expect(p2.capabilities.lockDiagnostic.allowed).toBe(false);
            expect(p2.derived.blockingReasons).toContain('TERMINAL_HARD_LOCK');
        });

    });

    describe('Capability Adapter', () => {

        it('Full valid state → generateSynthesis allowed', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: false
            });

            const projection = await getTenantLifecycleView(tenantId);

            expect(projection.capabilities.generateSynthesis.allowed).toBe(true);
        });

        it('Canonical findings present → generateSynthesis denied', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() },
                    { role: 'ops', status: 'completed', completedAt: new Date() },
                    { role: 'sales', status: 'completed', completedAt: new Date() },
                    { role: 'delivery', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: true,
                intakeWindowState: 'CLOSED',
                canonicalFindingsExists: true
            });

            const projection = await getTenantLifecycleView(tenantId);

            expect(projection.capabilities.generateSynthesis.allowed).toBe(false);
        });

        it('Lifecycle invalid → lockDiagnostic denied', async () => {
            mockDbSequence({
                intakes: [
                    { role: 'owner', status: 'completed', completedAt: new Date() }
                ],
                discoveryComplete: false,
                intakeWindowState: 'OPEN',
                canonicalFindingsExists: false
            });

            const projection = await getTenantLifecycleView(tenantId);

            expect(projection.capabilities.lockDiagnostic.allowed).toBe(false);
        });

    });

});
