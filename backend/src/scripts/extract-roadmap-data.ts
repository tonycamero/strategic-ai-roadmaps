import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function extractRoadmapData() {
    const sql = postgres(process.env.DATABASE_URL!);

    const DEMO_TENANTS = [
        { id: '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64', name: 'Hayes Real Estate Group' },
        { id: 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06', name: 'BrightFocus Marketing' }
    ];

    for (const tenant of DEMO_TENANTS) {
        console.log(`\n=== ${tenant.name} ===\n`);

        // Get roadmap
        const roadmaps = await sql`
      SELECT id, status, created_at
      FROM roadmaps
      WHERE tenant_id = ${tenant.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

        if (roadmaps.length === 0) {
            console.log('No roadmap found');
            continue;
        }

        const roadmap = roadmaps[0];
        console.log(`Roadmap ID: ${roadmap.id}`);
        console.log(`Status: ${roadmap.status}`);
        console.log(`Created: ${roadmap.created_at}\n`);

        // Get roadmap sections
        const sections = await sql`
      SELECT section_number, section_name, content_markdown, agent_cheatsheet
      FROM roadmap_sections
      WHERE roadmap_id = ${roadmap.id}
      ORDER BY section_number
    `;

        console.log(`Found ${sections.length} sections:\n`);

        const output: any = {
            tenantId: tenant.id,
            tenantName: tenant.name,
            roadmapId: roadmap.id,
            sections: []
        };

        for (const section of sections) {
            console.log(`Section ${section.section_number}: ${section.section_name}`);
            console.log(`  Content length: ${section.content_markdown?.length || 0} chars`);
            console.log(`  Cheatsheet: ${section.agent_cheatsheet ? 'Yes' : 'No'}\n`);

            output.sections.push({
                number: section.section_number,
                name: section.section_name,
                contentPreview: section.content_markdown?.substring(0, 200) || '',
                cheatsheet: section.agent_cheatsheet
            });
        }

        // Write to file
        const filename = `/tmp/${tenant.name.toLowerCase().replace(/\s+/g, '_')}_roadmap_extract.json`;
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        console.log(`\n✅ Wrote extract to ${filename}\n`);
    }

    await sql.end();
}

extractRoadmapData().catch(console.error);
