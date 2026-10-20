import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import BotaoVoltar from './Botao_voltar';
import './Relatorio_de_atribuicoes.css';

async function loadReportData(path) {
	const response = await apiFetch(path);
	const result = await response.json();
	if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar os dados do relatório.');
	return Array.isArray(result) ? result : [];
}

function uniqueOptions(items, getValue, getLabel) {
	const values = new Map();
	items.forEach((item) => {
		const value = getValue(item);
		const label = getLabel(item);
		if (value !== undefined && value !== null && value !== '' && label) values.set(String(value), label);
	});
	return [...values.entries()].sort((first, second) => first[1].localeCompare(second[1], 'pt-BR'));
}

function Relatorio_de_atribuicoes() {
	const [assignments, setAssignments] = useState([]);
	const [environments, setEnvironments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [filters, setFilters] = useState({ docente: '', turma: '', ambiente: '', curso: '', tipoCurso: '' });

	useEffect(() => {
		async function loadAssignments() {
			try {
				const [assignmentRows, classes, environmentRows, allocationRows] = await Promise.all([
					loadReportData('/api/atribuicoes'),
					loadReportData('/api/turmas'),
					loadReportData('/api/ambientes'),
					loadReportData('/api/alocacoes-ambiente')
				]);
				const classesById = new Map(classes.map((classItem) => [String(classItem.id), classItem]));
				const environmentsByAssignment = new Map();
				allocationRows.forEach((allocation) => {
					const key = String(allocation.aulaId);
					const current = environmentsByAssignment.get(key) || [];
					current.push({ id: allocation.ambienteId, nome: allocation.ambienteNome, codigo: allocation.ambienteCodigo });
					environmentsByAssignment.set(key, current);
				});
				setEnvironments(environmentRows);
				setAssignments(assignmentRows.map((assignment) => {
					const classItem = classesById.get(String(assignment.turmaId));
					return {
						...assignment,
						turma: classItem?.nome || assignment.turma,
						turmaCodigo: classItem?.codigo || assignment.turmaCodigo,
						curso: classItem?.curso || '',
						cursoId: classItem?.cursoId || '',
						tipoCurso: classItem?.tipoCurso || '',
						tipoCursoId: classItem?.tipoCursoId || '',
						ambientes: environmentsByAssignment.get(String(assignment.id)) || []
					};
				}));
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadAssignments();
	}, []);

	const docenteOptions = uniqueOptions(assignments, (item) => item.docenteId || item.docente, (item) => item.docente);
	const turmaOptions = uniqueOptions(assignments, (item) => item.turmaId || item.turmaCodigo || item.turma, (item) => [item.turmaCodigo, item.turma].filter(Boolean).join(' · '));
	const ambienteOptions = uniqueOptions(environments, (item) => item.id, (item) => [item.codigo, item.nome, item.local].filter(Boolean).join(' · '));
	const cursoOptions = uniqueOptions(assignments, (item) => item.cursoId || item.curso, (item) => item.curso);
	const tipoCursoOptions = uniqueOptions(assignments, (item) => item.tipoCursoId || item.tipoCurso, (item) => item.tipoCurso);

	const filteredAssignments = assignments.filter((item) => (
		(!filters.docente || String(item.docenteId || item.docente) === filters.docente)
		&& (!filters.turma || String(item.turmaId || item.turmaCodigo || item.turma) === filters.turma)
		&& (!filters.ambiente || (item.ambientes || []).some((environment) => String(environment.id) === filters.ambiente))
		&& (!filters.curso || String(item.cursoId || item.curso) === filters.curso)
		&& (!filters.tipoCurso || String(item.tipoCursoId || item.tipoCurso) === filters.tipoCurso)
	));

	function updateFilter(event) {
		setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
	}

	return (
		<main className="assignment-report">
			<BotaoVoltar />
			<header className="assignment-report-header">
				<div>
					<p className="assignment-report-kicker">CAMPUS AIR / RELATÓRIOS</p>
					<h1>Relatório de atribuições</h1>
					<p>Consulte as aulas atribuídas por professor, turma, ambiente e curso.</p>
				</div>
			</header>

			<section className="assignment-report-content" aria-labelledby="assignment-report-title">
				<div className="assignment-report-heading">
					<div>
						<p className="assignment-report-kicker">DISTRIBUIÇÃO ACADÊMICA</p>
						<h2 id="assignment-report-title">Atribuições cadastradas</h2>
					</div>
					<p className="assignment-report-count" aria-live="polite"><strong>{filteredAssignments.length}</strong> de {assignments.length} registros</p>
				</div>

				<div className="assignment-report-filters" aria-label="Filtros do relatório">
					<label>Professor<select name="docente" value={filters.docente} onChange={updateFilter}><option value="">Todos</option>{docenteOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
					<label>Turma<select name="turma" value={filters.turma} onChange={updateFilter}><option value="">Todas</option>{turmaOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
					<label>Ambiente<select name="ambiente" value={filters.ambiente} onChange={updateFilter}><option value="">Todos</option>{ambienteOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
					<label>Curso<select name="curso" value={filters.curso} onChange={updateFilter}><option value="">Todos</option>{cursoOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
					<label>Tipo de curso<select name="tipoCurso" value={filters.tipoCurso} onChange={updateFilter}><option value="">Todos</option>{tipoCursoOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
					<button type="button" className="assignment-report-clear" onClick={() => setFilters({ docente: '', turma: '', ambiente: '', curso: '', tipoCurso: '' })}>Limpar filtros</button>
				</div>

				{loading && <p className="assignment-report-message">Carregando atribuições...</p>}
				{error && <p className="assignment-report-message assignment-report-error" role="alert">{error}</p>}
				{!loading && !error && filteredAssignments.length === 0 && <p className="assignment-report-message">Nenhuma atribuição corresponde aos filtros.</p>}
				{!loading && !error && filteredAssignments.length > 0 && <div className="assignment-report-table-wrap">
					<table className="assignment-report-table">
						<thead><tr><th>Professor</th><th>Turma</th><th>Matéria</th><th>Curso</th><th>Tipo de curso</th><th>Ambiente</th><th>Horário</th></tr></thead>
						<tbody>{filteredAssignments.map((item) => <tr key={item.id}>
							<td>{item.docente || 'Não atribuído'}</td>
							<td>{[item.turmaCodigo, item.turma].filter(Boolean).join(' · ') || 'Não informado'}</td>
							<td>{item.materia || 'Não informado'}</td>
							<td>{item.curso || 'Não informado'}</td>
							<td>{item.tipoCurso || 'Não informado'}</td>
							<td>{(item.ambientes || []).map((environment) => [environment.codigo, environment.nome].filter(Boolean).join(' · ')).filter(Boolean).join(', ') || 'Não alocado'}</td>
							<td>{[item.horarioInicio, item.horarioFim].filter(Boolean).join(' - ') || item.turno || 'Não informado'}</td>
						</tr>)}</tbody>
					</table>
				</div>}
			</section>
		</main>
	);
}

export default Relatorio_de_atribuicoes;