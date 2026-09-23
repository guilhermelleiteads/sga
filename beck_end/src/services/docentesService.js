const supabase = require('../config/supabase');

async function listDocentes() {
	if (!supabase) throw new Error('Supabase não configurado.');

	const { data, error } = await supabase
		.from('docentes')
		.select('id, registro, nome, area')
		.order('nome');

	if (error) throw error;
	return data || [];
}

async function createDocente({ registro, nome, area }) {
	if (!supabase) throw new Error('Supabase não configurado.');

	const cleanRegistro = String(registro || '').trim();
	const cleanNome = String(nome || '').trim();
	const cleanArea = String(area || '').trim();

	if (!cleanRegistro || !cleanNome || !cleanArea) {
		throw new Error('Registro, nome e área de atuação são obrigatórios.');
	}

	const { data, error } = await supabase
		.from('docentes')
		.insert({
			registro: cleanRegistro,
			nome: cleanNome,
			area: cleanArea
		})
		.select('*')
		.single();

	if (error) throw error;
	return data;
}

module.exports = {
	listDocentes,
	createDocente
};
