import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
	const navigate = useNavigate();

	return (
		<main className="airport-dashboard">
			<header className="airport-header">
				<div className="brand-lockup">
					<span className="brand-mark" aria-hidden="true">✈</span>
					<div>
						<p className="eyebrow">SISTEMA DE GESTÃO ACADÊMICA</p>
						<h1>Campus Air</h1>
					</div>
				</div>
				<button className="login-button" type="button" onClick={() => navigate('/login')}>
					<span aria-hidden="true">◉</span>
					Login
				</button>
			</header>

			<section className="dashboard-content" aria-labelledby="dashboard-title">
				<div className="welcome-copy">
					<p className="section-kicker">PAINEL DE OPERAÇÕES · TERMINAL 01</p>
					<h2 id="dashboard-title">Próximas partidas</h2>
					<p className="intro-text">Acompanhe a operação do campus em tempo real.</p>
				</div>

				<div className="status-strip" aria-label="Resumo da operação">
					<div><strong>04</strong><span>voos programados</span></div>
					<div><strong>02</strong><span>em embarque</span></div>
					<div><strong>00</strong><span>atrasos ativos</span></div>
				</div>

				<div className="flight-board" role="table" aria-label="Programação de ambientes">
					<div className="board-heading" role="row">
						<span>HORÁRIO</span><span>DESTINO / TURMA</span><span>AMBIENTE</span><span>STATUS</span>
					</div>
					<div className="flight-row active-row" role="row">
						<strong>08:00</strong><span><b>ADS 3A</b><small>Desenvolvimento de sistemas</small></span><span className="gate">PORTÃO A12</span><span className="status boarding">EMBARQUE</span>
					</div>
					<div className="flight-row" role="row">
						<strong>09:30</strong><span><b>ADM 2B</b><small>Gestão e negócios</small></span><span className="gate">PORTÃO B04</span><span className="status on-time">NO HORÁRIO</span>
					</div>
					<div className="flight-row" role="row">
						<strong>11:00</strong><span><b>ENG 1C</b><small>Engenharia aplicada</small></span><span className="gate">PORTÃO C07</span><span className="status on-time">NO HORÁRIO</span>
					</div>
				</div>
			</section>

			<button className="maintenance-button" type="button" onClick={() => navigate('/sugestao-manutencao/dashboard')}>
				<span className="wrench-icon" aria-hidden="true">⌁</span>
				<span><strong>Sugestão de manutenção</strong><small>Relate um problema no campus</small></span>
				<span className="arrow" aria-hidden="true">↗</span>
			</button>
		</main>
	);
}

export default Home;
