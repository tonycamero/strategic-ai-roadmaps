/**
 * Rate Limiting for PulseAgent Homepage Endpoint
 * 
 * Prevents abuse of the public chat endpoint with IP-based and session-based limits.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * IP-based rate limiter: 60 requests per hour per IP
 */
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown'), // IPv6-safe IP extraction
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: "You've reached the current interaction limit. If you'd like a deeper dive, please schedule a call.",
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => {
    // Skip rate limiting in development if DISABLE_RATE_LIMIT is set
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

/**
 * Session-based rate limiter: 100 requests per day per session
 */
export const sessionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 requests per day
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use sessionId from body if available, otherwise fall back to IPv6-safe IP
    return req.body?.sessionId || ipKeyGenerator(req.ip || 'unknown');
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Daily limit exceeded',
      message: "You've reached your daily message limit. Please try again tomorrow or schedule a call for immediate assistance.",
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => {
    // Skip rate limiting in development if DISABLE_RATE_LIMIT is set
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});
