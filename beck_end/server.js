const http = require('http');
const {
	readCollection,
	createClass,
	createTeacher,
	createAllocation,
	createAssignment,
	createSuggestion,
	updateSuggestion,
	usingSupabase,
} = require('./storage');

const port = process.env.PORT || 3001;

function sendJson(response, statusCode, data) {
	response.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
	});
	response.end(JSON.stringify(data));
}

async function readMaintenanceSuggestions() {
	return readCollection('sugestoes_manutencao');
}

async function readAssignments() {
	return readCollection('turma_componentes_docentes');
}

async function readClasses() {
	return readCollection('turmas');
}

async function readTeachers() {
	return readCollection('docentes');
}

async function readEnvironments() {
	return readCollection('ambientes');
}

async function readEnvironmentAllocations() {
	return readCollection('alocacoes_ambiente');
}

async function readRequestBody(request) {
	let body = '';
	for await (const chunk of request) body += chunk;
	return JSON.parse(body);
}

const server = http.createServer(async (request, response) => {
	if (request.method === 'OPTIONS') {
		sendJson(response, 204, {});
		return;
	}

	if (request.url === '/api/health' && request.method === 'GET') {
		sendJson(response, usingSupabase ? 200 : 503, {
			ok: usingSupabase,
			storage: usingSupabase ? 'supabase' : 'not-configured',
			erro: usingSupabase ? undefined : 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env do backend.',
		});
		return;
	}

	if (request.url === '/api/sugestoes-manutencao' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readMaintenanceSuggestions());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler as sugestões.' });
		}
		return;
	}

	if (request.url === '/api/turmas' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readClasses());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler as turmas.' });
		}
		return;
	}

	if (request.url === '/api/turmas' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const codigo = String(payload.codigo || '').trim();
			const nome = String(payload.nome || '').trim();
			const curso = String(payload.curso || '').trim();
			const turno = String(payload.turno || '').trim();
			const materias = Array.isArray(payload.materias) ? payload.materias.map((subject) => String(subject || '').trim()).filter(Boolean) : [];

			if (!codigo || !nome || !curso || !turno || materias.length > 5) {
				sendJson(response, 400, { erro: 'Código, nome, curso e turno são obrigatórios; informe até cinco matérias.' });
				return;
			}

			const newClass = await createClass({ codigo, nome, curso, turno, materias });
			sendJson(response, 201, newClass);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível criar a turma.' });
		}
		return;
	}

	if (request.url === '/api/docentes' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readTeachers());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler os docentes.' });
		}
		return;
	}

	if (request.url === '/api/docentes' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const registro = String(payload.registro || '').trim();
			const nome = String(payload.nome || '').trim();
			const area = String(payload.area || '').trim();
			if (!registro || !nome || !area) {
				sendJson(response, 400, { erro: 'Registro, nome e área de atuação são obrigatórios.' });
				return;
			}

			const newTeacher = await createTeacher({ registro, nome, area });
			sendJson(response, 201, newTeacher);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível cadastrar o docente.' });
		}
		return;
	}

	if (request.url === '/api/ambientes' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readEnvironments());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler os ambientes.' });
		}
		return;
	}

	if (request.url === '/api/atribuicoes' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readAssignments());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler as atribuições.' });
		}
		return;
	}

	if (request.url === '/api/alocacoes-ambiente' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readEnvironmentAllocations());
		} catch (error) {
			console.error('Erro ao ler alocações:', error.message);
			sendJson(response, 500, { erro: 'Não foi possível ler as utilizações.' });
		}
		return;
	}

	if (request.url === '/api/alocacoes-ambiente' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const ambienteId = String(payload.ambienteId || '').trim();
			const aulaId = String(payload.aulaId || '').trim();
			const diaSemana = String(payload.diaSemana || '').trim();
			const periodo = String(payload.periodo || '').trim();
			const horario = String(payload.horario || '').trim();
			if (!ambienteId || !aulaId || !diaSemana || !periodo || !horario) {
				sendJson(response, 400, { erro: 'Ambiente, aula, dia da semana, período e horário são obrigatórios.' });
				return;
			}

			const allocation = await createAllocation({ ambienteId, aulaId, diaSemana, periodo, horario });
			sendJson(response, 201, allocation);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a alocação.' });
		}
		return;
	}

	if (request.url === '/api/atribuicoes' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const turma = String(payload.turma || '').trim();
			const materia = String(payload.materia || '').trim();
			const docente = String(payload.docente || '').trim();
			if (!turma || !materia || !docente) {
				sendJson(response, 400, { erro: 'Turma, matéria e docente são obrigatórios.' });
				return;
			}

			const assignment = await createAssignment({ turma, materia, docente });
			sendJson(response, 201, assignment);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a atribuição.' });
		}
		return;
	}

	const suggestionMatch = request.url.match(/^\/api\/sugestoes-manutencao\/([^/]+)$/);
	if (suggestionMatch && request.method === 'PATCH') {
		try {
			const payload = await readRequestBody(request);
			const allowedStatuses = ['Pendente', 'Em análise', 'Concluída'];
			const status = String(payload.status || '').trim();
			const comentario = String(payload.comentario || '').trim();

			if (!allowedStatuses.includes(status)) {
				sendJson(response, 400, { erro: 'Status de manutenção inválido.' });
				return;
			}

			const suggestion = await updateSuggestion(suggestionMatch[1], { status, comentario });
			if (!suggestion) {
				sendJson(response, 404, { erro: 'Sugestão não encontrada.' });
				return;
			}
			sendJson(response, 200, suggestion);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível atualizar o direcionamento.' });
		}
		return;
	}

	if (request.url === '/api/sugestoes-manutencao' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const nome = String(payload.nome || '').trim();
			const local = String(payload.local || '').trim();
			const sugestao = String(payload.sugestao || '').trim();

			if (!nome || !local || !sugestao) {
				sendJson(response, 400, { erro: 'Nome, local e sugestão são obrigatórios.' });
				return;
			}

			const newSuggestion = await createSuggestion({ nome, local, sugestao });
			sendJson(response, 201, newSuggestion);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a sugestão.' });
		}
		return;
	}

	sendJson(response, 404, { erro: 'Rota não encontrada.' });
});

server.listen(port, () => {
	console.log(`API disponível em http://localhost:${port}${usingSupabase ? ' (Supabase)' : ' (Supabase não configurado)'}`);
});
