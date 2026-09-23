const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

const turmasRoutes = require('./turmasRoutes');
const docentesRoutes = require('./docentesRoutes');
const ambientesRoutes = require('./ambientesRoutes');
const atribuicoesRoutes = require('./atribuicoesRoutes');
const alocacoesRoutes = require('./alocacoesRoutes');
const manutencaoRoutes = require('./manutencaoRoutes');

// Healthcheck
router.get('/health', (req, res) => {
	res.status(supabase ? 200 : 503).json({
		ok: Boolean(supabase),
		storage: supabase ? 'supabase' : 'not-configured',
		erro: supabase ? undefined : 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env do backend.'
	});
});

// Middleware que garante que o Supabase está configurado antes de executar as rotas
router.use((req, res, next) => {
	if (!supabase) {
		return res.status(503).json({
			erro: 'Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env'
		});
	}
	next();
});

// Rotas da aplicação
router.use('/turmas', turmasRoutes);
router.use('/docentes', docentesRoutes);
router.use('/ambientes', ambientesRoutes);
router.use('/atribuicoes', atribuicoesRoutes);
router.use('/alocacoes-ambiente', alocacoesRoutes);
router.use('/sugestoes-manutencao', manutencaoRoutes);

module.exports = router;
