
import { Router } from 'express';
// @ts-ignore
import { db } from '../db/index';
// @ts-ignore
import { sql } from 'drizzle-orm';
import { config } from '../config/env';

const router = Router();

router.get('/db', async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        const dbUrl = config.dbUrl || '';
        const dbHostMasked = dbUrl.split('@')[1]?.split('/')[0]?.slice(-15) || 'unknown';
        const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';

        // Fingerprint query
        const fingerprintResult = await db.execute(sql`
            SELECT 
                current_database() as db,
                current_user as user,
                version() as version,
                inet_server_addr()::text as ip
        `);
        const fp = fingerprintResult[0];

        // Schema Check for sop_tickets
        const requiredColumns = [
            'category', 'tier', 'sprint', 'implementation_steps',
            'roi_notes', 'time_estimate_hours'
        ];

        const columnCheckQuery = sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sop_tickets'
        `;
        const columnsResult = await db.execute(columnCheckQuery);
        const existingColumns = new Set(columnsResult.map((r: any) => r.column_name));

        const missingColumns = requiredColumns.filter(c => !existingColumns.has(c));
        const hasAllColumns = missingColumns.length === 0;

        const response = {
            ok: hasAllColumns,
            envLoadedFrom: 'canonical-env-ts', // We know this because we imported strict env
            dbHostMasked,
            dbName,
            dbUser: fp.user,
            serverVersion: fp.version,
            schemaChecks: {
                sop_tickets: {
                    ok: hasAllColumns,
                    missing: missingColumns,
                    checked: requiredColumns
                }
            },
            requestId,
            errorCode: hasAllColumns ? undefined : 'DB_SCHEMA_MISSING_COLUMNS'
        };

        if (!hasAllColumns) {
            return res.status(409).json(response);
        }

        return res.json(response);

    } catch (error) {
        console.error('Health DB Check Failed:', error);
        return res.status(500).json({
            ok: false,
            requestId,
            errorCode: 'DB_CONNECTION_ERROR',
            error: String(error)
        });
    }
});

export default router;
