const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./supabase');

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de verificação de conexão com Supabase
const checkSupabase = (req, res, next) => {
	if (!supabase) {
		return res.status(503).json({
			erro: 'Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env'
		});
	}
	next();
};

// 1. Healthcheck
app.get('/api/health', (req, res) => {
	res.status(supabase ? 200 : 503).json({
		ok: Boolean(supabase),
		storage: supabase ? 'supabase' : 'not-configured',
		erro: supabase ? undefined : 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env do backend.'
	});
});

// 2. Turmas
app.get('/api/turmas', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('turmas')
			.select('id, codigo, nome, turno, cursos(nome), turma_componentes_docentes(componentes_curriculares(nome))')
			.order('id');

		if (error) throw error;

		const turmas = data.map((row) => ({
			id: row.id,
			codigo: row.codigo,
			nome: row.nome || row.codigo,
			curso: row.cursos?.nome || '',
			turno: row.turno,
			materias: (row.turma_componentes_docentes || [])
				.map((item) => item.componentes_curriculares?.nome)
				.filter(Boolean)
		}));

		res.json(turmas);
	} catch (err) {
		console.error('Erro ao buscar turmas:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler as turmas.' });
	}
});

app.post('/api/turmas', checkSupabase, async (req, res) => {
	try {
		const { codigo, nome, curso, turno, materias = [] } = req.body;

		if (!codigo?.trim() || !nome?.trim() || !curso?.trim() || !turno?.trim()) {
			return res.status(400).json({ erro: 'Código, nome, curso e turno são obrigatórios.' });
		}

		// Localiza ou associa o curso
		let { data: courseData } = await supabase
			.from('cursos')
			.select('id')
			.ilike('nome', curso.trim())
			.limit(1)
			.maybeSingle();

		if (!courseData) {
			const { data: tipo } = await supabase.from('tipos_curso').select('id').limit(1).maybeSingle();
			const { data: newCourse, error: courseErr } = await supabase
				.from('cursos')
				.insert({ tipo_curso_id: tipo ? tipo.id : 1, nome: curso.trim() })
				.select('id')
				.single();
			if (courseErr) throw courseErr;
			courseData = newCourse;
		}

		// Cria a turma
		const { data: novaTurma, error: turmaErr } = await supabase
			.from('turmas')
			.insert({
				codigo: codigo.trim(),
				nome: nome.trim(),
				curso_id: courseData.id,
				turno: turno.trim(),
				carga_horaria: 80,
				situacao: 'Ativa'
			})
			.select('*')
			.single();

		if (turmaErr) throw turmaErr;

		// Vincula as matérias
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

		res.status(201).json({
			id: novaTurma.id,
			codigo: novaTurma.codigo,
			nome: novaTurma.nome,
			curso: curso.trim(),
			turno: novaTurma.turno,
			materias: materiasSalvas
		});
	} catch (err) {
		console.error('Erro ao criar turma:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível criar a turma.' });
	}
});

// 3. Docentes
app.get('/api/docentes', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('docentes')
			.select('id, registro, nome, area')
			.order('nome');

		if (error) throw error;
		res.json(data);
	} catch (err) {
		console.error('Erro ao buscar docentes:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler os docentes.' });
	}
});

app.post('/api/docentes', checkSupabase, async (req, res) => {
	try {
		const { registro, nome, area } = req.body;
		if (!registro?.trim() || !nome?.trim() || !area?.trim()) {
			return res.status(400).json({ erro: 'Registro, nome e área de atuação são obrigatórios.' });
		}

		const { data, error } = await supabase
			.from('docentes')
			.insert({
				registro: registro.trim(),
				nome: nome.trim(),
				area: area.trim()
			})
			.select('*')
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err) {
		console.error('Erro ao cadastrar docente:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível cadastrar o docente.' });
	}
});

// 4. Ambientes
app.get('/api/ambientes', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('ambientes')
			.select('id, nome, tipo, local, capacidade, status')
			.order('id');

		if (error) throw error;

		const ambientes = data.map((row) => ({
			...row,
			codigo: row.tipo || `AMB-${row.id}`
		}));

		res.json(ambientes);
	} catch (err) {
		console.error('Erro ao buscar ambientes:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler os ambientes.' });
	}
});

