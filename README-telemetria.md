# Como a telemetria funciona

## Visao geral

O fluxo atual gera **dados simulados** com o Node-RED. Ele nao le diretamente os controladores ou sensores das maquinas. Os valores de status, OEE, programa, contagem de pecas e metricas variam artificialmente para demonstracao.

Em producao, o fluxo esperado e:

1. O worker Node-RED executa o fluxo `beck_end/node-red/flows.json` continuamente.
2. A cada 5 segundos, consulta `GET /api/machines` no backend.
3. Para cada maquina retornada, gera uma amostra sintetica e envia `POST /api/telemetry`.
4. O backend identifica a maquina e grava a amostra na tabela `telemetry_logs` do Supabase.
5. O painel da Vercel consulta `GET /api/machines` a cada 5 segundos. O backend retorna cada maquina junto com seu registro de telemetria mais recente.

## Componentes

### Backend

O servico web `sga-backend` esta definido em `beck_end/render.yaml`. Ele inicia com `npm start` e usa `beck_end/server.js`, que sobe a API Express na porta informada pelo Render (ou na porta 3001 localmente).

As rotas envolvidas sao:

- `GET /api/health`: verifica se o backend foi iniciado e se a configuracao do Supabase foi carregada.
- `GET /api/machines`: lista as maquinas e consulta o registro mais recente de cada uma em `telemetry_logs`.
- `POST /api/telemetry`: recebe uma amostra, valida a maquina e insere o registro em `telemetry_logs`.

O backend precisa das variaveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas no ambiente do servico Render. A chave de service role deve ficar somente no backend, nunca no frontend.

### Worker Node-RED

O servico `sga-telemetry-worker`, tambem definido em `beck_end/render.yaml`, inicia com `npm run node-red`. O intervalo do fluxo e de 5 segundos, com primeira execucao logo apos a inicializacao.

O fluxo usa `SGA_API_URL` como endereco-base do backend. No Render, essa variavel e vinculada ao servico web `sga-backend`. Localmente, se ela nao estiver definida, o fluxo usa `http://127.0.0.1:3001`.

O Node-RED primeiro busca as maquinas cadastradas. Se nao houver maquinas, nao ha amostras para enviar. Para cada maquina, cria um payload com `machine_id`, status, timestamp e metricas, e o envia para `/api/telemetry`. As respostas dos POSTs aparecem no no de debug `Resposta do backend`.

### Frontend na Vercel

O relatorio em `font_end/src/Relatorio_de_telemetria.js` atualiza a tela a cada 5 segundos chamando `/api/machines`. O `font_end/vercel.json` encaminha `/api/*` ao backend Render e envia as demais rotas para o `index.html` da aplicacao React.

Depois de alterar esse arquivo, a Vercel precisa concluir um novo deploy para que o encaminhamento entre em vigor.

## Como rodar localmente

Abra dois terminais, ambos na pasta `beck_end`:

```sh
npm start
```

```sh
npm run node-red
```

O backend local usa a porta 3001 por padrao, e o Node-RED consulta `http://127.0.0.1:3001`. O Supabase precisa estar configurado no `.env` do backend, e a tabela `machines` deve conter maquinas.

## Diagnostico em producao

1. Abra `https://<dominio-do-backend>/api/health`. A resposta esperada e um JSON com `ok: true` e `storage: "supabase"`.
2. Abra `https://<dominio-do-backend>/api/machines`. Deve retornar um array JSON. Um array vazio significa que nao ha maquinas cadastradas; um erro indica problema de API ou de acesso ao Supabase.
3. No Render, confira os logs de inicializacao do servico web e procure `Servidor SGA Express ativo`.
4. Nos logs do worker, procure falhas nas requisicoes GET e POST. Resposta `201` no POST confirma que uma amostra foi gravada; `404` pode indicar maquina nao encontrada ou rota/servico incorreto; `500` aponta falha no backend ou no banco.
5. Na Vercel, confirme que o ultimo deploy inclui a regra `/api/:path*` do `font_end/vercel.json` e que ela aparece antes do fallback `/(.*)`.

Na verificacao feita durante a documentacao, o endereco `https://sga-backend.onrender.com/api/health` retornou `404 Cannot GET /api/health`, e `/api/machines` tambem retornou 404. Esse resultado nao corresponde ao backend deste repositorio, que define ambas as rotas. Confirme no painel do Render se o dominio pertence ao servico `sga-backend`, se o servico usa a raiz correta do repositorio e se o deploy ativo contem o backend atual. O nome de dominio pode ser diferente do exemplo configurado; use o dominio mostrado no painel do servico e ajuste o destino do rewrite da Vercel e o endereco do worker caso necessario.

## Telemetria real

Para receber leituras reais, e necessario substituir a parte de geracao aleatoria em `beck_end/node-red/flows.json` por uma integracao com os equipamentos ou com o sistema que coleta seus dados. O formato enviado pode continuar usando os campos aceitos pela rota `POST /api/telemetry`, mas os valores precisam vir da fonte real. Enquanto esse fluxo nao for integrado, os dados exibidos sao apenas simulacoes.