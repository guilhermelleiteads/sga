const express = require('express');
const router = express.Router();
const atribuicoesService = require('../services/atribuicoesService');

router.get('/', async (req, res, next) => {
	try {
		const atribuicoes = await atribuicoesService.listAtribuicoes();
		res.json(atribuicoes);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res) => {
	try {
		const novaAtribuicao = await atribuicoesService.createAtribuicao(req.body);
		res.status(201).json(novaAtribuicao);
	} catch (error) {
		res.status(400).json({ erro: error.message || 'Não foi possível registrar a atribuição.' });
	}
});

module.exports = router;
