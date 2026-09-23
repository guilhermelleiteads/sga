const express = require('express');
const router = express.Router();
const ambientesService = require('../services/ambientesService');

router.get('/', async (req, res, next) => {
	try {
		const ambientes = await ambientesService.listAmbientes();
		res.json(ambientes);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
