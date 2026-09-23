const supabase = require('../config/supabase');

async function listAmbientes() {
	if (!supabase) throw new Error('Supabase não configurado.');

	const { data, error } = await supabase
		.from('ambientes')
		.select('id, nome, tipo, local, capacidade, status')
		.order('id');

	if (error) throw error;

	return (data || []).map((row) => ({
		...row,
		codigo: row.tipo || `AMB-${row.id}`
	}));
}

module.exports = {
	listAmbientes
};
