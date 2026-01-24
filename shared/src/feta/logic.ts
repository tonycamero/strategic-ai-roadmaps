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

"use strict";
import { FETA_CANONICAL_TAXONOMY } from './canonical';

export function selectSynthesis(answers: any) {
    const { Q1, Q2, Q3 } = answers;
    if (Q3 === 'A3_NONE') {
        return 'SB-02';
    }
    if (Q1 === 'A1_LOAD' || Q2 === 'A2_MAN' || Q2 === 'A2_FOUN') {
        return 'SB-03';
    }
    return 'SB-01';
}
export function getNextStep(currentStep: string) {
    if (currentStep === 'H0')
        return 'Q1';
    if (currentStep === 'Q1')
        return 'Q2';
    if (currentStep === 'Q2')
        return 'Q3';
    if (currentStep === 'Q3')
        return 'R1_REVEAL';
    return 'DONE';
}
export function isValidAnswer(step: string, answerId: string) {
    const question = FETA_CANONICAL_TAXONOMY[step];
    if (!question)
        return false;
    return question.options.some((opt: any) => opt.id === answerId);
}
