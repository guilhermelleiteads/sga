# Backend de telemetria SGA

Servico Node.js separado que inicia uma API local e o Node-RED. O flow gera amostras simuladas e a API grava os registros no Supabase; o backend principal nao e necessario para a ingestao.

## Configuracao local

Crie um arquivo `.env` nesta pasta com as credenciais do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

Instale e inicie o servico:

```sh
npm ci
npm start
```

O comando inicia a API e o Node-RED. O flow executa a cada cinco segundos e insere registros na tabela `telemetry_logs`; portanto, executar localmente tambem altera o banco.

## Render

O Blueprint em `beck_end/render.yaml` define o servico web `sga-telemetria` com esta pasta como raiz. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nas variaveis privadas do servico. O health check fica disponivel em `/health`.

Os dados sao sinteticos. Para telemetria real, altere o flow `node-red/flows.json` para ler dos equipamentos ou da fonte de dados real.