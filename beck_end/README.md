# Backend SGA

## Telemetria simulada com Node-RED

O fluxo em `node-red/flows.json` gera dados sintéticos de desenvolvimento para as máquinas cadastradas no Supabase e os envia a cada 5 segundos para a API. Esses valores não são leituras reais dos equipamentos.

1. Inicie o backend em um terminal:

   ```sh
   npm start
   ```

2. Em outro terminal, inicie o Node-RED:

   ```sh
   npm run node-red
   ```

3. Abra o editor em <http://localhost:1880>. O fluxo inicia automaticamente. O backend precisa estar acessível em `http://127.0.0.1:3001` e as máquinas precisam existir na tabela `machines`.

Para apontar o fluxo a outro endereço, defina `SGA_API_URL` no ambiente antes de iniciar o Node-RED. O editor fica limitado a `127.0.0.1`.

Os registros simulados são gravados no Supabase configurado no `.env` do backend. Pare o processo Node-RED para interromper a geração.