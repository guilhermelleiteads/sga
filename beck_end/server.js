const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const port = process.env.PORT || 3001;
const databasePath = path.join(__dirname, '..', 'Banco_de_dados', 'sujestoes.json');

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
