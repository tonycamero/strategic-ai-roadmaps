
import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import { db } from '../db';
// @ts-ignore
import { sql } from 'drizzle-orm';

let cachedSchemaState: { ok: boolean; missing: string[]; lastChecked: number } | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds

export const validateTicketSchema = async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const requestId = `req_${now}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[SchemaGuard] Starting validation for ${req.method} ${req.path} (${requestId})`);

    // Use cached result if valid
    if (cachedSchemaState && (now - cachedSchemaState.lastChecked < CACHE_TTL_MS)) {
        if (!cachedSchemaState.ok) {
            return res.status(409).json({
                errorCode: 'DB_SCHEMA_MISSING_COLUMNS',
                message: 'DB schema missing required columns for Ticket Moderation',
                requestId,
                missingColumns: cachedSchemaState.missing
            });
        }
        // inject requestId for correlation
        (req as any).requestId = requestId;
        return next();
    }

    try {
        const requiredColumns = [
            'category', 'tier', 'sprint', 'implementation_steps',
            'roi_notes', 'time_estimate_hours'
        ];

        const checkQuery = sql`
        SELECT column_name, table_schema
        FROM information_schema.columns 
        WHERE table_name = 'sop_tickets'
    `;
        const result = await db.execute(checkQuery);
        console.log('[SchemaGuard] Found columns in schemas:',
            [...new Set(result.map((r: any) => r.table_schema))].join(', ')
        );
        const existing = new Set(result.map((r: any) => r.column_name));

        const missing = requiredColumns.filter(c => !existing.has(c));

        cachedSchemaState = {
            ok: missing.length === 0,
            missing,
            lastChecked: now
        };

        if (missing.length > 0) {
            console.error(`[SchemaGuard] MISSING COLUMNS: ${missing.join(', ')}`);
            return res.status(409).json({
                errorCode: 'DB_SCHEMA_MISSING_COLUMNS',
                message: 'DB schema missing required columns for Ticket Moderation',
                requestId,
                missingColumns: missing
            });
        }

        console.log(`[SchemaGuard] Validation complete for ${requestId}`);
        next();

    } catch (error) {
        console.error(`[SchemaGuard] Validation failed for ${requestId}:`, error);
        next(error); // Fail open if DB is down (let regular error handler catch)
    }
};