// 5. Atribuições de Aula
app.get('/api/atribuicoes', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('turma_componentes_docentes')
			.select(`
				id,
				turma_id,
				componente_id,
				docente_id,
				turmas(id, codigo, nome, turno, horario_inicio, horario_fim),
				componentes_curriculares(id, nome, sigla),
				docentes(id, nome, registro)
			`)
			.order('id');

		if (error) throw error;

		const atribuicoes = data.map((row) => ({
			id: row.id,
			turma: row.turmas?.nome || row.turmas?.codigo || '',
			materia: row.componentes_curriculares?.nome || '',
			docente: row.docentes?.nome || '',
			turmaCodigo: row.turmas?.codigo || '',
			turno: row.turmas?.turno || '',
			horarioInicio: row.turmas?.horario_inicio || '',
			horarioFim: row.turmas?.horario_fim || ''
		}));

		res.json(atribuicoes);
	} catch (err) {
		console.error('Erro ao buscar atribuições:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler as atribuições.' });
	}
});

app.post('/api/atribuicoes', checkSupabase, async (req, res) => {
	try {
		const { turma, materia, docente } = req.body;
		if (!turma?.trim() || !materia?.trim() || !docente?.trim()) {
			return res.status(400).json({ erro: 'Turma, matéria e docente são obrigatórios.' });
		}

		const { data: t } = await supabase
			.from('turmas')
			.select('id, nome, codigo')
			.or(`nome.eq.${turma.trim()},codigo.eq.${turma.trim()}`)
			.limit(1)
			.maybeSingle();

		const { data: c } = await supabase
			.from('componentes_curriculares')
			.select('id')
			.eq('nome', materia.trim())
			.limit(1)
			.maybeSingle();

		const { data: d } = await supabase
			.from('docentes')
			.select('id')
			.eq('nome', docente.trim())
			.limit(1)
			.maybeSingle();

		if (!t || !c || !d) {
			return res.status(400).json({ erro: 'Turma, matéria ou docente não encontrados.' });
		}

		const { data, error } = await supabase
			.from('turma_componentes_docentes')
			.insert({
				turma_id: t.id,
				componente_id: c.id,
				docente_id: d.id,
				carga_horaria: 20
			})
			.select('*')
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err) {
		console.error('Erro ao registrar atribuição:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível registrar a atribuição.' });
	}
});

// 6. Alocações de Ambiente
app.get('/api/alocacoes-ambiente', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('alocacoes_ambiente')
			.select(`
				id,
				atribuicao_aula_id,
				ambiente_id,
				ambientes(id, nome, tipo),
				turma_componentes_docentes(
					id,
					turmas(codigo, nome, horario_inicio, horario_fim, turno),
					componentes_curriculares(nome),
					docentes(nome)
				)
			`)
			.order('id');

		if (error) throw error;

		const alocacoes = data.map((row) => {
			const tcd = row.turma_componentes_docentes;
			const turma = tcd?.turmas;
			const turmaNome = turma?.nome || turma?.codigo || '';
			const materiaNome = tcd?.componentes_curriculares?.nome || '';
			const docenteNome = tcd?.docentes?.nome || '';

			const horario = [turma?.horario_inicio, turma?.horario_fim]
				.filter(Boolean)
				.join(' - ') || turma?.turno || 'Horário da turma';

			return {
				id: row.id,
				ambienteId: row.ambiente_id,
				ambienteNome: `${row.ambientes?.tipo || `AMB-${row.ambiente_id}`} · ${row.ambientes?.nome || ''}`,
				ambienteCodigo: row.ambientes?.tipo || `AMB-${row.ambiente_id}`,
				aulaId: row.atribuicao_aula_id,
				aulaDescricao: [turmaNome, materiaNome, docenteNome].filter(Boolean).join(' · '),
				diaSemana: 'Segunda a Sexta',
				horario,
				periodo: turma?.turno || 'Semestral'
			};
		});

		res.json(alocacoes);
	} catch (err) {
		console.error('Erro ao buscar alocações:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler as utilizações.' });
	}
});

