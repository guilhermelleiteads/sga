const supabase = require('../config/supabase');

async function listAlocacoes() {
	if (!supabase) throw new Error('Supabase não configurado.');

	const { data, error } = await supabase
		.from('alocacoes_ambiente')
		.select(`
			id,
			atribuicao_aula_id,
			ambiente_id,
			periodo,
			horario_inicio,
			horario_fim,
			ambientes(id, nome, tipo),
			turma_componentes_docentes(
				id,
				turmas(codigo, nome, turno),
				componentes_curriculares(nome),
				docentes(nome)
			)
		`)
		.order('id');

	if (error) throw error;

	return (data || []).map((row) => {
		const tcd = row.turma_componentes_docentes;
		const turma = tcd?.turmas;
		const turmaNome = turma?.nome || turma?.codigo || '';
		const materiaNome = tcd?.componentes_curriculares?.nome || '';
		const docenteNome = tcd?.docentes?.nome || '';

		const horario = row.horario_inicio && row.horario_fim
			? `${String(row.horario_inicio).slice(0, 5)} - ${String(row.horario_fim).slice(0, 5)}`
			: '';

		return {
			id: row.id,
			ambienteId: row.ambiente_id,
			ambienteNome: `${row.ambientes?.tipo || `AMB-${row.ambiente_id}`} · ${row.ambientes?.nome || ''}`,
			ambienteCodigo: row.ambientes?.tipo || `AMB-${row.ambiente_id}`,
			aulaId: row.atribuicao_aula_id,
			aulaDescricao: [turmaNome, materiaNome, docenteNome].filter(Boolean).join(' · '),
			diaSemana: 'Segunda a Sexta',
			horario,
			periodo: row.periodo || turma?.turno || 'Semestral'
		};
	});
}

async function createAlocacao({ ambienteId, aulaId, diaSemana, periodo, horario }) {
	if (!supabase) throw new Error('Supabase não configurado.');

	if (!ambienteId || !aulaId) {
		throw new Error('Ambiente e aula são obrigatórios.');
	}

	const { data, error } = await supabase
		.from('alocacoes_ambiente')
		.insert({
			ambiente_id: Number(ambienteId),
			atribuicao_aula_id: Number(aulaId)
		})
		.select('*')
		.single();

	if (error) throw error;

	return {
		...data,
		diaSemana: diaSemana || 'Segunda a Sexta',
		periodo: periodo || 'Semestral',
		horario: horario || ''
	};
}

module.exports = {
	listAlocacoes,
	createAlocacao
};
