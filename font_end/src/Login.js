import { useState } from 'react';
import './Login.css';

function Login() {
	const [formData, setFormData] = useState({ login: '', senha: '' });
	const [submitted, setSubmitted] = useState(false);

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setSubmitted(false);
	}

	function handleSubmit(event) {
		event.preventDefault();
		setSubmitted(true);
	}

	return (
		<main className="login-page">
			<section className="login-panel" aria-labelledby="login-title">
				<div className="login-heading">
					<p className="login-kicker">CAMPUS AIR · ACESSO</p>
					<h1 id="login-title">Entrar no painel</h1>
					<p>Identifique-se para acessar as operações do campus.</p>
				</div>

				<form className="login-form" onSubmit={handleSubmit}>
					<label htmlFor="usuario-login">
						Login
						<input id="usuario-login" name="login" type="text" value={formData.login} onChange={handleChange} required />
					</label>
					<label htmlFor="senha-login">
						Senha
						<input id="senha-login" name="senha" type="password" value={formData.senha} onChange={handleChange} required />
					</label>
					<div className="login-footer">
						{submitted && <p className="login-success" role="status">Dados enviados com sucesso.</p>}
						<button className="login-submit" type="submit">Logar <span aria-hidden="true">↗</span></button>
					</div>
				</form>
			</section>
		</main>
	);
}

export default Login;
