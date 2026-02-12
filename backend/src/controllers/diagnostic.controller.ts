
import { Request, Response } from 'express';
import { db } from '../db/index.ts';
import { diagnosticSnapshots, users, tenants } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { generateToken, hashPassword } from '../utils/auth';

// Legacy imports from original HEAD

import { DiagnosticMap } from '../types/diagnostic';

const SaveSnapshotSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  orgName: z.string().min(1),
  teamSessionId: z.string().min(1),
  payload: z.record(z.any()), // flexible payload
});

export async function saveSnapshot(req: Request, res: Response) {
  try {
    const { email, name, orgName, teamSessionId, payload } = SaveSnapshotSchema.parse(req.body);

    // 1. Find or Create User/Tenant
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    let isNewUser = false;
    let userId: string;

    if (!user) {
      isNewUser = true;
      userId = crypto.randomUUID();
      // Create user with temp password (random)
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(tempPassword);

      // Transactionally create user + tenant
      await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
          id: userId,
          email,
          name,
          passwordHash,
          role: 'owner', // Default role
        }).returning();

        const [newTenant] = await tx.insert(tenants).values({
          ownerUserId: newUser.id,
          name: orgName,
          status: 'prospect',
          cohortLabel: 'Eugene Q1 2026',
          discoveryComplete: false,
        }).returning();

        await tx.update(users).set({ tenantId: newTenant.id }).where(eq(users.id, newUser.id));
      });

      // Re-fetch to confirm or just use ID
      user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    } else {
      userId = user.id;
    }

    // 2. Save Snapshot
    const [snapshot] = await db.insert(diagnosticSnapshots).values({
      userId,
      email,
      orgName,
      teamSessionId,
      payload,
    }).returning();

    // 3. Auto-login (Standard Auth)
    // Auth intentionally uses existing system. Magic deferred to post-MVP pilot.
    // We return a standard JWT token for the widely-used existing auth mechanism.


    let token: string | undefined;
    if (isNewUser && user) {
      token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || null,
        isInternal: false
      });
    }

    return res.json({
      success: true,
      snapshotId: snapshot.id,
      isNewUser,
      token, // Standard JWT for immediate session start
      message: isNewUser ? 'Account created and results saved.' : 'Results saved to existing account.'
    });

  } catch (error) {
    console.error('Save Snapshot Error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLatestSnapshot(req: Request, res: Response) {
  try {
    const teamSessionId = req.query.teamSessionId as string;
    if (!teamSessionId) {
      return res.status(400).json({ error: 'Missing teamSessionId' });
    }

    const snapshot = await db.query.diagnosticSnapshots.findFirst({
      where: eq(diagnosticSnapshots.teamSessionId, teamSessionId),
      orderBy: [desc(diagnosticSnapshots.createdAt)],
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'No snapshot found for this session' });
    }

    return res.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('Get Latest Snapshot Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

