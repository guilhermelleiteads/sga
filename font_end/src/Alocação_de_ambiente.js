import { useEffect, useState } from 'react';
import './Alocação_de_ambiente.css';
import BotaoVoltar from './Botao_voltar';

function Alocação_de_ambiente() {
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
		async function loadData() {
			try {
				const [environmentResponse, classResponse] = await Promise.all([fetch('/api/ambientes'), fetch('/api/aulas')]);
				const [environmentResult, classResult] = await Promise.all([environmentResponse.json(), classResponse.json()]);
				if (!environmentResponse.ok) throw new Error(environmentResult.erro || 'Não foi possível carregar os ambientes.');
				if (!classResponse.ok) throw new Error(classResult.erro || 'Não foi possível carregar as aulas.');
				setEnvironments(environmentResult);
				setClasses(classResult);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadData();
	}, []);

	function handleChange(event) {
		const { name, value, type, checked } = event.target;
		setFormData((currentData) => ({
			...currentData,
			[name]: type === 'checkbox' ? checked : value,
			...(name === 'periodo' ? { horario: '' } : {}),
		}));
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
			if (!response.ok) throw new Error(result.erro || 'Não foi possível registrar a alocação.');
			setMessage('Alocação registrada com sucesso.');
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
					<p className="allocation-kicker">CENTRAL DE OPERAÇÕES / ACADÊMICO</p>
					<h1>Alocação de ambiente</h1>
					<p>Consulte um ambiente disponível para realizar a alocação.</p>
				</div>
			</header>

			<section className="allocation-panel" aria-labelledby="allocation-title">
				<div className="allocation-intro">
					<p className="allocation-kicker blue">CONSULTA DE AMBIENTES</p>
					<h2 id="allocation-title">Organize o período da aula.</h2>
					<p>Selecione o ambiente, horário, dia e aula que ocupará este período.</p>
				</div>

				<form className="allocation-form" onSubmit={handleSubmit}>
					<label htmlFor="environment">Ambiente
						<select id="environment" name="ambienteId" value={formData.ambienteId} onChange={handleChange} disabled={loading} required>
							<option value="">{loading ? 'Carregando ambientes...' : 'Selecione um ambiente'}</option>
							{environments.map((environment) => <option value={environment.id} key={environment.id}>{environment.codigo} · {environment.nome}</option>)}
						</select>
					</label>
					<label htmlFor="class">Aula
						<select id="class" name="aulaId" value={formData.aulaId} onChange={handleChange} disabled={loading} required>
							<option value="">{loading ? 'Carregando aulas...' : 'Selecione a aula'}</option>
							{classes.map((classItem) => <option value={classItem.id} key={classItem.id}>{classItem.turma} · {classItem.materia} · {classItem.docente}</option>)}
						</select>
					</label>
					<label htmlFor="weekday">Dia da semana
						<select id="weekday" name="diaSemana" value={formData.diaSemana} onChange={handleChange} required>
							<option value="">Selecione o dia</option>
							{['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day) => <option value={day} key={day}>{day}</option>)}
						</select>
					</label>
					<label htmlFor="schedule">Horário
						<select id="schedule" name="horario" value={formData.horario} onChange={handleChange} disabled={!formData.periodo} required>
							<option value="">{formData.periodo ? 'Selecione o horário' : 'Selecione o período primeiro'}</option>
							{(schedulesByPeriod[formData.periodo] || []).map((schedule) => <option value={schedule} key={schedule}>{schedule}</option>)}
						</select>
					</label>
					<label htmlFor="period">Período
						<select id="period" name="periodo" value={formData.periodo} onChange={handleChange} required>
							<option value="">Selecione o período</option>
							{['Manhã', 'Tarde', 'Integral', 'Noite'].map((period) => <option value={period} key={period}>{period}</option>)}
						</select>
					</label>
					<button className="allocation-button" type="submit" disabled={saving || loading}>{saving ? 'Salvando...' : 'Alocar'} <span aria-hidden="true">↗</span></button>
				</form>

				{selectedEnvironment && <dl className="environment-details">
					<div><dt>Tipo</dt><dd>{selectedEnvironment.tipo}</dd></div>
					<div><dt>Capacidade</dt><dd>{selectedEnvironment.capacidade} pessoas</dd></div>
					<div><dt>Status</dt><dd>{selectedEnvironment.status}</dd></div>
				</dl>}
				{message && <p className="allocation-message allocation-success" role="status">{message}</p>}
				{error && <p className="allocation-message allocation-error" role="alert">{error}</p>}
				{!loading && !error && environments.length === 0 && <p className="allocation-message">Nenhum ambiente cadastrado.</p>}
			</section>
		</main>
	);
}

export default Alocação_de_ambiente;
