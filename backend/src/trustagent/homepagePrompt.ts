/**
 * TrustAgent Master Prompt Composer
 *
 * This file composes all TrustAgent behavioral layers into a single
 * unified system prompt that is sent to OpenAI in the provisioning script.
 *
 * Layer order (from foundational to refinement):
 * 1. Core Constitution (identity, structure, YES ladder, product context, guardrails)
 * 2. System (scope, safety, compliance)
 * 3. Tone (voice and personality)
 * 4. CTA (call-to-action decision logic)
 * 5. Memory (what to remember and forget)
 * 6. Loop (repetition prevention)
 * 7. Failsafe (drift correction)
 * 8. Handoff (human escalation rules)
 * 9. (reserved)
 *
 * This composition ensures OpenAI receives the complete, prioritized
 * instruction set without any "ignored" layers.
 */

import { HOMEPAGE_TRUSTAGENT_CONSTITUTION } from './homepagePromptCore.ts';
import { HOMEPAGE_PROMPT_SYSTEM } from './homepagePromptSystem.ts';
import { HOMEPAGE_PROMPT_TONE } from './homepagePromptTone.ts';
import { HOMEPAGE_PROMPT_CTA } from './homepagePromptCTA.ts';
import { HOMEPAGE_PROMPT_MEMORY } from './homepagePromptMemory.ts';
import { HOMEPAGE_TRUSTAGENT_FAILSAFE } from './homepagePromptFailsafe.ts';
import { HOMEPAGE_TRUSTAGENT_HANDOFF } from './homepagePromptHandoff.ts';
import { HOMEPAGE_TRUSTAGENT_LOOP } from './homepagePromptLoop.ts';
import { HOMEPAGE_TRUSTAGENT_ADAPTIVE_DEPTH } from './homepagePromptAdaptiveDepth.ts';

const SECTION_BREAK = '\n\n---\n\n';

export const HOMEPAGE_TRUSTAGENT_PROMPT = [
  '# ================================================================',
  '# TRUSTAGENT MASTER PROMPT (ALL LAYERS COMPOSED)',
  '# ================================================================',
  '',
  '## LAYER 1: CORE CONSTITUTION',
  HOMEPAGE_TRUSTAGENT_CONSTITUTION,

  SECTION_BREAK + '## LAYER 2: SYSTEM LAYER',
  HOMEPAGE_PROMPT_SYSTEM,

  SECTION_BREAK + '## LAYER 3: TONE LAYER',
  HOMEPAGE_PROMPT_TONE,

  SECTION_BREAK + '## LAYER 4: CTA LOGIC',
  HOMEPAGE_PROMPT_CTA,

  SECTION_BREAK + '## LAYER 5: MEMORY MODEL',
  HOMEPAGE_PROMPT_MEMORY,

  SECTION_BREAK + '## LAYER 6: LOOP CONTROL (LAYER 9A)',
  HOMEPAGE_TRUSTAGENT_LOOP,

  SECTION_BREAK + '## LAYER 7: ADAPTIVE DEPTH LOGIC (LAYER 9B)',
  HOMEPAGE_TRUSTAGENT_ADAPTIVE_DEPTH,

  SECTION_BREAK + '## LAYER 8: FAILSAFE LAYER',
  HOMEPAGE_TRUSTAGENT_FAILSAFE,

  SECTION_BREAK + '## LAYER 9: HUMAN HANDOFF RULES',
  HOMEPAGE_TRUSTAGENT_HANDOFF,

].join('\n').trim();
