const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const port = process.env.PORT || 3001;
const databasePath = path.join(__dirname, '..', 'Banco_de_dados', 'sujestoes.json');
const aulasPath = path.join(__dirname, '..', 'Banco_de_dados', 'Aula.json');
const classesPath = path.join(__dirname, '..', 'Banco_de_dados', 'Turmas.json');
const teachersPath = path.join(__dirname, '..', 'Banco_de_dados', 'Docentes.json');
const environmentsPath = path.join(__dirname, '..', 'Banco_de_dados', 'Ambientes.json');
const allocationsPath = path.join(__dirname, '..', 'Banco_de_dados', 'utilização.json');

function sendJson(response, statusCode, data) {
	response.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
	});
	response.end(JSON.stringify(data));
}

async function readSuggestions() {
	const file = await fs.readFile(databasePath, 'utf8');
	return JSON.parse(file);
}

async function readAulas() {
	const file = await fs.readFile(aulasPath, 'utf8');
	return JSON.parse(file);
}

async function readClasses() {
	const file = await fs.readFile(classesPath, 'utf8');
	return JSON.parse(file);
}

async function readTeachers() {
	const file = await fs.readFile(teachersPath, 'utf8');
	return JSON.parse(file);
}

async function readEnvironments() {
	const file = await fs.readFile(environmentsPath, 'utf8');
	return JSON.parse(file);
}

async function readAllocations() {
	const file = await fs.readFile(allocationsPath, 'utf8');
	return JSON.parse(file);
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

	if (request.url === '/api/sugestoes' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readSuggestions());
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

			const classes = await readClasses();
			if (classes.some((classItem) => classItem.codigo.toLowerCase() === codigo.toLowerCase())) {
				sendJson(response, 409, { erro: 'Já existe uma turma com este código.' });
				return;
			}

			const newClass = { id: randomUUID(), codigo, nome, curso, turno, materias };
			classes.push(newClass);
			await fs.writeFile(classesPath, `${JSON.stringify(classes, null, 2)}\n`, 'utf8');
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

			const teachers = await readTeachers();
			if (teachers.some((teacher) => teacher.registro.toLowerCase() === registro.toLowerCase())) {
				sendJson(response, 409, { erro: 'Já existe um docente com este registro.' });
				return;
			}

			const numericIds = teachers.map((teacher) => Number(teacher.id)).filter(Number.isFinite);
			const newTeacher = { id: numericIds.length ? Math.max(...numericIds) + 1 : 1, registro, nome, area };
			teachers.push(newTeacher);
			await fs.writeFile(teachersPath, `${JSON.stringify(teachers, null, 2)}\n`, 'utf8');
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

	if (request.url === '/api/aulas' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readAulas());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler as aulas.' });
		}
		return;
	}

	if (request.url === '/api/utilizacao' && request.method === 'GET') {
		try {
			sendJson(response, 200, await readAllocations());
		} catch {
			sendJson(response, 500, { erro: 'Não foi possível ler as utilizações.' });
		}
		return;
	}

	if (request.url === '/api/alocacoes' && request.method === 'POST') {
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

			const allocations = await readAllocations();
			const environments = await readEnvironments();
			const aulas = await readAulas();
			const environment = environments.find((item) => String(item.id) === ambienteId);
			const aula = aulas.find((item) => String(item.id) === aulaId);
			if (!environment || !aula) {
				sendJson(response, 400, { erro: 'O ambiente ou a aula selecionada não foi encontrada.' });
				return;
			}

			const allocation = {
				id: randomUUID(),
				ambienteId,
				ambienteNome: `${environment.codigo} · ${environment.nome}`,
				aulaId,
				aulaDescricao: `${aula.turma} · ${aula.materia} · ${aula.docente}`,
				diaSemana,
				periodo,
				horario,
				criadoEm: new Date().toISOString(),
			};
			allocations.push(allocation);
			await fs.writeFile(allocationsPath, `${JSON.stringify(allocations, null, 2)}\n`, 'utf8');
			sendJson(response, 201, allocation);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a alocação.' });
		}
		return;
	}

	if (request.url === '/api/aulas' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const turma = String(payload.turma || '').trim();
			const materia = String(payload.materia || '').trim();
			const docente = String(payload.docente || '').trim();
			if (!turma || !materia || !docente) {
				sendJson(response, 400, { erro: 'Turma, matéria e docente são obrigatórios.' });
				return;
			}

			const aulas = await readAulas();
			const aula = { id: randomUUID(), turma, materia, docente, criadoEm: new Date().toISOString() };
			aulas.push(aula);
			await fs.writeFile(aulasPath, `${JSON.stringify(aulas, null, 2)}\n`, 'utf8');
			sendJson(response, 201, aula);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a atribuição.' });
		}
		return;
	}

	const suggestionMatch = request.url.match(/^\/api\/sugestoes\/([^/]+)$/);
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

			const suggestions = await readSuggestions();
			const suggestion = suggestions.find((item) => String(item.id) === suggestionMatch[1]);
			if (!suggestion) {
				sendJson(response, 404, { erro: 'Sugestão não encontrada.' });
				return;
			}

			suggestion.status = status;
			suggestion.comentario = comentario;
			await fs.writeFile(databasePath, `${JSON.stringify(suggestions, null, 2)}\n`, 'utf8');
			sendJson(response, 200, suggestion);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível atualizar o direcionamento.' });
		}
		return;
	}

	if (request.url === '/api/sugestoes' && request.method === 'POST') {
		try {
			const payload = await readRequestBody(request);
			const nome = String(payload.nome || '').trim();
			const local = String(payload.local || '').trim();
			const sugestao = String(payload.sugestao || '').trim();

			if (!nome || !local || !sugestao) {
				sendJson(response, 400, { erro: 'Nome, local e sugestão são obrigatórios.' });
				return;
			}

			const suggestions = await readSuggestions();
			const newSuggestion = {
				id: randomUUID(),
				nome,
				local,
				sugestao,
				status: 'Pendente',
				criadoEm: new Date().toISOString(),
			};
			suggestions.push(newSuggestion);
			await fs.writeFile(databasePath, `${JSON.stringify(suggestions, null, 2)}\n`, 'utf8');
			sendJson(response, 201, newSuggestion);
		} catch {
			sendJson(response, 400, { erro: 'Não foi possível registrar a sugestão.' });
		}
		return;
	}

	sendJson(response, 404, { erro: 'Rota não encontrada.' });
});

server.listen(port, () => {
	console.log(`API de sugestões disponível em http://localhost:${port}`);
});
