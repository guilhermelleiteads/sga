const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Montagem das rotas da API sob o prefixo /api
app.use('/api', apiRoutes);

// Rota 404 para rotas não encontradas
app.use((req, res) => {
	res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Middleware de tratamento global de erros
app.use((err, req, res, next) => {
	console.error('❌ Erro não tratado no servidor:', err.message || err);
	res.status(500).json({ erro: err.message || 'Erro interno do servidor.' });
});

module.exports = app;
