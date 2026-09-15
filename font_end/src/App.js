import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './Home';
import Sujestão_manutenção from './Sujestão_manutenção';
import Login from './Login';
import Relatorio from './Relatorio';
import Direcionamento_de_manutenção from './Direcionamento_de_manutenção';
import Solicitação_de_Ambiente from './Solicitação_de_Ambiente';
import Cadastro_de_turma_doscente from './Cadastro_de_turma_doscente';
import Atribuição_de_turma from './Atribuição_de_turma';
import Alocação_de_ambiente from './Alocação_de_ambiente';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sugestao-manutencao/:id" element={<Sujestão_manutenção />} />
    
        <Route path="/login" element={<Login/>} />
        <Route path="/Relatorio" element={<Relatorio/>} />
        <Route path="/Direcionamento_de_manutenção" element={<Direcionamento_de_manutenção/>} />
        <Route path="/Solicitação_de_Ambiente" element={<Solicitação_de_Ambiente/>} />
        <Route path="/Cadastro_de_turma_doscente" element={<Cadastro_de_turma_doscente/>} />
        <Route path="/Atribuição_de_turma" element={<Atribuição_de_turma/>} />
        <Route path="/Alocação_de_ambiente" element={<Alocação_de_ambiente/>} />
      </Routes>
    </Router>
  );
  }
  export default App;
