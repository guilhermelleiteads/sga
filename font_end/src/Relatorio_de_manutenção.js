import { useEffect, useState } from 'react';
import './Relatorio_de_manutenção.css';
import BotaoVoltar from './Botao_voltar';

function formatDate(value) {
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function RelatorioDeManutencao() {
	const [suggestions, setSuggestions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadSuggestions() {
			try {
				const response = await fetch('/api/sugestoes');
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

	return (
		<main className="suggestions-database">
			<BotaoVoltar />
			<header className="database-header">
				<div>
					<p className="database-kicker">CENTRAL DE OPERAÇÕES / MANUTENÇÃO</p>
					<h1>Relatório de Manutenção</h1>
					<p>Acompanhe os pedidos enviados pela comunidade acadêmica.</p>
				</div>
				<div className="database-total"><strong>{suggestions.length}</strong><span>registros</span></div>
			</header>

			<section className="suggestions-list" aria-labelledby="suggestions-title">
				<div className="list-heading">
					<div>
						<p className="database-kicker">REGISTROS RECEBIDOS</p>
						<h2 id="suggestions-title">Sugestões recentes</h2>
					</div>
					<span className="live-indicator">● ATUALIZADO</span>
				</div>

				{loading && <p className="database-message">Carregando sugestões...</p>}
				{error && <p className="database-message error-message" role="alert">{error} Verifique se a API está em execução.</p>}
				{!loading && !error && suggestions.length === 0 && <p className="database-message">Nenhuma sugestão registrada.</p>}
				{!loading && !error && suggestions.map((suggestion) => (
					<article className="suggestion-row" key={suggestion.id}>
						<div className="suggestion-meta">
							<span className={`suggestion-status status-${suggestion.status.toLowerCase().replace(' ', '-')}`}>{suggestion.status}</span>
							<time dateTime={suggestion.criadoEm}>{formatDate(suggestion.criadoEm)}</time>
						</div>
						<div className="suggestion-content">
							<h3>{suggestion.sugestao}</h3>
							<p><strong>{suggestion.nome}</strong><span>{suggestion.local}</span></p>
						</div>
					</article>
				))}
			</section>
		</main>
	);
}

export default RelatorioDeManutencao;
