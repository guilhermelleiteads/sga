const express = require('express');
const router = express.Router();
const turmasService = require('../services/turmasService');

router.get('/', async (req, res, next) => {
	try {
		const turmas = await turmasService.listTurmas();
		res.json(turmas);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res) => {
	try {
		const novaTurma = await turmasService.createTurma(req.body);
		res.status(201).json(novaTurma);
	} catch (error) {
		res.status(400).json({ erro: error.message || 'Não foi possível criar a turma.' });
	}
});

module.exports = router;
