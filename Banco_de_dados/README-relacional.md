# Banco relacional

O arquivo `t.sql` e uma planilha TSV exportada, nao um script SQL. A conversao foi feita para um modelo normalizado em `schema-relacional.sql`.

## Modelo

- `niveis` -> `tipos_curso` -> `cursos` -> `turmas`
- `componentes_curriculares` guarda cada componente uma vez
- `docentes` guarda cada docente uma vez
- `turma_componentes_docentes` relaciona turma, componente, docente e carga horaria
- `vw_oferta_academica` reproduz a visao tabular original com `JOIN`s

## Importar no Supabase

1. Abra o SQL Editor do Supabase.
2. Execute `schema-relacional.sql`.
3. Execute `t-relacional.sql`.

Para atualizar uma base existente com as colunas recentes de ambientes e alocações, execute `schema-relacional.sql` novamente. Os comandos adicionam apenas colunas e validações ausentes, sem apagar os registros existentes.

Se a API retornar `permission denied for table alocacoes_ambiente`, execute no SQL Editor do Supabase:

```sql
grant select, insert, update, delete on table public.alocacoes_ambiente to service_role;
grant usage, select on sequence public.alocacoes_ambiente_id_seq to service_role;
```

O arquivo `t-relacional.sql` foi gerado a partir do TSV e contem 623 linhas validas. Docentes ausentes na planilha sao gravados como `NULL`, sem criar registros ficticios.

Este modelo representa os dados academicos de `t.sql` e usa as tabelas relacionais existentes no Supabase, incluindo `alocacoes_ambiente`, `turma_componentes_docentes` e `sugestoes_manutencao`.

## Manutenção

`sugestoes_manutencao.criadoem` deve ser `timestamp with time zone` e ter `now()` como valor padrão para registrar a data e hora da solicitação. Para atualizar a tabela existente no Supabase, execute `migrar-data-sugestoes-manutencao.sql` no SQL Editor. As datas antigas, que só têm precisão de dia, serão preservadas como meia-noite no fuso de São Paulo; registros antigos sem data continuam sem data.

Os diagramas de classes da aplicação e de entidade-relacionamento da manutenção estão em `../../Diagramas/Classes/Manutencao.puml` e `../../Diagramas/Entidade e Relacionamento/Manutencao.puml`.

## Copia local das alocacoes

O arquivo `alocacoes-local.sql` contem uma copia dos dados atuais do Supabase necessarios para consultar alocacoes, incluindo ambientes, atribuicoes de aula, turmas, componentes curriculares e docentes. Ele tambem cria dados simulados: 8 horarios de 1 hora por ambiente em cada periodo (Manha, Tarde e Noite), totalizando 1.224 alocacoes para os 51 ambientes atuais. Cada horario simulado e associado a uma atribuicao de aula existente no mesmo turno. Os campos `periodo`, `horario_inicio`, `horario_fim` e `simulado` existem para essa simulacao local. O arquivo e gerado por `APP/beck_end/scripts/exportar-alocacoes.js`.

Para atualizar a copia, execute o exportador a partir de `APP/beck_end`:

```bash
node scripts/exportar-alocacoes.js
```

O exportador usa `SUPABASE_URL` e `SUPABASE_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`) do arquivo `APP/beck_end/.env` e faz somente leituras no Supabase. Para carregar localmente, crie um banco PostgreSQL separado e vazio, execute `schema-relacional.sql` e depois `alocacoes-local.sql`. Nao execute o dump de teste no banco de producao.