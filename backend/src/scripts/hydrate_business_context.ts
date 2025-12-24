/**
 * Hydrate Business Context from Intake Data
 * 
 * Pulls completed owner intake, extracts business data, generates
 * a structured business context paragraph, and updates agent_configs.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db';
import { agentConfigs, intakes, tenants, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface IntakeAnswers {
  [key: string]: any;
}

async function extractBusinessContext(ownerIntake: any, tenant: any, ownerId: string): Promise<string> {
  const answers = ownerIntake.answers as IntakeAnswers;
  
  // Extract key pain points and context from intake
  const painPoints = answers.pain_points || answers.current_challenges || answers.biggest_bottleneck || 'operational inefficiencies';
  const teamSize = answers.team_size || answers.agent_count || 'unspecified';
  const revenue = answers.annual_revenue || answers.revenue_range || 'unspecified';
  const crm = answers.current_crm || answers.primary_tools || 'unknown CRM';
  const goals = answers.primary_goals || answers.strategic_priorities || 'growth and efficiency';
  
  // Get team intakes
  const teamIntakesRaw = await db.query.intakes.findMany({
    where: eq(intakes.tenantId, tenant.id),
  });
  
  // Manually fetch user info for each intake
  const teamIntakes = await Promise.all(
    teamIntakesRaw.map(async (intake) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, intake.userId),
      });
      return { ...intake, user };
    })
  );
  
  const completedCount = teamIntakes.filter(i => i.completedAt).length;
  const totalCount = teamIntakes.length;
  
  // Extract team member details
  const teamMembers = teamIntakes
    .filter(i => i.role !== 'owner' && i.completedAt)
    .map(i => `${i.user?.name || 'Unknown'} (${i.role})${i.user?.email ? ` - ${i.user.email}` : ''}`)
    .join('\n  ');
  
  // Extract key pain points from team intakes
  const teamPainPoints = teamIntakes
    .filter(i => i.role !== 'owner' && i.completedAt)
    .map(i => {
      const answers = i.answers as IntakeAnswers;
      const role = i.role;
      const pain = answers.biggest_frustration || answers.pain_points || answers.current_challenges;
      return pain ? `- ${role}: ${pain}` : null;
    })
    .filter(Boolean)
    .join('\n');
  
  const ownerName = tenant.ownerName || 'the owner';
  
  return `
${tenant.name} is a ${tenant.segment || 'professional services'} firm led by owner ${ownerName}.

Firm Overview:
- Team Size: ${teamSize}
- Annual Revenue: ${revenue}
- Current CRM/Tools: ${crm}

Owner (${ownerName}) Top Pain Points:
${typeof painPoints === 'string' ? painPoints : JSON.stringify(painPoints, null, 2)}

Owner Strategic Goals:
${typeof goals === 'string' ? goals : JSON.stringify(goals, null, 2)}

Leadership Team (${completedCount}/${totalCount} intakes completed):
${teamMembers ? `  ${teamMembers}` : '  No team members yet'}

${teamPainPoints ? `Team Pain Points (from intakes):\n${teamPainPoints}` : ''}
`.trim();
}

async function main() {
  console.log('=== Hydrating Business Context from Intake Data ===\n');
  
  // Find all tenants with completed owner intakes
  const allTenants = await db.query.tenants.findMany();
  
  for (const tenant of allTenants) {
    const tenantId = tenant.id as string;
    console.log(`\nProcessing: ${tenant.name} (${tenantId})`);
    
    // Find completed owner intake
    const ownerIntake = await db.query.intakes.findFirst({
      where: and(
        eq(intakes.tenantId, tenantId),
        eq(intakes.role, 'owner'),
      ),
    });
    
    if (!ownerIntake || !ownerIntake.completedAt) {
      console.log(`  ⚠️  No completed owner intake - skipping`);
      continue;
    }
    
    // Generate business context - type-cast ownerUserId to string
    const ownerUserId = (tenant.ownerUserId ?? '') as string;
    const businessContext = await extractBusinessContext(ownerIntake, tenant, ownerUserId);
    
    console.log(`  ✓ Generated business context (${businessContext.length} chars)`);
    
    // Update agent_configs
    const configs = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.tenantId, tenantId));
    
    if (configs.length === 0) {
      console.log(`  ⚠️  No agent configs found - skipping update`);
      continue;
    }
    
    for (const config of configs) {
      await db
        .update(agentConfigs)
        .set({ 
          businessContext,
          updatedAt: new Date(),
        })
        .where(eq(agentConfigs.id, config.id));
      
      console.log(`  ✓ Updated agent_config ${config.agentType}`);
    }
  }
  
  console.log('\n=== Done ===');
}

main().catch(console.error);
