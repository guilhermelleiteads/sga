import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './Home';
import SugestaoManutencao from './Sujestão_manutenção';
import RelatorioDeManutencao from './Relatorio_de_manutenção';
import Login from './Login';
import Relatorio from './Relatorio';
import DirecionamentoManutencao from './Direcionamento_de_manutenção';
import SolicitacaoDeAmbiente from './Solicitação_de_Ambiente';
import CadastroDeTurma from './Cadastro_de_turma_doscente';
import AtribuicaoDeTurma from './Atribuição_de_turma';
import AlocacaoDeAmbiente from './Alocação_de_ambiente';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sugestao-manutencao" element={<SugestaoManutencao />} />
        <Route path="/sugestao-manutencao/:id" element={<SugestaoManutencao />} />
        <Route path="/sugestao-manutencao/dashboard" element={<RelatorioDeManutencao />} />
    
        <Route path="/login" element={<Login/>} />
        <Route path="/Relatorio" element={<Relatorio/>} />
        <Route path="/Direcionamento_de_manutenção" element={<DirecionamentoManutencao />} />
        <Route path="/Solicitação_de_Ambiente" element={<SolicitacaoDeAmbiente />} />
        <Route path="/Cadastro_de_turma_doscente" element={<CadastroDeTurma />} />
        <Route path="/Atribuição_de_turma" element={<AtribuicaoDeTurma />} />
        <Route path="/Alocação_de_ambiente" element={<AlocacaoDeAmbiente />} />
      </Routes>
    </Router>
  );
  }
  export default App;
