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

O arquivo `t-relacional.sql` foi gerado a partir do TSV e contem 623 linhas validas. Docentes ausentes na planilha sao gravados como `NULL`, sem criar registros ficticios.

Este modelo representa os dados academicos de `t.sql` e usa as tabelas relacionais existentes no Supabase, incluindo `alocacoes_ambiente`, `turma_componentes_docentes` e `sugestoes_manutencao`.