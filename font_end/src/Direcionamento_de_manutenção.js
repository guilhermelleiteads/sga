import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import './Direcionamento_de_manutenção.css';
import BotaoVoltar from './Botao_voltar';

function formatDate(value) {
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function Direcionamento_de_manutenção() {
	const [suggestions, setSuggestions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [savingId, setSavingId] = useState(null);

	useEffect(() => {
		async function loadSuggestions() {
			try {
				const response = await apiFetch('/api/sugestoes-manutencao');
				if (!response.ok) throw new Error('Não foi possível carregar as sugestões.');
				setSuggestions(await response.json());
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadSuggestions();
	}, []);

	async function updateSuggestion(suggestion, event) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		setSavingId(suggestion.id);
		setError('');
		try {
				const response = await apiFetch(`/api/sugestoes-manutencao/${suggestion.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: formData.get('status'),
					comentario: formData.get('comentario'),
				}),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.erro || 'Não foi possível salvar o direcionamento.');
			setSuggestions((currentSuggestions) => currentSuggestions.map((item) => item.id === result.id ? result : item));
		} catch (saveError) {
			setError(saveError.message);
		} finally {
			setSavingId(null);
		}
	}

	const columns = [
		{ status: 'Pendente', title: 'Pendente' },
		{ status: 'Em análise', title: 'Em análise' },
		{ status: 'Concluída', title: 'Concluída' },
	];

	return (
		<main className="maintenance-routing">
			<BotaoVoltar />
			<header className="routing-header">
				<div>
					<p className="routing-kicker">CENTRAL DE OPERAÇÕES / MANUTENÇÃO</p>
					<h1>Direcionamento de manutenção</h1>
					<p>Todas as sugestões recebidas ficam disponíveis para encaminhamento.</p>
				</div>
				<div className="routing-total"><strong>{suggestions.length}</strong><span>sugestões recebidas</span></div>
			</header>

			<section className="routing-list" aria-labelledby="routing-title">
				<div className="routing-list-heading">
					<div>
						<p className="routing-kicker">FILA DE ATENDIMENTO</p>
						<h2 id="routing-title">Sugestões para direcionar</h2>
					</div>
					<span className="routing-live">● DADOS ATUALIZADOS</span>
				</div>

				{loading && <p className="routing-message">Carregando sugestões...</p>}
				{error && <p className="routing-message routing-error" role="alert">{error} Verifique se a API está em execução.</p>}
				{!loading && !error && suggestions.length === 0 && <p className="routing-message">Nenhuma sugestão registrada.</p>}
				{!loading && !error && suggestions.length > 0 && <div className="routing-columns">
					{columns.map((column) => {
						const columnSuggestions = suggestions.filter((suggestion) => suggestion.status === column.status);
						return (
							<section className="routing-column" key={column.status} aria-labelledby={`column-${column.status}`}>
								<header className="routing-column-header">
									<h3 id={`column-${column.status}`}>{column.title}</h3>
									<strong>{columnSuggestions.length}</strong>
								</header>
								{columnSuggestions.length === 0 && <p className="empty-column">Nenhuma sugestão</p>}
								{columnSuggestions.map((suggestion) => (
									<article className="routing-card" key={suggestion.id}>
										<div className="routing-card-meta">
											<span className="routing-id">#{suggestion.id}</span>
											<time dateTime={suggestion.criadoEm}>{formatDate(suggestion.criadoEm)}</time>
										</div>
										<h4>{suggestion.sugestao}</h4>
										<p><strong>Solicitante</strong>{suggestion.nome}</p>
										<p><strong>Local</strong>{suggestion.local}</p>
										<form className="routing-update-form" onSubmit={(event) => updateSuggestion(suggestion, event)}>
											<label htmlFor={`status-${suggestion.id}`}>Status
												<select id={`status-${suggestion.id}`} name="status" defaultValue={suggestion.status}>
													{columns.map((statusColumn) => <option value={statusColumn.status} key={statusColumn.status}>{statusColumn.title}</option>)}
												</select>
											</label>
											<label htmlFor={`comentario-${suggestion.id}`}>Comentário do direcionamento
												<textarea id={`comentario-${suggestion.id}`} name="comentario" defaultValue={suggestion.comentario || ''} rows="3" placeholder="Descreva o encaminhamento dado" />
											</label>
											<button type="submit" disabled={savingId === suggestion.id}>{savingId === suggestion.id ? 'Salvando...' : 'Salvar direcionamento'}</button>
										</form>
									</article>
								))}
							</section>
						);
					})}
				</div>}
			</section>
		</main>
	);
}

export default Direcionamento_de_manutenção;
