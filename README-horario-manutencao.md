# Ajuste do horário das solicitações de manutenção

## Alterações

- As datas e horários exibidos no direcionamento e no relatório de manutenção são formatados no fuso de São Paulo.
- Quando o registro contém somente a data, a tela não exibe um horário incorreto, como 21h.
- Novas solicitações usam o horário padrão do banco de dados.
- Foram adicionados testes para validar a formatação de datas e horários.

## Configuração do banco

Para registrar o horário das novas solicitações, a coluna `criadoem` deve ser do tipo `timestamp with time zone`. Se ainda não foi aplicada, execute `Banco_de_dados/migrar-data-sugestoes-manutencao.sql` no SQL Editor do Supabase. Registros antigos que contêm somente a data não têm a hora original; a migração os preserva como meia-noite no fuso de São Paulo.
