const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const supabase = require('./src/config/supabase');

const port = process.env.PORT || 3001;

app.listen(port, () => {
	console.log(`🚀 Servidor SGA Express ativo na porta ${port}`);
	console.log(`📡 Supabase: ${supabase ? 'Conectado com sucesso' : 'Não configurado'}`);
});
