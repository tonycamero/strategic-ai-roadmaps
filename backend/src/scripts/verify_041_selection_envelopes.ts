import '../config/env';
import postgres from 'postgres';

async function run() {
    const sql = postgres(process.env.DATABASE_URL!);
    const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'selection_envelopes'
    ORDER BY ordinal_position
  `;
    console.log('\n📋 selection_envelopes columns:');
    cols.forEach(c => console.log(`  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} nullable=${c.is_nullable}`));

    const idxs = await sql`
    SELECT indexname FROM pg_indexes WHERE tablename = 'selection_envelopes'
  `;
    console.log('\n🔑 Indexes:');
    idxs.forEach(i => console.log(`  ${i.indexname}`));

    await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
