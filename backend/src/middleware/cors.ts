import cors from "cors";
import { Request } from "express";

const allowedOrigins = [
  "https://portal.strategicai.app",
  "https://staging-sar-portal.strategicai.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl, health checks, netlify warmup)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // reflect exact origin
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
});
