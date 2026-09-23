const supabase = require('../config/supabase');

async function listTurmas() {
	if (!supabase) throw new Error('Supabase não configurado.');

	const { data, error } = await supabase
		.from('turmas')
		.select('id, codigo, nome, turno, cursos(nome), turma_componentes_docentes(componentes_curriculares(nome))')
		.order('id');

	if (error) throw error;

	return (data || []).map((row) => ({
		id: row.id,
		codigo: row.codigo,
		nome: row.nome || row.codigo,
		curso: row.cursos?.nome || '',
		turno: row.turno,
		materias: (row.turma_componentes_docentes || [])
			.map((item) => item.componentes_curriculares?.nome)
			.filter(Boolean)
	}));
}

async function createTurma({ codigo, nome, curso, turno, materias = [] }) {
	if (!supabase) throw new Error('Supabase não configurado.');

	const cleanCodigo = String(codigo || '').trim();
	const cleanNome = String(nome || '').trim();
	const cleanCurso = String(curso || '').trim();
	const cleanTurno = String(turno || '').trim();

	if (!cleanCodigo || !cleanNome || !cleanCurso || !cleanTurno) {
		throw new Error('Código, nome, curso e turno são obrigatórios.');
	}

	// 1. Busca ou cria o curso
	let { data: courseData } = await supabase
		.from('cursos')
		.select('id')
		.ilike('nome', cleanCurso)
		.limit(1)
		.maybeSingle();

	if (!courseData) {
		const { data: tipo } = await supabase.from('tipos_curso').select('id').limit(1).maybeSingle();
		const { data: newCourse, error: courseErr } = await supabase
			.from('cursos')
			.insert({ tipo_curso_id: tipo ? tipo.id : 1, nome: cleanCurso })
			.select('id')
			.single();
		if (courseErr) throw courseErr;
		courseData = newCourse;
	}

	// 2. Insere a turma
	const { data: novaTurma, error: turmaErr } = await supabase
		.from('turmas')
		.insert({
			codigo: cleanCodigo,
			nome: cleanNome,
			curso_id: courseData.id,
			turno: cleanTurno,
			carga_horaria: 80,
			situacao: 'Ativa'
		})
		.select('*')
		.single();

	if (turmaErr) throw turmaErr;

	// 3. Vincula matérias
	const materiasSalvas = [];
	const listaMaterias = Array.isArray(materias) ? materias : [];

	for (const materiaName of listaMaterias) {
		const nomeLimpo = String(materiaName || '').trim();
		if (!nomeLimpo) continue;

		let { data: componente } = await supabase
			.from('componentes_curriculares')
			.select('id')
			.ilike('nome', nomeLimpo)
			.limit(1)
			.maybeSingle();

		if (!componente) {
			const sigla = nomeLimpo.slice(0, 6).toUpperCase();
			const { data: novoComp } = await supabase
				.from('componentes_curriculares')
				.insert({ sigla, nome: nomeLimpo })
				.select('id')
				.single();
			componente = novoComp;
		}

		if (componente) {
			await supabase.from('turma_componentes_docentes').insert({
				turma_id: novaTurma.id,
				componente_id: componente.id,
				carga_horaria: 20
			});
			materiasSalvas.push(nomeLimpo);
		}
	}

	return {
		id: novaTurma.id,
		codigo: novaTurma.codigo,
		nome: novaTurma.nome,
		curso: cleanCurso,
		turno: novaTurma.turno,
		materias: materiasSalvas
	};
}

module.exports = {
	listTurmas,
	createTurma
};
