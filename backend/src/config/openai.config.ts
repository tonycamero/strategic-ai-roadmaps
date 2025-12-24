/**
 * OpenAI Configuration
 * 
 * Centralized config for OpenAI Assistants including homepage TrustAgent.
 * Homepage assistant is separate from tenant-scoped agents.
 */

export const homepageAssistantConfig = {
  assistantId: process.env.OPENAI_TRUSTAGENT_ASSISTANT_ID ?? '',
  vectorStoreId: process.env.OPENAI_TRUSTAGENT_VECTOR_STORE_ID ?? '',
  model: process.env.OPENAI_TRUSTAGENT_MODEL ?? 'gpt-4o',
};

/**
 * Validate homepage assistant configuration on startup
 * Logs warnings but does not crash in dev mode
 */
export function validateHomepageAssistantConfig(): void {
  const missing: string[] = [];
  
  if (!homepageAssistantConfig.assistantId) {
    missing.push('OPENAI_TRUSTAGENT_ASSISTANT_ID');
  }
  if (!homepageAssistantConfig.vectorStoreId) {
    missing.push('OPENAI_TRUSTAGENT_VECTOR_STORE_ID');
  }
  
  if (missing.length > 0) {
    console.warn(
      `[OpenAI Config] TrustAgent not configured. Missing env vars: ${missing.join(', ')}`
    );
    console.warn(
      '[OpenAI Config] Run `pnpm provision:homepage-trustagent` to create assistant and get IDs.'
    );
  } else {
    console.log('[OpenAI Config] ✅ TrustAgent configured:', {
      assistantId: homepageAssistantConfig.assistantId,
      vectorStoreId: homepageAssistantConfig.vectorStoreId,
      model: homepageAssistantConfig.model,
    });
    console.log('[OpenAI Config] 🔍 VERIFY THIS ID MATCHES YOUR EXPECTED TRUSTAGENT ASSISTANT');
  }
}
