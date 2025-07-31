const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase URL and service role key
const supabaseUrl = 'https://bxdwavbrgrnosnuydpor.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'update-add-artwork-organization.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('query', { query: sql });

    if (error) {
      console.error('Error applying migration:', error);
      return;
    }

    console.log('Migration applied successfully!');
    
    // Also mark the migration as applied in the migrations table
    const migrationInsert = `
      INSERT INTO supabase_migrations.schema_migrations (version, statements, name) 
      VALUES ('20250731143655', NULL, '20250731143655_update_add_artwork_organization.sql')
      ON CONFLICT (version) DO NOTHING;
    `;
    
    await supabase.rpc('query', { query: migrationInsert });
    console.log('Migration marked as applied in schema_migrations table');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

applyMigration();