const express = require('express');
const router = express.Router();
const manutencaoService = require('../services/manutencaoService');

router.get('/', async (req, res, next) => {
	try {
		const sugestoes = await manutencaoService.listSugestoes();
		res.json(sugestoes);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res) => {
	try {
		const novaSugestao = await manutencaoService.createSugestao(req.body);
		res.status(201).json(novaSugestao);
	} catch (error) {
		res.status(400).json({ erro: error.message || 'Não foi possível registrar a sugestão.' });
	}
});

router.patch('/:id', async (req, res) => {
	try {
		const atualizada = await manutencaoService.updateSugestaoStatus(req.params.id, req.body);
		if (!atualizada) {
			return res.status(404).json({ erro: 'Sugestão não encontrada.' });
		}
		res.json(atualizada);
	} catch (error) {
		res.status(400).json({ erro: error.message || 'Não foi possível atualizar o status da sugestão.' });
	}
});

module.exports = router;
