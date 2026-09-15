import { useEffect, useState } from 'react';
import './Atribuição_de_aula.css';
import BotaoVoltar from './Botao_voltar';

function Atribuição_de_aula() {
	const [formData, setFormData] = useState({ turma: '', materia: '', docente: '' });
	const [saving, setSaving] = useState(false);
	const [turmas, setTurmas] = useState([]);
	const [loadingTurmas, setLoadingTurmas] = useState(true);
	const [docentes, setDocentes] = useState([]);
	const [loadingDocentes, setLoadingDocentes] = useState(true);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const selectedTurma = turmas.find((turma) => turma.nome === formData.turma);
	const materias = selectedTurma?.materias || [];

	useEffect(() => {
		async function loadTurmas() {
			try {
				const response = await fetch('/api/turmas');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar as turmas.');
				setTurmas(result);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoadingTurmas(false);
			}
		}

		loadTurmas();
	}, []);

	useEffect(() => {
		async function loadDocentes() {
			try {
				const response = await fetch('/api/docentes');
				const result = await response.json();
				if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar os docentes.');
				setDocentes(result);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoadingDocentes(false);
			}
		}

		loadDocentes();
	}, []);

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value, ...(name === 'turma' ? { materia: '' } : {}) }));
		setMessage('');
		setError('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setMessage('');
		setError('');
		try {
			const response = await fetch('/api/aulas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.erro || 'Não foi possível atribuir a aula.');
			setMessage('Aula atribuída com sucesso.');
			setFormData({ turma: '', materia: '', docente: '' });
		} catch (submitError) {
			setError(submitError.message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<main className="class-assignment">
			<BotaoVoltar />
			<header className="assignment-header">
				<div>
					<p className="assignment-kicker">CENTRAL DE OPERAÇÕES / ACADÊMICO</p>
					<h1>Atribuição de aula</h1>
					<p>Vincule uma matéria e um docente à turma selecionada.</p>
				</div>
			</header>

			<section className="assignment-panel" aria-labelledby="assignment-title">
				<div className="assignment-intro">
					<p className="assignment-kicker blue">NOVA AULA</p>
					<h2 id="assignment-title">Defina os responsáveis pela aula.</h2>
					<p>Selecione os três dados para registrar uma nova atribuição.</p>
				</div>

				<form className="assignment-form" onSubmit={handleSubmit}>
					<label htmlFor="turma">Turma
						<select id="turma" name="turma" value={formData.turma} onChange={handleChange} required disabled={loadingTurmas}>
							<option value="">{loadingTurmas ? 'Carregando turmas...' : 'Selecione a turma'}</option>
							{turmas.map((turma) => <option value={turma.nome} key={turma.id}>{turma.codigo} · {turma.nome} · {turma.turno}</option>)}
						</select>
					</label>
					<label htmlFor="materia">Matéria
						<select id="materia" name="materia" value={formData.materia} onChange={handleChange} required disabled={!selectedTurma}>
							<option value="">{selectedTurma ? 'Selecione a matéria' : 'Selecione uma turma primeiro'}</option>
							{materias.map((materia) => <option value={materia} key={materia}>{materia}</option>)}
						</select>
					</label>
					<label htmlFor="docente">Docente
						<select id="docente" name="docente" value={formData.docente} onChange={handleChange} required disabled={loadingDocentes}>
							<option value="">{loadingDocentes ? 'Carregando docentes...' : 'Selecione o docente'}</option>
							{docentes.map((docente) => <option value={docente.nome} key={docente.id}>{docente.registro} · {docente.nome} · {docente.area}</option>)}
						</select>
					</label>
					<button className="assignment-button" type="submit" disabled={saving}>{saving ? 'Atribuindo...' : 'Atribuir'} <span aria-hidden="true">↗</span></button>
				</form>
				{message && <p className="assignment-success" role="status">{message}</p>}
				{error && <p className="assignment-error" role="alert">{error}</p>}
			</section>
		</main>
	);
}

export default Atribuição_de_aula;
