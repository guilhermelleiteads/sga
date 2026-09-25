import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import BotaoVoltar from './Botao_voltar';
import './Sujestão_manutenção.css';

function Sujestão_manutenção() {
	const [environments, setEnvironments] = useState([]);
	const [loadingEnv, setLoadingEnv] = useState(true);
	const [formData, setFormData] = useState({
		nome: '',
		local: '',
		sugestao: '',
	});
	const [submitted, setSubmitted] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadEnvironments() {
			try {
				const response = await apiFetch('/api/ambientes');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar os ambientes.');
				setEnvironments(result);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoadingEnv(false);
			}
		}

		loadEnvironments();
	}, []);

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setSubmitted(false);
		setError('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSending(true);
		setError('');
		try {
			const response = await apiFetch('/api/sugestoes-manutencao', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.erro || 'Não foi possível enviar a sugestão.');
			setSubmitted(true);
			setFormData({ nome: '', local: '', sugestao: '' });
		} catch (submitError) {
			setError(submitError.message);
		} finally {
			setSending(false);
		}
	}

	return (
		<main className="maintenance-page">
			<BotaoVoltar />
			<header className="maintenance-header">
				<div>
					<p className="maintenance-kicker">CENTRAL DE SUGESTÕES</p>
					<h1>Sugestão de manutenção</h1>
				</div>
			</header>

			<section className="maintenance-panel" aria-labelledby="maintenance-title">
				<div className="panel-intro">
					<p className="section-kicker">FORMULÁRIO DE OCORRÊNCIA</p>
					<h2 id="maintenance-title">Ajude a manter o campus em movimento.</h2>
					<p>Informe os detalhes do problema ou da melhoria que você gostaria de sugerir.</p>
				</div>

				<form className="maintenance-form" onSubmit={handleSubmit}>
					<label htmlFor="nome">
						Nome
						<input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} required />
					</label>
					<label htmlFor="local">
						Local da sugestão
						<select id="local" name="local" value={formData.local} onChange={handleChange} disabled={loadingEnv} required>
							<option value="">{loadingEnv ? 'Carregando ambientes...' : 'Selecione um ambiente'}</option>
							{environments.map((environment) => <option value={`${environment.codigo} · ${environment.nome}`} key={environment.id}>{environment.codigo} · {environment.nome}</option>)}
						</select>
					</label>
					<label htmlFor="sugestao">
						Sugestão
						<textarea id="sugestao" name="sugestao" value={formData.sugestao} onChange={handleChange} rows="6" placeholder="Descreva o que precisa ser ajustado" required />
					</label>
					<div className="form-footer">
						{submitted && <p className="success-message" role="status">Sugestão enviada com sucesso.</p>}
						{error && <p className="error-message" role="alert">{error}</p>}
						<button className="submit-button" type="submit" disabled={sending || loadingEnv}>{sending ? 'Enviando...' : 'Enviar'} <span aria-hidden="true">↗</span></button>
					</div>
				</form>
			</section>
		</main>
	);
}

export default Sujestão_manutenção;
