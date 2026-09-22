const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join(__dirname, 't.sql');
const outputPath = process.argv[3] || path.join(__dirname, 't-relacional.sql');

function sqlString(value) {
	return value === null || value === undefined || value === ''
		? 'NULL'
		: `'${String(value).replace(/'/g, "''")}'`;
}

function parseDate(value) {
	if (!value) return null;
	const [day, month, year] = value.split('/');
	return `${year}-${month}-${day}`;
}

function parseTime(value) {
	return value ? value.trim().slice(0, 8) : null;
}

function parseRow(line) {
	const columns = line.replace(/^\uFEFF/, '').split('\t').map((column) => column.trim());
	if (columns.length < 17) return null;

	const [nivel, tipoCurso, curso, cargaCurso, , , turma, turno, situacao, horarioInicio, horarioFim, periodoInicio, periodoFim, , docente, , sigla, componente, cargaComponente] = columns;
	if (!nivel || !tipoCurso || !curso || !turma || !turno || !situacao || !sigla || !componente) return null;

	return {
		nivel,
		tipoCurso,
		curso,
		cargaCurso: Number(cargaCurso),
		turma,
		turno,
		situacao,
		horarioInicio: parseTime(horarioInicio),
		horarioFim: parseTime(horarioFim),
		periodoInicio: parseDate(periodoInicio),
		periodoFim: parseDate(periodoFim),
		docente: docente || null,
		sigla,
		componente,
		cargaComponente: Number(cargaComponente),
	};
}

const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/).filter(Boolean);
const rows = lines.slice(1).map(parseRow).filter(Boolean);
const sql = ['begin;', ''];

for (const row of rows) {
	sql.push(`insert into niveis (nome) values (${sqlString(row.nivel)}) on conflict (nome) do nothing;`);
	sql.push(`insert into tipos_curso (nivel_id, nome) select id, ${sqlString(row.tipoCurso)} from niveis where nome = ${sqlString(row.nivel)} on conflict (nivel_id, nome) do nothing;`);
	sql.push(`insert into cursos (tipo_curso_id, nome) select id, ${sqlString(row.curso)} from tipos_curso where nome = ${sqlString(row.tipoCurso)} and nivel_id = (select id from niveis where nome = ${sqlString(row.nivel)}) on conflict (tipo_curso_id, nome) do nothing;`);
	sql.push(`insert into turmas (curso_id, codigo, carga_horaria, turno, situacao, horario_inicio, horario_fim, periodo_inicio, periodo_fim) select c.id, ${sqlString(row.turma)}, ${row.cargaCurso}, ${sqlString(row.turno)}, ${sqlString(row.situacao)}, ${sqlString(row.horarioInicio)}, ${sqlString(row.horarioFim)}, ${sqlString(row.periodoInicio)}, ${sqlString(row.periodoFim)} from cursos c join tipos_curso tc on tc.id = c.tipo_curso_id where c.nome = ${sqlString(row.curso)} and tc.nome = ${sqlString(row.tipoCurso)} and tc.nivel_id = (select id from niveis where nome = ${sqlString(row.nivel)}) on conflict (codigo) do update set carga_horaria = excluded.carga_horaria, turno = excluded.turno, situacao = excluded.situacao, horario_inicio = excluded.horario_inicio, horario_fim = excluded.horario_fim, periodo_inicio = excluded.periodo_inicio, periodo_fim = excluded.periodo_fim;`);

	if (row.docente) {
		sql.push(`insert into docentes (nome) values (${sqlString(row.docente)}) on conflict (nome) do nothing;`);
	}
	sql.push(`insert into componentes_curriculares (sigla, nome) values (${sqlString(row.sigla)}, ${sqlString(row.componente)}) on conflict (sigla, nome) do nothing;`);
	sql.push(`insert into turma_componentes_docentes (turma_id, componente_id, docente_id, carga_horaria) select t.id, cc.id, ${row.docente ? `(select id from docentes where nome = ${sqlString(row.docente)})` : 'NULL'}, ${row.cargaComponente} from turmas t cross join componentes_curriculares cc where t.codigo = ${sqlString(row.turma)} and cc.sigla = ${sqlString(row.sigla)} and cc.nome = ${sqlString(row.componente)} on conflict do nothing;`);
}

sql.push('', 'commit;', '');
fs.writeFileSync(outputPath, sql.join('\n'), 'utf8');
console.log(`Conversão concluída: ${rows.length} linhas válidas em ${outputPath}`);