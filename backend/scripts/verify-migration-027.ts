import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    console.log('🔍 Checking sop_tickets schema...\n');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sop_tickets' AND column_name IN ('inventory_id', 'is_sidecar')
      ORDER BY column_name
    `;
    
    if (columns.length === 0) {
      console.error('❌ ERROR: New columns not found!');
      process.exit(1);
    }
    
    console.log('✅ Migration columns found:');
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    console.log('\n🔍 Checking indexes...\n');
    
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'sop_tickets' AND indexname LIKE '%inventory%'
    `;
    
    console.log('✅ Inventory-related indexes:');
    if (indexes.length === 0) {
      console.log('   (none found)');
    } else {
      indexes.forEach((idx: any) => {
        console.log(`   - ${idx.indexname}`);
      });
    }
    
    console.log('\n✨ Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
