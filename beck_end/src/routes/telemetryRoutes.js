const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/', async (req, res) => {
	try {
		const identifier = req.body.machine_id || req.body.machine_code;
		if (!identifier) {
			return res.status(400).json({ error: 'Informe machine_id (UUID) ou machine_code.' });
		}

		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(identifier));
		const machineQuery = supabase
			.from('machines')
			.select('id')
			.eq(isUuid ? 'id' : 'machine_code', identifier)
			.maybeSingle();
		const { data: machine, error: machineError } = await machineQuery;

		if (machineError) {
			console.error('Erro ao localizar máquina da telemetria:', machineError.message);
			return res.status(500).json({ error: 'Não foi possível localizar a máquina.' });
		}
		if (!machine) {
			return res.status(404).json({ error: `Máquina não encontrada: ${identifier}` });
		}

		const { error } = await supabase
			.from('telemetry_logs')
			.insert([{
				machine_id: machine.id,
				status: req.body.status,
				timestamp: req.body.timestamp,
				oee: req.body.oee,
				current_program: req.body.current_program,
				part_count: req.body.part_count,
				spindle_speed: req.body.spindle_speed || 0,
				spindle_load: req.body.spindle_load || 0,
				feed_rate: req.body.feed_rate || 0,
				wire_tension: req.body.wire_tension || 0,
				tonnage: req.body.tonnage || 0,
				strokes_per_min: req.body.strokes_per_min || 0,
				active_alarms: req.body.active_alarms || [],
				voltage: req.body.voltage || 0,
				current: req.body.current || 0
			}]);

		if (error) {
			console.error('Erro ao gravar telemetria:', error.message);
			return res.status(500).json({ error: 'Falha ao gravar no banco de dados' });
		}

		res.status(201).json({ message: 'Dados de produção registados com sucesso!' });
	} catch (error) {
		console.error('Erro ao gravar telemetria:', error);
		res.status(500).json({ error: 'Falha ao gravar no banco de dados' });
	}
});

module.exports = router;