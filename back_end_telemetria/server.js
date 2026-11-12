require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const port = Number(process.env.PORT) || 3002;

if (!supabaseUrl || !supabaseKey) {
	console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ ok: true, service: 'sga-telemetria' });
});

app.get('/api/machines', async (req, res) => {
	try {
		const { data: machines, error } = await supabase
			.from('machines')
			.select('id, machine_code, name, type');

		if (error) throw error;

		const machinesWithCount = await Promise.all(machines.map(async (machine) => {
			const { data: latest, error: telemetryError } = await supabase
				.from('telemetry_logs')
				.select('part_count')
				.eq('machine_id', machine.id)
				.order('timestamp', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (telemetryError) throw telemetryError;
			return { ...machine, part_count: Number(latest?.part_count) || 0 };
		}));

		res.json(machinesWithCount);
	} catch (error) {
		console.error('Falha ao consultar maquinas:', error.message || error);
		res.status(500).json({ error: 'Nao foi possivel consultar as maquinas.' });
	}
});

app.post('/api/telemetry', async (req, res) => {
	try {
		const identifier = req.body.machine_id || req.body.machine_code;
		if (!identifier) {
			return res.status(400).json({ error: 'Informe machine_id ou machine_code.' });
		}

		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(identifier));
		const { data: machine, error: machineError } = await supabase
			.from('machines')
			.select('id')
			.eq(isUuid ? 'id' : 'machine_code', identifier)
			.maybeSingle();

		if (machineError) throw machineError;
		if (!machine) return res.status(404).json({ error: `Maquina nao encontrada: ${identifier}` });

		const sample = {
			machine_id: machine.id,
			status: req.body.status || null,
			timestamp: req.body.timestamp || new Date().toISOString(),
			oee: req.body.oee ?? 0,
			current_program: req.body.current_program || null,
			part_count: req.body.part_count ?? 0,
			spindle_speed: req.body.spindle_speed ?? 0,
			spindle_load: req.body.spindle_load ?? 0,
			feed_rate: req.body.feed_rate ?? 0,
			wire_tension: req.body.wire_tension ?? 0,
			tonnage: req.body.tonnage ?? 0,
			strokes_per_min: req.body.strokes_per_min ?? 0,
			active_alarms: req.body.active_alarms ?? [],
			voltage: req.body.voltage ?? 0,
			current: req.body.current ?? 0
		};

		const { error: insertError } = await supabase.from('telemetry_logs').insert([sample]);
		if (insertError) throw insertError;

		console.log(`Amostra de telemetria gravada para maquina ${machine.id}.`);
		res.status(201).json({ message: 'Telemetria gravada.' });
	} catch (error) {
		console.error('Falha ao gravar telemetria:', error.message || error);
		res.status(500).json({ error: 'Falha ao gravar telemetria no Supabase.' });
	}
});

let shuttingDown = false;
let nodeRed;

const server = app.listen(port, '0.0.0.0', () => {
	console.log(`API de telemetria ouvindo na porta ${port}.`);
	const nodeRedScript = require.resolve('node-red/red.js');
	nodeRed = spawn(process.execPath, [
		nodeRedScript,
		'--userDir', path.join(__dirname, 'node-red'),
		'--settings', path.join(__dirname, 'node-red', 'settings.js'),
		'--port', '1880'
	], {
		cwd: __dirname,
		env: { ...process.env, SGA_API_URL: `http://127.0.0.1:${port}` },
		stdio: 'inherit'
	});

	nodeRed.on('error', (error) => {
		console.error('Falha ao iniciar Node-RED:', error.message);
		process.exitCode = 1;
		server.close(() => process.exit(1));
	});
	nodeRed.on('exit', (code, signal) => {
		if (!shuttingDown) {
			console.error(`Node-RED encerrou inesperadamente (codigo ${code}, sinal ${signal}).`);
			process.exitCode = code || 1;
			server.close(() => process.exit(process.exitCode));
		}
	});

	process.on('SIGINT', () => stop('SIGINT'));
	process.on('SIGTERM', () => stop('SIGTERM'));
});

function stop(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`Sinal ${signal} recebido; encerrando API e Node-RED.`);
	if (nodeRed && !nodeRed.killed) nodeRed.kill(signal);
	server.close(() => process.exit(0));
}