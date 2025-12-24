// src/controllers/roadmapQnA.controller.ts
import { Request, Response } from 'express';
import { buildRoadmapQnAContext } from '../trustagent/services/roadmapQnAContext.service';
import { callRoadmapQnAAgent } from '../trustagent/services/roadmapQnAAgent.service';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getBusinessTypeProfile } from '@roadmap/shared';
import type { BusinessType } from '@roadmap/shared';

export async function askAboutRoadmap(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId || (req as any).currentTenantId;
    const user = (req as any).user; // From auth middleware
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - tenant not found' });
    }

    const { question, sectionKey, currentSection } = req.body as {
      question: string;
      sectionKey?: string;
      currentSection?: {
        slug: string;
        title: string;
        content: string;
      };
    };

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`[RoadmapQnA] Question from tenant ${tenantId}, user ${user?.id}:`, question);

    // 1) Build full roadmap context (includes businessType)
    const context = await buildRoadmapQnAContext(tenantId);

    if (!context) {
      return res.status(404).json({ 
        error: 'Roadmap context not found. Please complete your intake and generate your roadmap first.' 
      });
    }

    // 2) Resolve business-type-specific role labels from context (no additional query)
    const businessType = (context.businessType as BusinessType) || 'default';
    const profile = getBusinessTypeProfile(businessType);

    const roleMap: Record<string, string> = {
      owner: profile.roleLabels.owner,
      ops: profile.roleLabels.ops,
      sales: profile.roleLabels.sales,
      delivery: profile.roleLabels.delivery,
      staff: 'Team Member',
      superadmin: 'Admin',
    };

    // 3) Add currentUserProfile from authenticated user
    if (user) {
      // Fetch full user record to get name
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, user.userId),
      });

      // Extract first name from full name (e.g., "Sarah Johnson" -> "Sarah")
      const fullName = userRecord?.name || 'User';
      const firstName = fullName.split(' ')[0];

      const roleLabel = roleMap[user.role] || 'Team Member';

      context.currentUserProfile = {
        userId: user.userId,
        displayName: firstName,
        roleLabel: roleLabel,
      };

      console.log('[RoadmapQnA] currentUserProfile:', context.currentUserProfile);
    }

    // Add currentSection to context if provided (for situational awareness)
    if (currentSection) {
      context.currentSection = currentSection;
    }

    const answer = await callRoadmapQnAAgent({
      question: question.trim(),
      sectionKey: sectionKey ?? 'executive_summary',
      roadmapQnAContext: context,
    });

    console.log(`[RoadmapQnA] Answer generated (${answer.length} chars)`);

    return res.json({ answer });
  } catch (err: any) {
    console.error('[RoadmapQnA] askAboutRoadmap error:', err);
    return res.status(500).json({ 
      error: 'Failed to answer roadmap question. Please try again.' 
    });
  }
}
