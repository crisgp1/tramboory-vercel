const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupSupabaseSchema() {
  try {
    console.log('🚀 Setting up Supabase schema for inventory system...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'supabase_inventory_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with next statement for now
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        // Continue with next statement
      }
    }
    
    console.log('🎉 Schema setup completed!');
    
    // Test the connection
    console.log('🔍 Testing connection...');
    const { data: suppliers, error: testError } = await supabase
      .from('suppliers')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
    } else {
      console.log('✅ Connection test successful!');
    }
    
  } catch (error) {
    console.error('❌ Failed to setup Supabase schema:', error.message);
    process.exit(1);
  }
}

// Alternative method: Manual execution instructions
function showManualInstructions() {
  console.log(`
🔧 MANUAL SETUP INSTRUCTIONS:
===============================

1. Go to your Supabase dashboard: https://vliglqpzncrbqrrkzuhc.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of 'supabase_inventory_schema.sql'
4. Execute the script
5. Run this script again to test the connection

The schema file is located at: ${path.join(__dirname, '..', 'supabase_inventory_schema.sql')}
`);
}

if (require.main === module) {
  // Check if we should show manual instructions
  if (process.argv.includes('--manual')) {
    showManualInstructions();
  } else {
    setupSupabaseSchema();
  }
}

module.exports = { setupSupabaseSchema, showManualInstructions };