const express = require('express');
const router = express.Router();
const alocacoesService = require('../services/alocacoesService');

router.get('/', async (req, res, next) => {
	try {
		const alocacoes = await alocacoesService.listAlocacoes();
		res.json(alocacoes);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res) => {
	try {
		const novaAlocacao = await alocacoesService.createAlocacao(req.body);
		res.status(201).json(novaAlocacao);
	} catch (error) {
		res.status(400).json({ erro: error.message || 'Não foi possível registrar a alocação.' });
	}
});

module.exports = router;
