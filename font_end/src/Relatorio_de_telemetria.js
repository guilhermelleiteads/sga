import { useEffect, useState } from 'react';
import BotaoVoltar from './Botao_voltar';
import { apiFetch } from './api';
import './Relatorio_de_telemetria.css';

function RelatorioDeTelemetria() {
	const [machines, setMachines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [updatedAt, setUpdatedAt] = useState(null);

	useEffect(() => {
		let isMounted = true;

		async function loadMachines() {
			try {
				const response = await apiFetch('/api/machines');
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || 'Não foi possível carregar a telemetria.');
				if (!Array.isArray(result)) throw new Error('A API retornou dados inválidos.');
				if (isMounted) {
					setMachines(result);
					setError('');
					setUpdatedAt(new Date());
				}
			} catch (loadError) {
				if (isMounted) setError(loadError.message || 'Falha ao conectar à API de telemetria.');
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		loadMachines();
		const intervalId = window.setInterval(loadMachines, 5000);
		return () => {
			isMounted = false;
			window.clearInterval(intervalId);
		};
	}, []);

	return <main className="telemetry-report">
		<BotaoVoltar />
		<header className="telemetry-header">
			<div>
				<p className="telemetry-kicker">CAMPUS AIR / RELATÓRIOS</p>
				<h1>Telemetria de máquinas</h1>
				<p>Status de operação e indicadores do chão de fábrica.</p>
			</div>
			<span className="telemetry-live"><i aria-hidden="true" />Atualização a cada 5 segundos</span>
		</header>

		<section className="telemetry-content" aria-labelledby="telemetry-title">
			<div className="telemetry-title-row">
				<div><p className="telemetry-kicker">MONITORAMENTO</p><h2 id="telemetry-title">Máquinas</h2></div>
				{updatedAt && <p>Atualizado às <strong>{updatedAt.toLocaleTimeString('pt-BR')}</strong></p>}
			</div>

			{loading && <p className="telemetry-message">Carregando telemetria...</p>}
			{error && <p className="telemetry-message telemetry-error" role="alert">Erro de conexão: {error}</p>}
			{!loading && !error && machines.length === 0 && <p className="telemetry-message">Nenhuma máquina cadastrada.</p>}

			{!loading && machines.length > 0 && <div className="telemetry-grid">
				{machines.map((machine) => {
					const name = String(machine.name || '');
					const normalizedName = name.toLocaleLowerCase('pt-BR');
					const isErosion = normalizedName.includes('erosão') || normalizedName.includes('erosao');
					const isPress = normalizedName.includes('prensa');
					const isRunning = machine.status === 'Usinando' || machine.status === 'Estampando';
					const oee = Math.min(100, Math.max(0, Number(machine.oee) || 0));
					const metrics = isErosion
						? [['Tensão elétrica', `${machine.voltage ?? 0} V`], ['Corrente', `${machine.current ?? 0} A`], ['Tensão do fio', `${machine.wire_tension ?? 0} g`]]
						: isPress
							? [['Força', `${machine.tonnage ?? 0} T`], ['Cadência', `${machine.strokes_per_min ?? 0} GPM`]]
							: [['Rotação', `${machine.spindle_speed ?? 0} RPM`], ['Avanço', `${machine.feed_rate ?? 0} mm/m`], ['Carga no eixo', `${machine.spindle_load ?? 0}%`]];

					return <article className={`telemetry-machine${isRunning ? ' is-running' : ''}`} key={machine.id}>
						<div className="telemetry-machine-heading">
							<div><h3>{machine.name || 'Máquina sem identificação'}</h3><span>{isErosion ? 'Erosão a fio' : isPress ? 'Estamparia' : 'Usinagem CNC'}</span></div>
							<strong className={isRunning ? 'telemetry-status-running' : ''}>{machine.status || 'Desconectada'}</strong>
						</div>
						<div className="telemetry-facts">
							<p><span>Programa</span><strong>{machine.current_program || '-'}</strong></p>
							<p><span>Peças produzidas</span><strong>{machine.part_count ?? 0} un</strong></p>
						</div>
						<div className="telemetry-oee">
							<div><span>OEE global</span><strong>{oee}%</strong></div>
							<div className="telemetry-progress" role="progressbar" aria-label={`OEE de ${machine.name || 'máquina'}`} aria-valuenow={oee} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${oee}%` }} /></div>
						</div>
						<div className="telemetry-metrics">
							<h4>Telemetria em tempo real</h4>
							<div>{metrics.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>
						</div>
						<footer>Controlador: {machine.controller || 'Não informado'}</footer>
					</article>;
				})}
			</div>}
		</section>
	</main>;
}

export default RelatorioDeTelemetria;