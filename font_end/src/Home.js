import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './Home.css';

function normalizeText(value) {
	return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isCurrentSchedule(schedule, now) {
	const [start, end] = String(schedule || '').split('-').map((time) => time.trim());
	if (!start || !end) return false;
	const [startHour, startMinute] = start.split(':').map(Number);
	const [endHour, endMinute] = end.split(':').map(Number);
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	return currentMinutes >= startHour * 60 + startMinute && currentMinutes < endHour * 60 + endMinute;
}

function Home() {
	const navigate = useNavigate();
	const [usages, setUsages] = useState([]);
	const [environments, setEnvironments] = useState([]);
	const [now, setNow] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadUsage() {
			try {
				const [usageResponse, environmentResponse] = await Promise.all([fetch('/api/utilizacao'), fetch('/api/ambientes')]);
				const [usageResult, environmentResult] = await Promise.all([usageResponse.json(), environmentResponse.json()]);
				if (!usageResponse.ok) throw new Error(usageResult.erro || 'Não foi possível carregar a utilização dos ambientes.');
				if (!environmentResponse.ok) throw new Error(environmentResult.erro || 'Não foi possível carregar os ambientes.');
				setUsages(Array.isArray(usageResult) ? usageResult : []);
				setEnvironments(Array.isArray(environmentResult) ? environmentResult : []);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadUsage();
		const refreshClock = window.setInterval(() => setNow(new Date()), 60000);
		return () => window.clearInterval(refreshClock);
	}, []);

	const currentUsages = useMemo(() => {
		const currentDay = normalizeText(now.toLocaleDateString('pt-BR', { weekday: 'long' }));
		const environmentById = new Map(environments.map((environment) => [String(environment.id), environment]));
		return usages.filter((usage) => {
			const environment = environmentById.get(String(usage.ambienteId));
			return environment && normalizeText(usage.diaSemana) === currentDay && isCurrentSchedule(usage.horario, now);
		}).map((usage) => ({ ...usage, environment: environmentById.get(String(usage.ambienteId)) }));
	}, [environments, now, usages]);

	const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

	return (
		<main className="airport-dashboard">
			<header className="airport-header">
				<div className="brand-lockup">
					<span className="brand-mark" aria-hidden="true">⊞</span>
					<div>
						<p className="eyebrow">SISTEMA DE GESTÃO DE AMBIENTES</p>
						<h1>SENAI</h1>
					</div>
				</div>
				<button className="login-button" type="button" onClick={() => navigate('/login')}>
					<span aria-hidden="true">◉</span>
					Login
				</button>
			</header>

			<section className="dashboard-content" aria-labelledby="dashboard-title">
				<div className="welcome-copy">
					<p className="intro-text">Aulas em andamento às {currentTime}</p>
				</div>

				<div className="flight-board" role="table" aria-label="Programação de ambientes">
					<div className="board-heading" role="row">
						<span>HORÁRIO</span><span>DESTINO / TURMA</span><span>AMBIENTE</span><span>STATUS</span>
					</div>
					{loading && <p className="board-message">Carregando utilização...</p>}
					{error && <p className="board-message board-error" role="alert">{error}</p>}
					{!loading && !error && currentUsages.length === 0 && <p className="board-message">Nenhum ambiente ocupado neste horário.</p>}
					{!loading && !error && currentUsages.map((usage) => <div className="flight-row active-row" role="row" key={usage.id}>
						<strong>{usage.horario}</strong><span><b>{usage.aulaDescricao || usage.aulaId}</b><small>{usage.diaSemana} · {usage.periodo || 'Período não informado'}</small></span><span className="gate">{usage.environment.codigo} · {usage.environment.nome}</span><span className="status boarding">EM ANDAMENTO</span>
					</div>)}
				</div>
			</section>

			<button className="maintenance-button" type="button" onClick={() => navigate('/sugestao-manutencao')}>
				<span className="wrench-icon" aria-hidden="true">⌁</span>
				<span><strong>Sugestão de manutenção</strong><small>Relate um problema no campus</small></span>
				<span className="arrow" aria-hidden="true">↗</span>
			</button>
		</main>
	);
}

export default Home;
