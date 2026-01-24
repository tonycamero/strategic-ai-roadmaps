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
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectSynthesis = selectSynthesis;
exports.getNextStep = getNextStep;
exports.isValidAnswer = isValidAnswer;
const canonical_1 = require("./canonical");
function selectSynthesis(answers) {
    const { Q1, Q2, Q3 } = answers;
    if (Q3 === 'A3_NONE') {
        return 'SB-02';
    }
    if (Q1 === 'A1_LOAD' || Q2 === 'A2_MAN' || Q2 === 'A2_FOUN') {
        return 'SB-03';
    }
    return 'SB-01';
}
function getNextStep(currentStep) {
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
function isValidAnswer(step, answerId) {
    const question = canonical_1.FETA_CANONICAL_TAXONOMY[step];
    if (!question)
        return false;
    return question.options.some((opt) => opt.id === answerId);
}
