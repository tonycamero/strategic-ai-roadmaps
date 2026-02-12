import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index.ts';
import { agentConfigs, tenantDocuments, tenants } from '../db/schema.ts';
import { and, eq } from 'drizzle-orm';
import { readMarkdown, extractAgentCheatsheet } from '../utils/roadmapCheatsheet';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function buildRoadmapSummary(tenantId: string): Promise<string> {
  // Load tenant (for name / segment)
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Fetch roadmap docs
  const docs = await db.query.tenantDocuments.findMany({
    where: and(
      eq(tenantDocuments.tenantId, tenantId),
      eq(tenantDocuments.category, 'roadmap'),
    ),
  });

  if (!docs.length) {
    throw new Error(`No roadmap documents found for tenant ${tenantId}`);
  }

  // Order docs by filename to get consistent section order
  docs.sort((a, b) => a.filename.localeCompare(b.filename));

  const cheatsheets: string[] = [];

  for (const doc of docs) {
    try {
      const markdown = await readMarkdown(doc.filePath);
      const cheat = extractAgentCheatsheet(markdown);

      if (cheat) {
        cheatsheets.push(
          `### Section: ${doc.title || doc.filename}\n\n${cheat.trim()}`,
        );
      } else {
        console.warn(
          `[RoadmapSummary] No Agent Cheatsheet found in ${doc.filename}`,
        );
      }
    } catch (err) {
      console.error(
        `[RoadmapSummary] Failed to read ${doc.filePath}:`,
        (err as Error).message,
      );
    }
  }

  if (!cheatsheets.length) {
    throw new Error(`No Agent Cheatsheet blocks found for tenant ${tenantId}`);
  }

  const header = [
    `## Roadmap Summary – ${tenant.name}`,
    '',
    `This summary is auto-generated from the Strategic AI Roadmap (.md sections) using the "Agent Cheatsheet" blocks.`,
    '',
  ];

  return [...header, ...cheatsheets].join('\n');
}

async function main() {
  console.log('=== Generating Roadmap Summary for Hayes ===');

  const summary = await buildRoadmapSummary(HAYES_TENANT_ID);

  console.log('\n[Preview] First 600 chars:\n');
  console.log(summary.slice(0, 600));
  console.log('\n---\n');

  // Update ALL agent configs for this tenant (owner, ops, etc.)
  const configs = await db.query.agentConfigs.findMany({
    where: eq(agentConfigs.tenantId, HAYES_TENANT_ID),
  });

  if (!configs.length) {
    throw new Error('No agent_configs found for Hayes tenant');
  }

  for (const config of configs) {
    await db
      .update(agentConfigs)
      .set({
        businessContext: summary,
        updatedAt: new Date(),
      })
      .where(eq(agentConfigs.id, config.id));

    console.log(
      `[RoadmapSummary] Updated agent_config ${config.id} (${config.agentType})`,
    );
  }

  console.log('\n✅ Roadmap summary stored in agent_configs.business_context');
}

main()
  .then(() => {
    console.log('\n✅ Script complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
