import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
	const navigate = useNavigate();

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
					<p className="intro-text">Acompanhe Aulas em andamento</p><br></br>
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

			<button className="maintenance-button" type="button" onClick={() => navigate('/sugestao-manutencao')}>
				<span className="wrench-icon" aria-hidden="true">⌁</span>
				<span><strong>Sugestão de manutenção</strong><small>Relate um problema no campus</small></span>
				<span className="arrow" aria-hidden="true">↗</span>
			</button>
		</main>
	);
}

export default Home;
