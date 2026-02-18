import { Request, Response, NextFunction } from "express";

/**
 * Allowed UI origins
 * Add new deploy URLs here ONLY — never use '*'
 */
const ALLOWED_ORIGINS = [
  "https://portal.strategicai.app",
  "https://staging-sar-portal.strategicai.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  // Handle browser preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}
