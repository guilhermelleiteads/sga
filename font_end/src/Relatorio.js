import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Relatorio.css';

const reportOptions = [
	{ value: 'ambientes', label: 'Relatório de ambientes', description: 'Consulte a utilização dos ambientes por aula, dia e horário.', path: '/relatorio-ambientes' },
	{ value: 'turmas', label: 'Relatório de turmas', description: 'Visualize turmas cadastradas, cursos, turnos e matérias.', path: '/relatorio-turmas' },
	{ value: 'banco-sugestoes', label: 'Relatório de manutenção', description: 'Consulte todas as sugestões de manutenção enviadas.', path: '/sugestao-manutencao/dashboard' },
	{ value: 'alocacoes', label: 'Relatório de alocações', description: 'Confira a distribuição de ambientes por turma.', path: '/relatorio-alocacoes' },
];

const profileActions = [
	{ profile: 'Docente', actions: [
		{ label: 'Solicitação de ambiente', path: '/Solicitação_de_Ambiente' },
	] },
		{ profile: 'Coordenador', actions: [
		{ label: 'Alocação de ambiente', path: '/Alocação_de_ambiente' },
		{ label: 'Atribuição de aula', path: '/Atribuição_de_turma' },
		{ label: 'Cadastro de turma/docente', path: '/Cadastro_de_turma_doscente' },
	] },
	{ profile: 'Secretaria', actions: [
		{ label: 'Cadastro de turma/docente', path: '/Cadastro_de_turma_doscente' },
	] },
	{ profile: 'Manutenção', actions: [
		{ label: 'Direcionamento de manutenção', path: '/Direcionamento_de_manutenção' },
	] },
];

const profileLabels = {
	docente: 'Docente',
	coordenador: 'Coordenador',
	secretaria: 'Secretaria',
	manutencao: 'Manutenção',
};

function Relatorio() {
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedReport, setSelectedReport] = useState(reportOptions[0].value);
	const currentReport = reportOptions.find((report) => report.value === selectedReport);
	const perfil = location.state?.perfil || 'docente';
	const visibleProfiles = profileActions.filter((group) => {
		if (perfil === 'docente') return group.profile === 'Docente';
		if (perfil === 'coordenador') return group.profile === 'Coordenador';
		if (perfil === 'secretaria') return group.profile === 'Secretaria';
		return group.profile === 'Manutenção';
	});

	return (
		<main className="reports-page">
			<header className="reports-header">
				<div>
					<p className="reports-kicker">SISTEMA DE GESTÃO DE AMBIENTES</p>
					<h1>Painel de relatórios</h1>
					<p className="reports-user">Perfil: {profileLabels[perfil]}</p>
				</div>
				<nav className="profile-actions" aria-label="Ações por perfil">
					{visibleProfiles.map((profile) => (
						<div className="profile-group" key={profile.profile}>
							<div className="action-list">
								{profile.actions.map((action) => (
									<button type="button" key={action.path} onClick={() => navigate(action.path)}>{action.label} <span aria-hidden="true">↗</span></button>
								))}
							</div>
						</div>
					))}
				</nav>
				<button className="reports-exit" type="button" onClick={() => navigate('/')}>Sair <span aria-hidden="true">↗</span></button>
			</header>

			<section className="reports-content" aria-labelledby="reports-title">
				<section className="report-selector" aria-labelledby="selector-title">
					<label htmlFor="report-type" id="selector-title">Tipo de relatório</label>
					<select id="report-type" value={selectedReport} onChange={(event) => setSelectedReport(event.target.value)}>
						{reportOptions.map((report) => <option value={report.value} key={report.value}>{report.label}</option>)}
					</select>
					<div className="report-preview" aria-live="polite">
						<p className="preview-label">RELATÓRIO SELECIONADO</p>
						<h3>{currentReport.label}</h3>
						<p>{currentReport.description}</p>
						<button className="open-report" type="button" onClick={() => currentReport.path && navigate(currentReport.path)} disabled={!currentReport.path}>Abrir relatório <span aria-hidden="true">↗</span></button>
					</div>
				</section>
			</section>
		</main>
	);
}

export default Relatorio;
