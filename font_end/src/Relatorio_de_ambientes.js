import { useEffect, useMemo, useState } from 'react';
import './Relatorio_de_ambientes.css';
import BotaoVoltar from './Botao_voltar';

function Relatorio_de_ambientes() {
	const [usages, setUsages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadUsages() {
			try {
				const response = await fetch('/api/utilizacao');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar a utilização dos ambientes.');
				setUsages(Array.isArray(result) ? result : []);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadUsages();
	}, []);

	const environmentSummary = useMemo(() => {
		const summary = new Map();
		usages.forEach((usage) => {
			const key = usage.ambienteId || usage.ambienteNome || 'não informado';
			const current = summary.get(key) || { name: usage.ambienteNome || usage.ambienteId || 'Ambiente não informado', total: 0 };
			current.total += 1;
			summary.set(key, current);
		});
		return Array.from(summary.values()).sort((first, second) => second.total - first.total);
	}, [usages]);

	return (
		<main className="environment-report">
			<BotaoVoltar />
			<header className="environment-report-header">
				<div>
					<p className="environment-report-kicker">CAMPUS AIR / RELATÓRIOS</p>
					<h1>Relatório de ambientes</h1>
					<p>Veja como os ambientes estão sendo utilizados nas aulas.</p>
				</div>
			</header>

			<section className="environment-report-content" aria-labelledby="environment-report-title">
				<div className="environment-report-heading">
					<div>
						<p className="environment-report-kicker">BANCO DE UTILIZAÇÃO</p>
						<h2 id="environment-report-title">Ocupação dos ambientes</h2>
					</div>
					<div className="environment-report-stat"><strong>{environmentSummary.length}</strong><span>ambientes utilizados</span></div>
				</div>

				{loading && <p className="environment-report-message">Carregando utilizações...</p>}
				{error && <p className="environment-report-message environment-report-error" role="alert">{error}</p>}
				{!loading && !error && usages.length === 0 && <p className="environment-report-message">Nenhuma utilização registrada.</p>}

				{!loading && !error && usages.length > 0 && <>
					<div className="environment-summary" aria-label="Resumo por ambiente">
						{environmentSummary.map((environment) => <article className="environment-summary-card" key={environment.name}>
							<span>{environment.name}</span>
							<strong>{environment.total}</strong>
							<small>{environment.total === 1 ? 'utilização' : 'utilizações'}</small>
						</article>)}
					</div>

					<div className="environment-table-wrapper">
						<table className="environment-table">
							<thead><tr><th>Ambiente</th><th>Aula</th><th>Dia</th><th>Horário</th><th>Período</th></tr></thead>
							<tbody>{usages.map((usage) => <tr key={usage.id}>
								<td>{usage.ambienteNome || usage.ambienteId}</td>
								<td>{usage.aulaDescricao || usage.aulaId}</td>
								<td>{usage.diaSemana || 'Não informado'}</td>
								<td>{usage.horario || 'Não informado'}</td>
								<td>{usage.periodo || 'Não informado'}</td>
							</tr>)}</tbody>
						</table>
					</div>
				</>}
			</section>
		</main>
	);
}

export default Relatorio_de_ambientes;
