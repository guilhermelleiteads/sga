import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BotaoVoltar from './Botao_voltar';
import './Criar_usuario.css';

const registeredUsersKey = 'sga-usuarios';
const profileOptions = [
	{ value: 'docente', label: 'Docente' },
	{ value: 'coordenador', label: 'Coordenador' },
	{ value: 'secretaria', label: 'Secretaria' },
	{ value: 'manutencao', label: 'Manutenção' },
];

function CriarUsuario() {
	const navigate = useNavigate();
	const location = useLocation();
	const [formData, setFormData] = useState({ login: '', senha: '', confirmarSenha: '', perfil: 'docente' });
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const isCoordinator = location.state?.perfil === 'coordenador';

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setMessage('');
		setError('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setMessage('');
		setError('');

		const login = formData.login.trim();
		if (formData.senha !== formData.confirmarSenha) {
			setError('As senhas não coincidem.');
			return;
		}

		try {
			const storedUsers = JSON.parse(window.localStorage.getItem(registeredUsersKey) || '[]');
			const users = Array.isArray(storedUsers) ? storedUsers : [];
			const response = await fetch('/logins.json');
			if (!response.ok) throw new Error('Não foi possível validar os usuários existentes. Tente novamente.');
			const defaultUsers = await response.json();
			const loginExists = [...defaultUsers, ...users].some((user) => user.login.toLowerCase() === login.toLowerCase());
			if (loginExists) {
				setError('Este login já está cadastrado.');
				return;
			}

			const newUser = { login, senha: formData.senha, perfil: formData.perfil };
			window.localStorage.setItem(registeredUsersKey, JSON.stringify([...users, newUser]));
			setFormData({ login: '', senha: '', confirmarSenha: '', perfil: 'docente' });
			setMessage('Usuário criado com sucesso. Ele já pode entrar com as credenciais cadastradas.');
		} catch {
			setError('Não foi possível salvar o usuário neste navegador.');
		}
	}

	if (!isCoordinator) {
		return (
			<main className="user-creation-page">
				<BotaoVoltar />
				<section className="user-creation-panel">
					<p className="user-creation-kicker">ACESSO RESTRITO</p>
					<h1>Área do coordenador</h1>
					<p>Entre pelo painel com um perfil de coordenador para criar usuários.</p>
					<button type="button" className="user-creation-button" onClick={() => navigate('/login')}>Ir para o login <span aria-hidden="true">↗</span></button>
				</section>
			</main>
		);
	}

	return (
		<main className="user-creation-page">
			<BotaoVoltar />
			<header className="user-creation-header">
				<p className="user-creation-kicker">CENTRAL DE OPERAÇÕES / ACESSOS</p>
				<h1>Criar usuário</h1>
				<p>Cadastre as credenciais e o perfil de acesso da equipe.</p>
			</header>
			<section className="user-creation-panel" aria-labelledby="user-creation-title">
				<div className="user-creation-section-heading">
					<span aria-hidden="true">+</span>
					<div>
						<p className="user-creation-kicker">NOVO ACESSO</p>
						<h2 id="user-creation-title">Dados do usuário</h2>
					</div>
				</div>
				<form className="user-creation-form" onSubmit={handleSubmit}>
					<label htmlFor="new-user-login">Login
						<input id="new-user-login" name="login" value={formData.login} onChange={handleChange} autoComplete="username" required />
					</label>
					<label htmlFor="new-user-profile">Perfil
						<select id="new-user-profile" name="perfil" value={formData.perfil} onChange={handleChange}>
							{profileOptions.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
						</select>
					</label>
					<label htmlFor="new-user-password">Senha
						<input id="new-user-password" name="senha" type="password" value={formData.senha} onChange={handleChange} autoComplete="new-password" minLength="6" required />
					</label>
					<label htmlFor="new-user-confirm-password">Confirmar senha
						<input id="new-user-confirm-password" name="confirmarSenha" type="password" value={formData.confirmarSenha} onChange={handleChange} autoComplete="new-password" minLength="6" required />
					</label>
					<div className="user-creation-footer">
						{error && <p className="user-creation-error" role="alert">{error}</p>}
						{message && <p className="user-creation-success" role="status">{message}</p>}
						<button className="user-creation-button" type="submit">Criar usuário <span aria-hidden="true">↗</span></button>
					</div>
				</form>
			</section>
		</main>
	);
}

export default CriarUsuario;