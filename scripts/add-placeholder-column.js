// Script to add placeholder column to chatbots table
// This only ADDS a new column - does not delete or modify anything

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqyhqjxuqjftuueclehs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPlaceholderColumn() {
    console.log('Adding placeholder column to chatbots table...');

    const { data, error } = await supabase.rpc('exec_sql', {
        query: `ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS placeholder TEXT DEFAULT 'Send a message...';`
    });

    if (error) {
        // If RPC doesn't exist, try direct SQL via REST API
        console.log('RPC not available, trying alternative method...');

        // Use the Supabase Management API or just log instructions
        console.log('\n⚠️ Cannot execute SQL directly. Please run this in Supabase SQL Editor:');
        console.log('\n----------------------------------------');
        console.log("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS placeholder TEXT DEFAULT 'Send a message...';");
        console.log('----------------------------------------\n');
        return;
    }

    console.log('✅ Placeholder column added successfully!');
}

addPlaceholderColumn();
