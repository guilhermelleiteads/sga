const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
	try {
		const { data: machines, error: machinesError } = await supabase
			.from('machines')
			.select('*');

		if (machinesError) {
			return res.status(500).json({ error: machinesError.message });
		}

		if (!machines || machines.length === 0) {
			return res.json([]);
		}

		const machinesWithStatus = await Promise.all(machines.map(async (machine) => {
			const { data: logs, error: logsError } = await supabase
				.from('telemetry_logs')
				.select('status, oee, current_program, part_count, spindle_load, feed_rate, spindle_speed, wire_tension, tonnage, strokes_per_min, active_alarms, voltage, current')
				.eq('machine_id', machine.id)
				.order('timestamp', { ascending: false })
				.limit(1);

			if (logsError) {
				console.error('Erro ao buscar telemetria:', logsError.message);
				throw new Error(`Não foi possível buscar telemetria da máquina ${machine.id}: ${logsError.message}`);
			}

			const latest = logs && logs.length > 0 ? logs[0] : {};

			return {
				...machine,
				status: latest.status || 'Desconectada',
				oee: latest.oee || 0,
				current_program: latest.current_program || '-',
				part_count: latest.part_count || 0,
				spindle_load: latest.spindle_load || 0,
				feed_rate: latest.feed_rate || 0,
				spindle_speed: latest.spindle_speed || 0,
				wire_tension: latest.wire_tension || 0,
				tonnage: latest.tonnage || 0,
				strokes_per_min: latest.strokes_per_min || 0,
				active_alarms: latest.active_alarms || [],
				voltage: latest.voltage || 0,
				current: latest.current || 0
			};
		}));

		res.json(machinesWithStatus);
	} catch (error) {
		console.error('Erro ao carregar máquinas e telemetria:', error);
		res.status(500).json({ error: error.message || 'Erro interno no servidor' });
	}
});

module.exports = router;