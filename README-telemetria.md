# Como a telemetria funciona

## Visao geral

O backend separado em `back_end_telemetria` executa uma API Node.js e o Node-RED no mesmo servico. O flow gera **dados simulados**; ele nao le diretamente os controladores ou sensores das maquinas.

Em producao, o fluxo esperado e:

1. O servico web separado `sga-telemetria` inicia `back_end_telemetria/server.js` no Render.
2. O servidor inicia o Node-RED usando `back_end_telemetria/node-red/flows.json`.
3. A cada 5 segundos, o flow consulta `GET /api/machines`, gera uma amostra por maquina e envia `POST /api/telemetry` para a API na mesma aplicacao.
4. A API grava as amostras na tabela `telemetry_logs` do Supabase.
5. O painel da Vercel consulta `/api/machines` no backend principal para exibir as leituras mais recentes.

## Componentes

### Backend

O servico web `sga-backend` esta definido em `beck_end/render.yaml`. Ele inicia com `npm start` e usa `beck_end/server.js`, que sobe a API Express na porta informada pelo Render (ou na porta 3001 localmente).

As rotas envolvidas sao:

- `GET /api/health`: verifica se o backend foi iniciado e se a configuracao do Supabase foi carregada.
- `GET /api/machines`: lista as maquinas e consulta o registro mais recente de cada uma em `telemetry_logs`.
- `POST /api/telemetry`: recebe uma amostra, valida a maquina e insere o registro em `telemetry_logs`.

O backend precisa das variaveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas no ambiente do servico Render. A chave de service role deve ficar somente no backend, nunca no frontend.

### Backend de telemetria no Render

O servico web `sga-telemetria`, definido no Blueprint `beck_end/render.yaml`, usa a pasta `back_end_telemetria` como raiz, executa `npm ci` e inicia com `npm start`. O `server.js` sobe a API local e inicia o runtime Node-RED como processo filho. O editor Node-RED fica limitado a localhost; as requisicoes do flow passam pela API na porta do servico.

Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nas variaveis de ambiente privadas do servico `sga-telemetria`. A chave service role deve ficar somente no backend, nunca no frontend. O flow esta configurado para executar a cada cinco segundos.

O endpoint `/health` e o health check do servico. Os logs do Render incluem a inicializacao do Node-RED e mensagens de resposta aos POSTs. Sem maquinas cadastradas, nenhum registro e gravado.

O servico e do tipo web, nao worker. Em planos gratuitos do Render, servicos web podem entrar em suspensao quando ficam sem trafego, interrompendo os ciclos ate o servico acordar novamente. Para coleta realmente continua, use um plano que mantenha o servico ativo.

### Frontend na Vercel

O relatorio em `font_end/src/Relatorio_de_telemetria.js` atualiza a tela a cada 5 segundos chamando `/api/machines`. O `font_end/vercel.json` encaminha `/api/*` ao backend Render e envia as demais rotas para o `index.html` da aplicacao React.

Depois de alterar esse arquivo, a Vercel precisa concluir um novo deploy para que o encaminhamento entre em vigor.

## Como rodar localmente

Para rodar a API e o Node-RED localmente, entre em `back_end_telemetria`, crie um `.env` com as credenciais do Supabase e execute:

```sh
npm ci
npm start
```

O comando inicia os dois processos. O flow grava amostras no Supabase a cada cinco segundos enquanto estiver ativo; a tabela `machines` precisa conter maquinas.

## Diagnostico em producao

1. Abra `https://<dominio-do-backend>/api/health`. A resposta esperada e um JSON com `ok: true` e `storage: "supabase"`.
2. Abra `https://<dominio-do-backend>/api/machines`. Deve retornar um array JSON. Um array vazio significa que nao ha maquinas cadastradas; um erro indica problema de API ou de acesso ao Supabase.
3. No Render, confira os logs de inicializacao do servico web e procure `Servidor SGA Express ativo`.
4. Nos logs de `sga-telemetria`, confira a inicializacao do Node-RED e os status HTTP dos POSTs. `201` indica gravacao aceita; `404` ou `500` aponta erro na API ou no Supabase.
5. Na Vercel, confirme que o ultimo deploy inclui a regra `/api/:path*` do `font_end/vercel.json` e que ela aparece antes do fallback `/(.*)`.

Na verificacao feita anteriormente, `https://sga-backend.onrender.com/api/health` e `/api/machines` retornaram 404. Isso nao impede `sga-telemetria` de gravar diretamente no Supabase, mas impede o painel de ler os dados pelo backend principal. Confirme no Render se o dominio pertence ao servico `sga-backend` e se o deploy ativo contem as rotas deste repositorio. O destino do rewrite da Vercel deve usar o dominio real desse servico.

## Telemetria real

Para receber leituras reais, substitua a funcao `Gerar metricas simuladas` em `back_end_telemetria/node-red/flows.json` por uma integracao com os equipamentos ou com o sistema que coleta seus dados. Enquanto isso nao for feito, os dados gravados e exibidos sao simulacoes.