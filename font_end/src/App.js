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
import AtribuicaoDeAula from './Atribuição_de_aula';
import AlocacaoDeAmbiente from './Alocação_de_ambiente';
import RelatorioDeAlocacoes from './Relatorio_de_alocacoes';
import RelatorioDeAmbientes from './Relatorio_de_ambientes';
import RelatorioDeTurmas from './Relatorio_de_turmas';

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
        <Route path="/Atribuição_de_turma" element={<AtribuicaoDeAula />} />
        <Route path="/Alocação_de_ambiente" element={<AlocacaoDeAmbiente />} />
        <Route path="/relatorio-alocacoes" element={<RelatorioDeAlocacoes />} />
        <Route path="/relatorio-ambientes" element={<RelatorioDeAmbientes />} />
        <Route path="/relatorio-turmas" element={<RelatorioDeTurmas />} />
      </Routes>
    </Router>
  );
  }
  export default App;