app.post('/api/alocacoes-ambiente', checkSupabase, async (req, res) => {
	try {
		const { ambienteId, aulaId, diaSemana, periodo, horario } = req.body;
		if (!ambienteId || !aulaId) {
			return res.status(400).json({ erro: 'Ambiente e aula são obrigatórios.' });
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

		res.status(201).json({
			...data,
			diaSemana: diaSemana || 'Segunda a Sexta',
			periodo: periodo || 'Semestral',
			horario: horario || ''
		});
	} catch (err) {
		console.error('Erro ao registrar alocação:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível registrar a alocação.' });
	}
});

// 7. Sugestões de Manutenção
app.get('/api/sugestoes-manutencao', checkSupabase, async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('sugestoes_manutencao')
			.select('id, ambiente_id, nome, sujestao, status, criadoem, ambientes(nome, local)')
			.order('id', { ascending: false });

		if (error) throw error;

		const sugestoes = data.map((row) => ({
			id: row.id,
			ambienteId: row.ambiente_id,
			nome: row.nome,
			sugestao: row.sujestao,
			status: row.status || 'Pendente',
			criadoEm: row.criadoem,
			local: row.ambientes?.local || row.ambientes?.nome || 'Geral'
		}));

		res.json(sugestoes);
	} catch (err) {
		console.error('Erro ao buscar sugestões:', err.message);
		res.status(500).json({ erro: 'Não foi possível ler as sugestões.' });
	}
});

app.post('/api/sugestoes-manutencao', checkSupabase, async (req, res) => {
	try {
		const { nome, local, sugestao } = req.body;
		if (!nome?.trim() || !sugestao?.trim()) {
			return res.status(400).json({ erro: 'Nome e sugestão são obrigatórios.' });
		}

		let ambienteId = null;
		if (local?.trim()) {
			const { data: amb } = await supabase
				.from('ambientes')
				.select('id')
				.or(`nome.ilike.%${local.trim()}%,local.ilike.%${local.trim()}%`)
				.limit(1)
				.maybeSingle();
			if (amb) ambienteId = amb.id;
		}

		const { data, error } = await supabase
			.from('sugestoes_manutencao')
			.insert({
				ambiente_id: ambienteId,
				nome: nome.trim(),
				sujestao: sugestao.trim(),
				status: 'Pendente'
			})
			.select('id, ambiente_id, nome, sujestao, status, criadoem')
			.single();

		if (error) throw error;

		res.status(201).json({
			id: data.id,
			ambienteId: data.ambiente_id,
			nome: data.nome,
			sugestao: data.sujestao,
			status: data.status,
			criadoEm: data.criadoem,
			local: local?.trim() || 'Geral'
		});
	} catch (err) {
		console.error('Erro ao registrar sugestão:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível registrar a sugestão.' });
	}
});

app.patch('/api/sugestoes-manutencao/:id', checkSupabase, async (req, res) => {
	try {
		const { status } = req.body;
		const allowedStatuses = ['Pendente', 'Em análise', 'Concluída'];
		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({ erro: 'Status de manutenção inválido.' });
		}

		const { data, error } = await supabase
			.from('sugestoes_manutencao')
			.update({ status })
			.eq('id', req.params.id)
			.select('id, ambiente_id, nome, sujestao, status, criadoem, ambientes(nome, local)')
			.maybeSingle();

		if (error) throw error;
		if (!data) return res.status(404).json({ erro: 'Sugestão não encontrada.' });

		res.json({
			id: data.id,
			ambienteId: data.ambiente_id,
			nome: data.nome,
			sugestao: data.sujestao,
			status: data.status,
			criadoEm: data.criadoem,
			local: data.ambientes?.local || data.ambientes?.nome || 'Geral'
		});
	} catch (err) {
		console.error('Erro ao atualizar sugestão:', err.message);
		res.status(400).json({ erro: err.message || 'Não foi possível atualizar a sugestão.' });
	}
});

// Tratamento de rota não encontrada
app.use((req, res) => {
	res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.listen(port, () => {
	console.log(`🚀 Servidor SGA Express ativo na porta ${port}`);
	console.log(`📡 Supabase: ${supabase ? 'Conectado' : 'Desconectado'}`);
});
