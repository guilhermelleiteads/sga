## Table `niveis`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `nome` | `text` |  Unique |

## Table `tipos_curso`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `nivel_id` | `int8` |  |
| `nome` | `text` |  |

## Table `cursos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `tipo_curso_id` | `int8` |  |
| `nome` | `text` |  |

## Table `docentes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `nome` | `text` |  Unique |
| `registro` | `text` |  Nullable Unique |
| `area` | `text` |  Nullable |

## Table `componentes_curriculares`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `sigla` | `text` |  |
| `nome` | `text` |  |

## Table `turmas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `curso_id` | `int8` |  |
| `codigo` | `text` |  Unique |
| `carga_horaria` | `int4` |  |
| `turno` | `text` |  |
| `situacao` | `text` |  |
| `horario_inicio` | `time` |  Nullable |
| `horario_fim` | `time` |  Nullable |
| `periodo_inicio` | `date` |  Nullable |
| `periodo_fim` | `date` |  Nullable |
| `nome` | `text` |  |

## Table `turma_componentes_docentes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `turma_id` | `int8` |  |
| `componente_id` | `int8` |  |
| `docente_id` | `int8` |  Nullable |
| `carga_horaria` | `int4` |  |

## Table `ambientes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `nome` | `varchar` |  |
| `tipo` | `varchar` |  |
| `local` | `varchar` |  |
| `capacidade` | `int4` |  |
| `status` | `varchar` |  |

## Table `alocacoes_ambiente`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `atribuicao_aula_id` | `int8` |  |
| `ambiente_id` | `int8` |  |

## Table `sugestoes_manutencao`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `ambiente_id` | `int8` |  |
| `nome` | `varchar` |  |
| `sujestao` | `varchar` |  |
| `status` | `varchar` |  |
| `criadoem` | `date` |  Nullable |

