import 'dotenv/config';
import { callRoadmapQnAAgent } from '../trustagent/services/roadmapQnAAgent.service';
import type { RoadmapQnAContext } from '../trustagent/types/roadmapQnA';

const baseContext: RoadmapQnAContext = {
    tenantId: 'mock-tenant-id',
    firmName: 'Acme Corp',
    firmSizeTier: 'small',
    businessType: 'Service',
    diagnosticDate: new Date().toISOString(),
    teamHeadcount: 10,
    baselineMonthlyLeads: 100,
    ticketRollup: {
        totalHours: 100,
        totalCost: 10000,
        totalHoursSavedWeekly: 10,
        totalLeadsRecoveredMonthly: 5,
        annualizedTimeValue: 50000,
        annualizedLeadValue: 50000,
        annualizedROI: 500,
        paybackWeeks: 4
    },
    tickets: [],
    roadmapSections: [],
    ownerProfile: {
        roleLabel: 'Owner',
        departmentKey: 'owner',
        top3Issues: ['Chaos', 'Overwork', 'No leads'],
        top3GoalsNext90Days: ['Stability', 'Hiring', 'Growth'],
        weeklyCapacityHours: 10,
        changeReadiness: 'high'
    },
    currentSection: undefined,
    currentUserProfile: {
        userId: 'mock-user-id',
        displayName: 'Mock User',
        roleLabel: 'Owner'
    }
};

const activeContext: RoadmapQnAContext = {
    ...baseContext,
    tickets: [
        {
            ticketId: 'TC-101',
            title: 'Implement CRM Lead Routing',
            description: 'Automate lead assignment based on territory.',
            sprint: 1,
            inventoryId: 'inv-1',
            isSidecar: false,
            category: 'Growth',
            valueCategory: 'Revenue',
            tier: 'core',
            roadmapSection: 'systems',
            painSource: 'Lead Leakage',
            currentState: 'Manual',
            targetState: 'Automated',
            aiDesign: 'n/a',
            ghlImplementation: 'n/a',
            implementationSteps: '1. Setup workflow',
            owner: 'Roberta',
            dependencies: [],
            timeEstimateHours: 5,
            costEstimate: 500,
            projectedHoursSavedWeekly: 2,
            projectedLeadsRecoveredMonthly: 10,
            successMetric: 'Zero unassigned leads > 5min',
            roiNotes: 'High value',
            priority: 'high'
        }
    ]
};

const diagnosticContext: RoadmapQnAContext = {
    ...baseContext,
    diagnosticMarkdown: `
# Diagnostic Findings
- **Pain Points**: Chaos, low conversion.
- **Root Cause**: No CRM.
    `
};

const testCases = [
    { name: 'Role Awareness', question: "Given my role, what are the top 3 execution risks?", context: activeContext },
    { name: 'Truth Hierarchy', question: "The intake says X, but the diagnostic says Y. Which should we trust?", context: activeContext },
    { name: 'Stage Awareness (Fail-Closed)', question: "What stage are we in?", context: baseContext },
    { name: 'Diagnostic Recall (Pre-Roadmap)', question: "What did the diagnostic say about my pain points?", context: diagnosticContext },
    { name: 'Success Coaching', question: "What would success look like this week?", context: activeContext },
    { name: 'Mutation Refusal', question: "Add a new ticket for Z.", context: activeContext }
];

async function run() {
    console.log('================================================');
    console.log('  PROMPT-04: Regression Validation Script');
    console.log('================================================\n');

    for (const test of testCases) {
        console.log(`--- TEST CASE: ${test.name} ---`);
        console.log(`USER: ${test.question}`);
        // process.stdout.write('AGENT: [Generating...]');

        try {
            const start = Date.now();
            const answer = await callRoadmapQnAAgent({
                question: test.question,
                roadmapQnAContext: test.context
            });
            const duration = Date.now() - start;

            // Clear "Generating..."
            // process.stdout.clearLine(0);
            // process.stdout.cursorTo(0);

            console.log(`AGENT (${duration}ms):`);
            console.log(answer);
            console.log('\n------------------------------------------------\n');
        } catch (e: any) {
            console.error(`\nError: ${e}\n`);
            if (e.response) {
                console.error(e.response.data);
            }
        }
    }
}

run();
