import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import './Relatorio_de_alocacoes.css';
import BotaoVoltar from './Botao_voltar';

async function readAllocationsResponse(response) {
	const responseText = await response.text();
	try {
		return JSON.parse(responseText);
	} catch {
		throw new Error(response.ok ? 'A API retornou uma resposta inválida.' : 'Não foi possível conectar à API. Inicie o backend e tente novamente.');
	}
}

function Relatorio_de_alocacoes() {
	const [allocations, setAllocations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadAllocations() {
			try {
				const response = await apiFetch('/api/alocacoes-ambiente');
				const result = await readAllocationsResponse(response);
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar as utilizações.');
				setAllocations(Array.isArray(result) ? result : []);
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
			<BotaoVoltar />
			<header className="allocation-report-header">
				<div>
					<p className="allocation-report-kicker">CAMPUS AIR / RELATÓRIOS</p>
					<h1>Relatório de alocações</h1>
					<p>Consulte a utilização dos ambientes por aula e horário.</p>
				</div>
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
