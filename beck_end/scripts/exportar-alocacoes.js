'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Configure SUPABASE_URL e SUPABASE_KEY no arquivo APP/beck_end/.env.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const outputPath = path.resolve(__dirname, '../../Banco_de_dados/alocacoes-local.sql');
const tables = [
	{ name: 'niveis', columns: ['id', 'nome'] },
	{ name: 'tipos_curso', columns: ['id', 'nivel_id', 'nome'] },
	{ name: 'cursos', columns: ['id', 'tipo_curso_id', 'nome'] },
	{ name: 'docentes', columns: ['id', 'registro', 'nome', 'area'] },
	{ name: 'componentes_curriculares', columns: ['id', 'sigla', 'nome'] },
	{ name: 'turmas', columns: ['id', 'curso_id', 'codigo', 'nome', 'carga_horaria', 'turno', 'situacao', 'horario_inicio', 'horario_fim', 'periodo_inicio', 'periodo_fim'] },
	{ name: 'turma_componentes_docentes', columns: ['id', 'turma_id', 'componente_id', 'docente_id', 'carga_horaria'] },
	{ name: 'ambientes', columns: ['id', 'nome', 'tipo', 'local', 'capacidade', 'status'] },
	{ name: 'alocacoes_ambiente', columns: ['id', 'atribuicao_aula_id', 'ambiente_id'] }
];

async function fetchTable({ name, columns }) {
	const rows = [];
	const pageSize = 1000;

	for (let offset = 0; ; offset += pageSize) {
		const { data, error } = await supabase
			.from(name)
			.select(columns.join(','))
			.order('id')
			.range(offset, offset + pageSize - 1);

		if (error) throw new Error(`Falha ao ler ${name}: ${error.message}`);
		rows.push(...(data || []));
		if (!data || data.length < pageSize) return rows;
	}
}

function sqlValue(value) {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
	const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
	return `'${text.replace(/'/g, "''")}'`;
}

function insertStatement(table, rows) {
	if (!rows.length) return '';
	const columns = table.columns.map((column) => `"${column}"`).join(', ');
	const values = rows.map((row) => `(${table.columns.map((column) => sqlValue(row[column])).join(', ')})`).join(',\n');
	const updates = table.columns
		.filter((column) => column !== 'id')
		.map((column) => `"${column}" = EXCLUDED."${column}"`)
		.join(', ');

	return `INSERT INTO public."${table.name}" (${columns})\nVALUES\n${values}\nON CONFLICT (id) DO UPDATE SET ${updates};`;
}

function makeTime(hour) {
	const normalizedHour = ((hour % 24) + 24) % 24;
	return `${String(normalizedHour).padStart(2, '0')}:00:00`;
}

function createSimulatedAllocations(exported) {
	const records = Object.fromEntries(exported.map(({ table, rows }) => [table.name, rows]));
	const environments = records.ambientes;
	const assignments = records.turma_componentes_docentes;
	const classes = new Map(records.turmas.map((row) => [row.id, row]));
	const existingAllocations = records.alocacoes_ambiente;
	const periods = [
		{ name: 'Manhã', startHour: 7 },
		{ name: 'Tarde', startHour: 13 },
		{ name: 'Noite', startHour: 18 }
	];
	let nextId = Math.max(0, ...existingAllocations.map((row) => Number(row.id))) + 1;
	const simulated = [];

	for (const period of periods) {
		const matchingAssignments = assignments.filter((assignment) =>
			classes.get(assignment.turma_id)?.turno?.trim().toLocaleLowerCase('pt-BR') === period.name.toLocaleLowerCase('pt-BR')
		);
		if (!matchingAssignments.length) {
			throw new Error(`Nenhuma atribuição de aula encontrada para o turno ${period.name}.`);
		}

		for (const environment of environments) {
			for (let slot = 0; slot < 8; slot += 1) {
				const assignment = matchingAssignments[(environment.id * 8 + slot) % matchingAssignments.length];
				const startHour = period.startHour + slot;
				simulated.push({
					id: nextId++,
					atribuicao_aula_id: assignment.id,
					ambiente_id: environment.id,
					periodo: period.name,
					horario_inicio: makeTime(startHour),
					horario_fim: makeTime(startHour + 1),
					simulado: true
				});
			}
		}
	}

	return simulated;
}

function simulatedInsertStatement(rows) {
	const columns = ['id', 'atribuicao_aula_id', 'ambiente_id', 'periodo', 'horario_inicio', 'horario_fim', 'simulado'];
	const values = rows.map((row) => `(${columns.map((column) => sqlValue(row[column])).join(', ')})`).join(',\n');
	const updates = columns
		.filter((column) => column !== 'id')
		.map((column) => `"${column}" = EXCLUDED."${column}"`)
		.join(', ');

	return `INSERT INTO public."alocacoes_ambiente" (${columns.map((column) => `"${column}"`).join(', ')})\nVALUES\n${values}\nON CONFLICT (id) DO UPDATE SET ${updates};`;
}

async function main() {
	const exported = [];
	for (const table of tables) {
		exported.push({ table, rows: await fetchTable(table) });
	}

	const statements = exported
		.map(({ table, rows }) => insertStatement(table, rows))
		.filter(Boolean);
	const simulatedAllocations = createSimulatedAllocations(exported);
	statements.push(simulatedInsertStatement(simulatedAllocations));
	const sequenceUpdates = tables.map(({ name }) =>
		`SELECT setval(pg_get_serial_sequence('public.${name}', 'id'), COALESCE((SELECT MAX(id) FROM public."${name}"), 1), EXISTS (SELECT 1 FROM public."${name}"));`
	);
	const sql = [
		'-- Export gerado do Supabase. Execute somente em um banco local separado.',
		'-- Crie as tabelas antes executando schema-relacional.sql.',
		'BEGIN;',
		...statements,
		...sequenceUpdates,
		'COMMIT;',
		''
	].join('\n\n');

	fs.writeFileSync(outputPath, sql, 'utf8');
	console.log(`Export concluído em ${outputPath}`);
	for (const { table, rows } of exported) console.log(`${table.name}: ${rows.length} registro(s)`);
	console.log(`alocações simuladas: ${simulatedAllocations.length}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});