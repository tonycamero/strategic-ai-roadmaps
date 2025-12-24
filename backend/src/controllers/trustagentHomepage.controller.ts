/**
 * ⚠️ EXECUTION LOCK — DO NOT MODIFY CASUALLY
 *
 * This file is governed by /working_protocol.md
 *
 * Default mode: NON-DESTRUCTIVE
 * Forbidden unless explicitly authorized:
 * - Refactors
 * - File moves or deletions
 * - API contract changes
 * - Dropping fields (e.g. cta, reveal)
 *
 * If unsure: STOP and ask before editing.
 */

import { Request, Response } from 'express';
// Homepage Service Imports (ONLY for 'homepage' branch)
import {
    getHomepageAssistantDebug,
    type PageContext,
} from '../services/publicAgentSession.service';

// FE-TA Imports (ONLY for 'feta' branch)
// NOTE: These must be pure logic imports (no persistence)
import { getNextStep, selectSynthesis, isValidAnswer, FETA_CANONICAL_TAXONOMY, FETA_CANONICAL_SYNTHESIS } from '@roadmap/shared';

// In-memory store for FE-TA (simulating ephemeral state)
// In production this might be Redis, but per spec "Ephemeral/In-Memory" is the rule.
const FETA_SESSIONS = new Map<string, any>();

interface ChatRequest {
    sessionId?: string;
    message: string;
    mode?: 'homepage' | 'feta';
    pageContext?: PageContext;
    _safetyOverride?: string;
}

export async function chat(req: Request, res: Response): Promise<void> {
    const { sessionId, message } = req.body as ChatRequest;

    // --- FORCE FE-TA MODE (STRICT HARD CUT-OVER) ---
    // We ignore req.body.mode and always assume 'feta'.
    const activeMode = 'feta';

    // 1. Strict Isolation: No persistence calls allowed here
    const cleanSessionId = sessionId || `feta-${Date.now()}-${Math.random()}`;

    // 2. Initialize or retrieve in-memory state
    let state = FETA_SESSIONS.get(cleanSessionId);
    if (!state) {
        state = { step: 'H0', answers: { H0: null, Q1: null, Q2: null, Q3: null } };
        FETA_SESSIONS.set(cleanSessionId, state);
    }

    // 3. Process Input (State Machine)
    let reply = "";
    let options: any[] = [];
    let cta: any = undefined;
    let invalidAttempt = false;

    // Handle "Reset/Init" (empty message)
    if (!message) {
        // Just return current step question
        state.step = 'H0'; // Force reset on empty init
        state.answers = { H0: null, Q1: null, Q2: null, Q3: null };
    } else {
        // Validate answer
        if (state.step !== 'DONE' && state.step !== 'R1_REVEAL') {
            if (isValidAnswer(state.step, message)) {
                // Record answer
                state.answers[state.step] = message;

                // SPECIAL HANDLE: H0_NO -> Exit Flow
                if (state.step === 'H0' && message === 'H0_NO') {
                    state.step = 'EXIT_H0';
                } else {
                    // Advance Normal
                    const next = getNextStep(state.step);
                    if (next === 'DONE' || next === 'R1_REVEAL') {
                        // Start Synthesis Phase
                        state.step = 'R1_REVEAL';
                    } else {
                        state.step = next;
                    }
                }
            } else {
                // Invalid answer -> Mark as invalid attempt to modify response
                invalidAttempt = true;
            }
        }
    }

    // 4. Generate Response based on Step
    try {
        if (state.step === 'H0') {
            reply = invalidAttempt ? "Please select an option. Want to help diagnose where your operations are breaking?" : (FETA_CANONICAL_TAXONOMY?.H0?.question || "Want to take a quick look?");
            options = FETA_CANONICAL_TAXONOMY?.H0?.options ? FETA_CANONICAL_TAXONOMY.H0.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
        } else if (state.step === 'EXIT_H0') {
            reply = "All good. If you want, I can still show you an example of what this kind of diagnostic produces.";
            cta = { type: 'view_sample_roadmap', label: 'View Sample Roadmap' };
            options = [];
            FETA_SESSIONS.delete(cleanSessionId);
        } else if (state.step === 'Q1') {
            reply = invalidAttempt ? "Please select one of the options below. Where does execution most often break?" : "Where does execution most often break?";
            options = FETA_CANONICAL_TAXONOMY?.Q1?.options ? FETA_CANONICAL_TAXONOMY.Q1.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
        } else if (state.step === 'Q2') {
            reply = invalidAttempt ? "Please select one of the options below. When that happens, what usually fills the gap?" : "When that happens, what usually fills the gap?";
            options = FETA_CANONICAL_TAXONOMY?.Q2?.options ? FETA_CANONICAL_TAXONOMY.Q2.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
        } else if (state.step === 'Q3') {
            reply = invalidAttempt ? "Please select one of the options below. When execution fails, who actually owns fixing it?" : "When execution fails, who actually owns fixing it?";
            options = FETA_CANONICAL_TAXONOMY?.Q3?.options ? FETA_CANONICAL_TAXONOMY.Q3.options.map((o: any) => ({ id: o.id, label: o.label })) : [];
        } else if (state.step === 'R1_REVEAL') {
            // 5. Synthesis Reveal (structured)
            const synthesisKey = selectSynthesis(state.answers);
            const synthBlock = FETA_CANONICAL_SYNTHESIS?.[synthesisKey as keyof typeof FETA_CANONICAL_SYNTHESIS];

            reply = "Here’s what I see:";
            options = [];

            // Construct structured reveal payload (merged into response)
            // We'll attach it to the `reveal` field in the JSON response below
            (res as any).locals = { reveal: synthBlock };

            cta = { type: 'generate_mini_roadmap', label: 'Generate my 1-page Fix Plan' };

            FETA_SESSIONS.delete(cleanSessionId); // Clear memory
        }
    } catch (error) {
        console.error("Error generating response options:", error);
        reply = "I encountered an error processing the available options. Please try again.";
        options = [];
    }

    // 5. Ephemeral Return
    res.json({
        sessionId: cleanSessionId,
        message: reply,
        reveal: (res as any).locals?.reveal,
        options,
        cta
    });
}

export async function debug(req: Request, res: Response): Promise<void> {
    const debugInfo = await getHomepageAssistantDebug();
    res.json({ ok: true, debug: debugInfo });
}
