import { useNavigate } from 'react-router-dom';
import './Botao_voltar.css';

function BotaoVoltar() {
	const navigate = useNavigate();

	return <button className="shared-back-button" type="button" onClick={() => navigate(-1)}>← Voltar</button>;
}

export default BotaoVoltar;
