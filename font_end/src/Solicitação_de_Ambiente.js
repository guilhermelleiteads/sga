import BotaoVoltar from './Botao_voltar';
import { useEffect, useState } from 'react';
import './Alocação_de_ambiente.css';

function Solicitação_de_Ambiente() {
	const schedulesByPeriod = {
		Manhã: ['07:00 - 08:50', '09:10 - 11:00'],
		Tarde: ['12:00 - 13:50', '14:10 - 16:00'],
		Noite: ['18:30 - 20:10', '20:20 - 22:00'],
		Integral: ['07:00 - 08:50', '09:10 - 11:00', '12:00 - 13:50', '14:10 - 16:00'],
	};
	const [environments, setEnvironments] = useState([]);
	const [classes, setClasses] = useState([]);
	const [formData, setFormData] = useState({ ambienteId: '', aulaId: '', diaSemana: '', periodo: '', horario: '' });
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const selectedEnvironment = environments.find((environment) => String(environment.id) === formData.ambienteId);

	useEffect(() => {
		async function loadOptions() {
			try {
				const [environmentResponse, classResponse] = await Promise.all([fetch('/api/ambientes'), fetch('/api/aulas')]);
				const [environmentResult, classResult] = await Promise.all([environmentResponse.json(), classResponse.json()]);
				if (!environmentResponse.ok) throw new Error(environmentResult.erro || 'Não foi possível carregar os ambientes.');
				if (!classResponse.ok) throw new Error(classResult.erro || 'Não foi possível carregar as aulas.');
				setEnvironments(Array.isArray(environmentResult) ? environmentResult : []);
				setClasses(Array.isArray(classResult) ? classResult : []);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadOptions();
	}, []);

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value, ...(name === 'periodo' ? { horario: '' } : {}) }));
		setMessage('');
		setError('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setMessage('');
		setError('');
		try {
			const response = await fetch('/api/alocacoes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.erro || 'Não foi possível registrar a solicitação.');
			setMessage('Solicitação registrada com sucesso em Utilização.json.');
			setFormData({ ambienteId: '', aulaId: '', diaSemana: '', periodo: '', horario: '' });
		} catch (submitError) {
			setError(submitError.message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<main className="environment-allocation">
			<BotaoVoltar />
			<header className="allocation-header">
				<div>
					<p className="allocation-kicker">CENTRAL DE OPERAÇÕES / DOCENTE</p>
					<h1>Solicitação de ambiente</h1>
					<p>Informe a aula e o horário para registrar a utilização de um ambiente.</p>
				</div>
			</header>

			<section className="allocation-panel" aria-labelledby="request-title">
				<div className="allocation-intro">
					<p className="allocation-kicker blue">NOVA SOLICITAÇÃO</p>
					<h2 id="request-title">Reserve um ambiente para a aula.</h2>
					<p>Após o envio, os dados serão registrados no banco de utilização para consulta nos relatórios.</p>
				</div>

				<form className="allocation-form" onSubmit={handleSubmit}>
					<label htmlFor="request-environment">Ambiente
						<select id="request-environment" name="ambienteId" value={formData.ambienteId} onChange={handleChange} disabled={loading} required>
							<option value="">{loading ? 'Carregando ambientes...' : 'Selecione um ambiente'}</option>
							{environments.map((environment) => <option value={environment.id} key={environment.id}>{environment.codigo} · {environment.nome} ({environment.status})</option>)}
						</select>
					</label>
					<label htmlFor="request-class">Aula
						<select id="request-class" name="aulaId" value={formData.aulaId} onChange={handleChange} disabled={loading} required>
							<option value="">{loading ? 'Carregando aulas...' : 'Selecione a aula'}</option>
							{classes.map((classItem) => <option value={classItem.id} key={classItem.id}>{classItem.turma} · {classItem.materia} · {classItem.docente}</option>)}
						</select>
					</label>
					<label htmlFor="request-weekday">Dia da semana
						<select id="request-weekday" name="diaSemana" value={formData.diaSemana} onChange={handleChange} required>
							<option value="">Selecione o dia</option>
							{['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day) => <option value={day} key={day}>{day}</option>)}
						</select>
					</label>
					<label htmlFor="request-period">Período
						<select id="request-period" name="periodo" value={formData.periodo} onChange={handleChange} required>
							<option value="">Selecione o período</option>
							{Object.keys(schedulesByPeriod).map((period) => <option value={period} key={period}>{period}</option>)}
						</select>
					</label>
					<label htmlFor="request-schedule">Horário
						<select id="request-schedule" name="horario" value={formData.horario} onChange={handleChange} disabled={!formData.periodo} required>
							<option value="">{formData.periodo ? 'Selecione o horário' : 'Selecione o período primeiro'}</option>
							{(schedulesByPeriod[formData.periodo] || []).map((schedule) => <option value={schedule} key={schedule}>{schedule}</option>)}
						</select>
					</label>
					<button className="allocation-button" type="submit" disabled={saving || loading}>{saving ? 'Registrando...' : 'Registrar solicitação'} <span aria-hidden="true">↗</span></button>
				</form>

				{selectedEnvironment && <dl className="environment-details">
					<div><dt>Tipo</dt><dd>{selectedEnvironment.tipo}</dd></div>
					<div><dt>Capacidade</dt><dd>{selectedEnvironment.capacidade} pessoas</dd></div>
					<div><dt>Status</dt><dd>{selectedEnvironment.status}</dd></div>
				</dl>}
				{message && <p className="allocation-message allocation-success" role="status">{message}</p>}
				{error && <p className="allocation-message allocation-error" role="alert">{error}</p>}
			</section>
		</main>
	);
}

export default Solicitação_de_Ambiente;
