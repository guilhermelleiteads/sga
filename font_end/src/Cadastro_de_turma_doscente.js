import BotaoVoltar from './Botao_voltar';
import { useState } from 'react';
import { apiFetch } from './api';
import './Cadastro_de_turma_doscente.css';

async function readResponse(response) {
	const responseText = await response.text();
	try {
		return JSON.parse(responseText);
	} catch {
		throw new Error(response.ok ? 'A API retornou uma resposta inválida.' : 'Não foi possível conectar à API. Inicie o backend e tente novamente.');
	}
}

function Cadastro_de_turma_doscente() {
	const [formData, setFormData] = useState({ codigo: '', nome: '', curso: '', turno: '', materias: [''] });
	const [teacherData, setTeacherData] = useState({ registro: '', nome: '', area: '' });
	const [saving, setSaving] = useState(false);
	const [savingTeacher, setSavingTeacher] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [teacherMessage, setTeacherMessage] = useState('');
	const [teacherError, setTeacherError] = useState('');

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setMessage('');
		setError('');
	}

	function handleTeacherChange(event) {
		const { name, value } = event.target;
		setTeacherData((currentData) => ({ ...currentData, [name]: value }));
		setTeacherMessage('');
		setTeacherError('');
	}

	function handleSubjectChange(index, value) {
		setFormData((currentData) => ({
			...currentData,
			materias: currentData.materias.map((subject, subjectIndex) => subjectIndex === index ? value : subject),
		}));
		setMessage('');
		setError('');
	}

	function addSubjectField() {
		if (formData.materias.length < 5) {
			setFormData((currentData) => ({ ...currentData, materias: [...currentData.materias, ''] }));
		}
	}

	function removeSubjectField(index) {
		if (formData.materias.length > 1) {
			setFormData((currentData) => ({ ...currentData, materias: currentData.materias.filter((subject, subjectIndex) => subjectIndex !== index) }));
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setMessage('');
		setError('');
		try {
			const response = await apiFetch('/api/turmas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});
			const result = await readResponse(response);
			if (!response.ok) throw new Error(result.erro || 'Não foi possível criar a turma.');
			setMessage('Turma criada com sucesso.');
			setFormData({ codigo: '', nome: '', curso: '', turno: '', materias: [''] });
		} catch (submitError) {
			setError(submitError.message);
		} finally {
			setSaving(false);
		}
	}

	async function handleTeacherSubmit(event) {
		event.preventDefault();
		setSavingTeacher(true);
		setTeacherMessage('');
		setTeacherError('');
		try {
			const response = await apiFetch('/api/docentes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(teacherData),
			});
			const result = await readResponse(response);
			if (!response.ok) throw new Error(result.erro || 'Não foi possível cadastrar o docente.');
			setTeacherMessage('Docente cadastrado com sucesso.');
			setTeacherData({ registro: '', nome: '', area: '' });
		} catch (submitError) {
			setTeacherError(submitError.message);
		} finally {
			setSavingTeacher(false);
		}
	}

	return (
		<main className="class-registration">
			<BotaoVoltar />
			<header className="registration-header">
				<div>
					<p className="registration-kicker">CENTRAL DE OPERAÇÕES / ACADÊMICO</p>
					<h1>Cadastro de turma/docente</h1>
					<p>Preencha todos os dados para criar uma nova turma.</p>
				</div>
			</header>
			<section className="registration-layout" aria-label="Cadastros acadêmicos">
				<article className="registration-card">
					<div className="card-heading">
						<div>
							<p className="registration-kicker blue">NOVO DOCENTE</p>
							<h2>Cadastro de docente</h2>
						</div>
					</div>
					<p className="card-description">Adicione um docente para disponibilizá-lo na atribuição de aula.</p>
					<form className="teacher-inline-form" onSubmit={handleTeacherSubmit}>
						<label htmlFor="teacher-registro">Registro
							<input id="teacher-registro" name="registro" value={teacherData.registro} onChange={handleTeacherChange} placeholder="Ex.: DOC-006" required />
						</label>
						<label htmlFor="teacher-nome">Nome completo
							<input id="teacher-nome" name="nome" value={teacherData.nome} onChange={handleTeacherChange} required />
						</label>
						<label htmlFor="teacher-area">Área de atuação
							<input id="teacher-area" name="area" value={teacherData.area} onChange={handleTeacherChange} placeholder="Ex.: Tecnologia da Informação" required />
						</label>
						<button type="submit" disabled={savingTeacher}>{savingTeacher ? 'Cadastrando...' : 'Cadastrar docente'} <span aria-hidden="true">↗</span></button>
					</form>
					{teacherMessage && <p className="registration-success" role="status">{teacherMessage}</p>}
					{teacherError && <p className="registration-error" role="alert">{teacherError}</p>}
				</article>

				<section className="registration-panel" aria-labelledby="registration-title">
				<div className="registration-intro">
					<p className="registration-kicker blue">NOVA TURMA</p>
					<h2 id="registration-title">Crie uma turma completa.</h2>
					<p>Código, nome, curso e turno são obrigatórios. As matérias podem ser cadastradas quando estiverem definidas.</p>
				</div>

				<form className="registration-form" onSubmit={handleSubmit}>
					<label htmlFor="codigo">Código da turma
						<input id="codigo" name="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ex.: ADS-4A" required />
					</label>
					<label htmlFor="nome">Nome da turma
						<input id="nome" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex.: ADS 4A" required />
					</label>
					<label htmlFor="curso">Curso
						<input id="curso" name="curso" value={formData.curso} onChange={handleChange} placeholder="Ex.: Análise e Desenvolvimento de Sistemas" required />
					</label>
					<label htmlFor="turno">Turno
						<select id="turno" name="turno" value={formData.turno} onChange={handleChange} required>
							<option value="">Selecione o turno</option>
							{['Matutino', 'Vespertino', 'Noturno', 'Integral'].map((shift) => <option value={shift} key={shift}>{shift}</option>)}
						</select>
					</label>
					<p className="subjects-heading">Matérias da turma (opcionais)</p>
					<div className="subjects-fields">
						{formData.materias.map((subject, index) => (
							<div className="subject-field" key={`subject-${index}`}>
								<label htmlFor={`materia-${index + 1}`}>Matéria {index + 1}
									<input id={`materia-${index + 1}`} value={subject} onChange={(event) => handleSubjectChange(index, event.target.value)} placeholder={`Nome da matéria ${index + 1}`} />
								</label>
								{formData.materias.length > 1 && <button className="remove-subject" type="button" onClick={() => removeSubjectField(index)} aria-label={`Remover matéria ${index + 1}`}>Remover</button>}
							</div>
						))}
					</div>
					<button className="add-subject" type="button" onClick={addSubjectField} disabled={formData.materias.length >= 5}>+ Adicionar matéria</button>
					<button className="registration-button" type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar turma'} <span aria-hidden="true">↗</span></button>
				</form>
				{message && <p className="registration-success" role="status">{message}</p>}
				{error && <p className="registration-error" role="alert">{error}</p>}
				</section>
			</section>
		</main>
	);
}

export default Cadastro_de_turma_doscente;
