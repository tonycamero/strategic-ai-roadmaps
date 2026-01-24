import OpenAI from 'openai';

/**
 * Centralized OpenAI Client Factory
 * 
 * This module provides a consistent way to create OpenAI clients across the application.
 * It validates the OPENAI_API_KEY environment variable is present before instantiation.
 */

/**
 * Creates and returns an OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not configured
 */
export function createOpenAIClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not configured');
    }

    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

/**
 * Singleton instance (lazy-initialized)
 * Use this for most cases where you need a single shared client
 */
let _cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
    if (!_cachedClient) {
        _cachedClient = createOpenAIClient();
    }
    return _cachedClient;
}

/**
 * Default export for convenience
 */
export default {
    createOpenAIClient,
    getOpenAIClient
};
