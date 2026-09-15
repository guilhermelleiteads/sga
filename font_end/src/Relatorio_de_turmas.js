import { useEffect, useMemo, useState } from 'react';
import './Relatorio_de_turmas.css';
import BotaoVoltar from './Botao_voltar';

function Relatorio_de_turmas() {
	const [classes, setClasses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadClasses() {
			try {
				const response = await fetch('/api/turmas');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar as turmas.');
				setClasses(Array.isArray(result) ? result : []);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadClasses();
	}, []);

	const shiftSummary = useMemo(() => classes.reduce((summary, classItem) => {
		const shift = classItem.turno || 'Não informado';
		summary[shift] = (summary[shift] || 0) + 1;
		return summary;
	}, {}), [classes]);

	return (
		<main className="class-report">
			<BotaoVoltar />
			<header className="class-report-header">
				<div>
					<p className="class-report-kicker">CAMPUS AIR / RELATÓRIOS</p>
					<h1>Relatório de turmas</h1>
					<p>Consulte as turmas cadastradas, seus cursos, turnos e matérias.</p>
				</div>
			</header>

			<section className="class-report-content" aria-labelledby="class-report-title">
				<div className="class-report-heading">
					<div>
						<p className="class-report-kicker">BANCO DE TURMAS</p>
						<h2 id="class-report-title">Turmas acadêmicas</h2>
					</div>
					<div className="class-report-stat"><strong>{Object.keys(shiftSummary).length}</strong><span>turnos registrados</span></div>
				</div>

				{loading && <p className="class-report-message">Carregando turmas...</p>}
				{error && <p className="class-report-message class-report-error" role="alert">{error}</p>}
				{!loading && !error && classes.length === 0 && <p className="class-report-message">Nenhuma turma cadastrada.</p>}

				{!loading && !error && classes.length > 0 && <>
					<div className="class-shift-summary" aria-label="Resumo de turmas por turno">
						{Object.entries(shiftSummary).map(([shift, total]) => <article className="class-shift-card" key={shift}>
							<span>{shift}</span>
							<strong>{total}</strong>
							<small>{total === 1 ? 'turma' : 'turmas'}</small>
						</article>)}
					</div>

					<div className="class-table-wrapper">
						<table className="class-table">
							<thead><tr><th>Código</th><th>Turma</th><th>Curso</th><th>Turno</th><th>Matérias</th></tr></thead>
							<tbody>{classes.map((classItem) => <tr key={classItem.id}>
								<td><strong>{classItem.codigo || 'Não informado'}</strong></td>
								<td>{classItem.nome || 'Não informado'}</td>
								<td>{classItem.curso || 'Não informado'}</td>
								<td><span className="class-shift-label">{classItem.turno || 'Não informado'}</span></td>
								<td>{Array.isArray(classItem.materias) && classItem.materias.length ? classItem.materias.join(' · ') : 'Nenhuma matéria informada'}</td>
							</tr>)}</tbody>
						</table>
					</div>
				</>}
			</section>
		</main>
	);
}

export default Relatorio_de_turmas;
