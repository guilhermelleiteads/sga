const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.warn('⚠️ AVISO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env');
}

const supabase = supabaseUrl && supabaseKey
	? createClient(supabaseUrl, supabaseKey)
	: null;

module.exports = supabase;
