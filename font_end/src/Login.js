import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ login: '', senha: '' });
	const [error, setError] = useState('');

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setError('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		try {
			const response = await fetch('/logins.json');
			const users = await response.json();
			const user = users.find((item) => item.login === formData.login && item.senha === formData.senha);

			if (!user) {
				setError('Login ou senha inválidos.');
				return;
			}

			navigate('/Relatorio', { state: { perfil: user.perfil, login: user.login } });
		} catch {
			setError('Não foi possível validar o login. Tente novamente.');
		}
	}

	return (
		<main className="login-page">
			<section className="login-panel" aria-labelledby="login-title">
				<div className="login-heading">
					<p className="login-kicker">SISTEMA DE GESTÃO DE AMBIENTES</p>
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
						{error && <p className="login-error" role="alert">{error}</p>}
						<button className="login-submit" type="submit">Logar <span aria-hidden="true">↗</span></button>
					</div>
				</form>
			</section>
		</main>
	);
}

export default Login;
