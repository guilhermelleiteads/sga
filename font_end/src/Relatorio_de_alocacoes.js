import { useEffect, useState } from 'react';
import './Relatorio_de_alocacoes.css';
import Botao_voltar from './Botao_voltar';

function Relatorio_de_alocacoes() {
	const [allocations, setAllocations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadAllocations() {
			try {
				const response = await fetch('/api/utilizacao');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar as utilizações.');
				setAllocations(result);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadAllocations();
	}, []);

	return (
		<main className="allocation-report">
			<Botao_voltar />
			<header className="allocation-report-header">
				<div>
					<p className="allocation-report-kicker">CAMPUS AIR / RELATÓRIOS</p>
					<h1>Relatório de alocações</h1>
					<p>Consulte a utilização dos ambientes por aula e horário.</p>
				</div>
				<div className="allocation-report-total"><strong>{allocations.length}</strong><span>utilizações</span></div>
			</header>

			<section className="allocation-report-content" aria-labelledby="allocation-report-title">
				<div className="allocation-report-heading">
					<div>
						<p className="allocation-report-kicker">BANCO DE UTILIZAÇÃO</p>
						<h2 id="allocation-report-title">Ambientes alocados</h2>
					</div>
				</div>

				{loading && <p className="allocation-report-message">Carregando utilizações...</p>}
				{error && <p className="allocation-report-message allocation-report-error" role="alert">{error}</p>}
				{!loading && !error && allocations.length === 0 && <p className="allocation-report-message">Nenhuma utilização registrada.</p>}
				{!loading && !error && allocations.length > 0 && <div className="allocation-table-wrapper">
					<table className="allocation-table">
						<thead><tr><th>Ambiente</th><th>Aula</th><th>Dia</th><th>Período</th><th>Horário</th></tr></thead>
						<tbody>{allocations.map((allocation) => <tr key={allocation.id}>
							<td>{allocation.ambienteNome || allocation.ambienteId}</td>
							<td>{allocation.aulaDescricao || allocation.aulaId}</td>
							<td>{allocation.diaSemana}</td>
							<td>{allocation.periodo || 'Não informado'}</td>
							<td>{allocation.horario}</td>
						</tr>)}</tbody>
					</table>
				</div>}
			</section>
		</main>
	);
}

export default Relatorio_de_alocacoes;
