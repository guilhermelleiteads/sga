const supabase = require('../config/supabase');

async function listSugestoes() {
	if (!supabase) throw new Error('Supabase não configurado.');

	const { data, error } = await supabase
		.from('sugestoes_manutencao')
		.select('id, ambiente_id, nome, sujestao, status, criadoem, ambientes(nome, local)')
		.order('id', { ascending: false });

	if (error) throw error;

	return (data || []).map((row) => ({
		id: row.id,
		ambienteId: row.ambiente_id,
		nome: row.nome,
		sugestao: row.sujestao,
		status: row.status || 'Pendente',
		criadoEm: row.criadoem,
		local: row.ambientes?.local || row.ambientes?.nome || 'Geral'
	}));
}

async function createSugestao({ nome, ambienteId, local, sugestao }) {
	if (!supabase) throw new Error('Supabase não configurado.');

	const cleanNome = String(nome || '').trim();
	const cleanSugestao = String(sugestao || '').trim();
	const rawAmbienteId = ambienteId ?? local;
	const cleanLocal = String(local || '').trim();
	const cleanAmbienteId = Number(rawAmbienteId);

	if (!cleanNome || !cleanSugestao) {
		throw new Error('Nome e sugestão são obrigatórios.');
	}

	let resolvedAmbienteId = null;
	if (Number.isSafeInteger(cleanAmbienteId) && cleanAmbienteId > 0) {
		resolvedAmbienteId = cleanAmbienteId;
	} else if (cleanLocal) {
		const searchValue = cleanLocal.replace(/\s*·\s*/g, ' ').trim();
		const { data: amb } = await supabase
			.from('ambientes')
			.select('id')
			.or(`nome.ilike.%${searchValue}%,local.ilike.%${searchValue}%,codigo.ilike.%${searchValue}%`)
			.limit(1)
			.maybeSingle();
		if (amb) resolvedAmbienteId = amb.id;
	}

	if (!resolvedAmbienteId) {
		throw new Error('Selecione um ambiente válido para registrar a sugestão.');
	}

	const { data, error } = await supabase
		.from('sugestoes_manutencao')
		.insert({
			ambiente_id: resolvedAmbienteId,
			nome: cleanNome,
			sujestao: cleanSugestao,
			status: 'Pendente'
		})
		.select('id, ambiente_id, nome, sujestao, status, criadoem')
		.single();

	if (error) throw error;

	return {
		id: data.id,
		ambienteId: data.ambiente_id,
		nome: data.nome,
		sugestao: data.sujestao,
		status: data.status,
		criadoEm: data.criadoem,
		local: cleanLocal || 'Geral'
	};
}

async function updateSugestaoStatus(id, { status, comentario }) {
	if (!supabase) throw new Error('Supabase não configurado.');

	const allowedStatuses = ['Pendente', 'Em análise', 'Concluída'];
	const cleanStatus = String(status || '').trim();

	if (!allowedStatuses.includes(cleanStatus)) {
		throw new Error('Status de manutenção inválido.');
	}

	const { data, error } = await supabase
		.from('sugestoes_manutencao')
		.update({ status: cleanStatus })
		.eq('id', id)
		.select('id, ambiente_id, nome, sujestao, status, criadoem, ambientes(nome, local)')
		.maybeSingle();

	if (error) throw error;
	if (!data) return null;

	return {
		id: data.id,
		ambienteId: data.ambiente_id,
		nome: data.nome,
		sugestao: data.sujestao,
		status: data.status,
		criadoEm: data.criadoem,
		local: data.ambientes?.local || data.ambientes?.nome || 'Geral'
	};
}

module.exports = {
	listSugestoes,
	createSugestao,
	updateSugestaoStatus
};
