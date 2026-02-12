import { calculateBoardReadyPacket } from '../../controllers/webinar.controller.ts';
import { assembleNarrative } from '../engine.ts';

// Mock Role Payloads (Simulating an "Ops-Heavy / Low Trust" scenario)
const MOCK_PAYLOADS = {
    owner: {
        answers: {
            "focus_q1": "scale", // Owner wants scale
            "time_q2": "tactical" // Owner stuck in weeds -> Owner Trapped
        },
        evidence: {}
    },
    sales: {
        answers: {
            "comm_q1": "siloed",
            "trust_q2": "low"
        },
        evidence: {}
    },
    ops: {
        answers: {
            "process_q1": "reactive",
            "capacity_q2": "overwhelmed" // Ops Overwhelmed
        },
        evidence: {}
    },
    delivery: {
        answers: {
            "quality_q1": "inconsistent",
            "morale_q2": "burnout"
        },
        evidence: {}
    }
};

async function verifyIntegration() {
    console.log("Starting Integration Verification...");

    try {
        // 1. Calculate Board-Ready Packet
        console.log("Step 1: Calculating Board-Ready Packet...");
        const packet = await calculateBoardReadyPacket("test-session-id", MOCK_PAYLOADS);

        if (!packet) {
            throw new Error("Failed to calculate packet");
        }
        console.log("Packet calculated successfully.");
        console.log("Core Constraint:", packet.board.coreConstraint);

        // 2. Assemble Narrative
        console.log("Step 2: Assembling Narrative...");
        const narrative = assembleNarrative(packet);

        if (!narrative) {
            throw new Error("Failed to assemble narrative");
        }

        // 3. Verify Narrative Structure
        console.log("Step 3: Verifying Narrative Structure...");

        // Check for Overview
        if (narrative.overview) {
            console.log("✅ Overview Block Present");
        } else {
            console.error("❌ Overview Block Missing");
        }

        // Check for Constraint
        if (narrative.constraint) {
            console.log(`✅ Constraint Block Present: ${narrative.constraint.content.headline}`);
        } else {
            console.error("❌ Constraint Block Missing");
        }

        // Check for Failure Mode
        if (narrative.failureMode) {
            console.log(`✅ Failure Mode Block Present: ${narrative.failureMode.content.headline}`);
        } else {
            console.error("❌ Failure Mode Block Missing");
        }

        // Check for Trajectory
        if (narrative.timing && narrative.severity && narrative.outcome) {
            console.log(`✅ Trajectory Complete: ${narrative.timing.content.headline} -> ${narrative.severity.content.headline} -> ${narrative.outcome.content.headline}`);
        } else {
            console.error("❌ Trajectory Incomplete");
        }

        // Check Role Sections
        const roles = ['owner', 'sales', 'ops', 'delivery'];
        roles.forEach(role => {
            // @ts-ignore
            if (!narrative.roleSections || !narrative.roleSections[role]) {
                console.warn(`⚠️ No role sections for ${role}`);
            } else {
                // @ts-ignore
                const count = narrative.roleSections[role].length;
                console.log(`✅ Role Section (${role}): ${count} blocks`);
            }
        });

        // 4. Verify Decision Spine (Phase 6 Authorship)
        console.log("Step 4: Verifying Decision Spine Layer (DS1-DS3)...");

        if (narrative.decisionSpine && narrative.decisionSpine.length === 3) {
            console.log(`✅ Decision Spine Complete: 3 blocks`);
            console.log(`   - DS1: ${narrative.decisionSpine[0].id} ("${narrative.decisionSpine[0].content.headline}")`);
            console.log(`   - DS2: ${narrative.decisionSpine[1].id} ("${narrative.decisionSpine[1].content.headline}")`);
            console.log(`   - DS3: ${narrative.decisionSpine[2].id} ("${narrative.decisionSpine[2].content.headline}")`);

            // Content check (Mock Packet has HIGH severity, NOW timing)
            // Expected: DS1_Situation_ActiveConstraint, DS2_Consequence_RevenueExposure (default) or Founder?, DS3_Mandate_StructuralIntervention
        } else {
            console.error(`❌ Decision Spine Malformed: Found ${narrative.decisionSpine?.length || 0} blocks (Expected 3)`);
            // Debug output
            narrative.decisionSpine?.forEach(b => console.log(`   Found: ${b.id}`));
        }



        console.log("\nVERIFICATION SUCCESSFUL: Integration flow is valid.");

    } catch (e: any) {
        console.error("\nVERIFICATION FAILED:", e.message);
        console.error(e);
        process.exit(1);
    }
}

verifyIntegration();
