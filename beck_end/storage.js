const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
	? createClient(supabaseUrl, supabaseServiceRoleKey)
	: null;

async function readCollection(tableName) {
	if (!supabase) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');

	if (tableName === 'turmas') {
		const { data, error } = await supabase.from('turmas').select('id, codigo, nome, turno, cursos(nome), turma_componentes_docentes(componentes_curriculares(nome))').order('id');
		if (error) throw error;
		return data.map((row) => ({ id: row.id, codigo: row.codigo, nome: row.nome, curso: row.cursos?.nome || '', turno: row.turno, materias: (row.turma_componentes_docentes || []).map((item) => item.componentes_curriculares?.nome).filter(Boolean) }));
	}

	if (tableName === 'docentes') {
		const { data, error } = await supabase.from('docentes').select('id, registro, nome, area').order('id');
		if (error) throw error;
		return data;
	}

	if (tableName === 'ambientes') {
		const { data, error } = await supabase.from('ambientes').select('id, nome, tipo, local, capacidade, status').order('id');
		if (error) throw error;
		return data.map((row) => ({ ...row, codigo: row.tipo || `AMB-${row.id}` }));
	}

	if (tableName === 'turma_componentes_docentes') {
		const { data, error } = await supabase.from('turma_componentes_docentes').select('id, turma_id, componente_id, docente_id, turmas(id, codigo, nome, turno, horario_inicio, horario_fim), componentes_curriculares(id, nome, sigla), docentes(id, nome, registro)').order('id');
		if (error) throw error;
		return data.map((row) => ({
			id: row.id,
			turma: row.turmas?.nome || row.turmas?.codigo || '',
			materia: row.componentes_curriculares?.nome || '',
			docente: row.docentes?.nome || '',
			turmaCodigo: row.turmas?.codigo || '',
			turno: row.turmas?.turno || '',
			horarioInicio: row.turmas?.horario_inicio || '',
			horarioFim: row.turmas?.horario_fim || '',
		}));
	}

	if (tableName === 'alocacoes_ambiente') {
		const { data, error } = await supabase.from('alocacoes_ambiente').select('id, atribuicao_aula_id, ambiente_id, ambientes(id, nome, tipo), turma_componentes_docentes(id, turmas(codigo, nome, horario_inicio, horario_fim), componentes_curriculares(nome), docentes(nome))').order('id');
		if (error) throw error;
		return data.map((row) => ({
			id: row.id,
			ambienteId: row.ambiente_id,
			ambienteNome: `${row.ambientes?.tipo || `AMB-${row.ambiente_id}`} · ${row.ambientes?.nome || ''}`,
			aulaId: row.atribuicao_aula_id,
			aulaDescricao: `${row.turma_componentes_docentes?.turmas?.codigo || row.turma_componentes_docentes?.turmas?.nome || ''} · ${row.turma_componentes_docentes?.componentes_curriculares?.nome || ''} · ${row.turma_componentes_docentes?.docentes?.nome || ''}`,
			diaSemana: row.dia_semana || '',
			horario: row.horario || [row.turma_componentes_docentes?.turmas?.horario_inicio, row.turma_componentes_docentes?.turmas?.horario_fim].filter(Boolean).join(' - '),
			periodo: row.periodo || '',
		}));
	}

	if (tableName === 'sugestoes_manutencao') {
		const { data, error } = await supabase.from('sugestoes_manutencao').select('id, ambiente_id, nome, sujestao, status, criadoem').order('id');
		if (error) throw error;
		return data.map((row) => ({ ...row, sugestao: row.sujestao, criadoEm: row.criadoem }));
	}

	throw new Error(`Tabela não mapeada: ${tableName}`);
}

async function insert(tableName, value) {
	if (!supabase) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
	const { data, error } = await supabase.from(tableName).insert(value).select('*').single();
	if (error) throw error;
	return { ...data, criadoEm: data.criado_em };
}

async function createTeacher(value) {
	return insert('docentes', value);
}

async function createClass(value) {
	const { data: course, error: courseError } = await supabase.from('cursos').select('id').eq('nome', value.curso).limit(1).maybeSingle();
	if (courseError) throw courseError;
	if (!course) throw new Error('O curso informado não existe no banco SQL.');
	const turma = await insert('turmas', { codigo: value.codigo, nome: value.nome, curso_id: course.id, turno: value.turno, carga_horaria: 1, situacao: 'Ativa' });
	for (const materia of value.materias) {
		const { data: component, error: componentError } = await supabase.from('componentes_curriculares').select('id').eq('nome', materia).limit(1).maybeSingle();
		if (componentError) throw componentError;
		if (!component) continue;
		const { error } = await supabase.from('turma_componentes_docentes').insert({ turma_id: turma.id, componente_id: component.id, carga_horaria: 1 });
		if (error) throw error;
	}
	return { ...value, id: turma.id };
}

async function createAssignment(value) {
	const { data: turma, error: turmaError } = await supabase.from('turmas').select('id, nome, codigo').or(`nome.eq.${value.turma},codigo.eq.${value.turma}`).limit(1).maybeSingle();
	if (turmaError) throw turmaError;
	const { data: component, error: componentError } = await supabase.from('componentes_curriculares').select('id').eq('nome', value.materia).limit(1).maybeSingle();
	if (componentError) throw componentError;
	const { data: teacher, error: teacherError } = await supabase.from('docentes').select('id').eq('nome', value.docente).limit(1).maybeSingle();
	if (teacherError) throw teacherError;
	if (!turma || !component || !teacher) throw new Error('Turma, matéria ou docente não encontrados.');
	return insert('turma_componentes_docentes', { turma_id: turma.id, componente_id: component.id, docente_id: teacher.id, carga_horaria: 1 });
}

async function createAllocation(value) {
	const { data: environment, error: environmentError } = await supabase.from('ambientes').select('tipo, nome').eq('id', value.ambienteId).single();
	if (environmentError) throw environmentError;
	const { data: lesson, error: lessonError } = await supabase.from('turma_componentes_docentes').select('id, turmas(codigo, nome), componentes_curriculares(nome), docentes(nome)').eq('id', value.aulaId).single();
	if (lessonError) throw lessonError;
	return insert('alocacoes_ambiente', { ambiente_id: value.ambienteId, atribuicao_aula_id: value.aulaId });
}

async function createSuggestion(value) {
	return insert('sugestoes_manutencao', { ambiente_id: value.ambienteId || null, nome: value.nome, sujestao: value.sugestao, status: 'Pendente' });
}

async function updateSuggestion(id, value) {
	if (!supabase) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
	const { data, error } = await supabase.from('sugestoes_manutencao').update(value).eq('id', id).select('*').maybeSingle();
	if (error) throw error;
	return data ? { ...data, criadoEm: data.criado_em } : null;
}

module.exports = {
	readCollection,
	createClass,
	createTeacher,
	createAllocation,
	createAssignment,
	createSuggestion,
	updateSuggestion,
	usingSupabase: Boolean(supabase),
};