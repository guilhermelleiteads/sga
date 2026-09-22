require('dotenv').config();
const fs = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
	? createClient(supabaseUrl, supabaseServiceRoleKey)
	: null;

async function readCollection(filePath, tableName) {
	if (!supabase) {
		const file = await fs.readFile(filePath, 'utf8');
		return JSON.parse(file);
	}

	const { data, error } = await supabase
		.from(tableName)
		.select('id, data, created_at')
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data.map((row) => row.data);
}

async function writeCollection(filePath, tableName, values) {
	if (!supabase) {
		await fs.writeFile(filePath, `${JSON.stringify(values, null, 2)}\n`, 'utf8');
		return;
	}

	const rows = values.map((value) => ({
		id: String(value.id),
		data: value,
		created_at: value.criadoEm || new Date().toISOString(),
	}));

	const { data: existingRows, error: existingError } = await supabase
		.from(tableName)
		.select('id');
	if (existingError) throw existingError;

	const currentIds = new Set(rows.map((row) => row.id));
	const removedIds = existingRows.map((row) => row.id).filter((id) => !currentIds.has(id));

	if (removedIds.length) {
		const { error } = await supabase.from(tableName).delete().in('id', removedIds);
		if (error) throw error;
	}

	if (rows.length) {
		const { error } = await supabase.from(tableName).upsert(rows);
		if (error) throw error;
	}
}

module.exports = {
	readCollection,
	writeCollection,
	usingSupabase: Boolean(supabase),
};