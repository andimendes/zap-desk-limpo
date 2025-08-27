import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Usando o alias '@/' para criar caminhos absolutos e mais robustos.
// Isto resolve os problemas de o Vercel não encontrar os ficheiros.
import LoginPage from '@/pages/LoginPage/index.jsx';
import CargosEPermissoesPage from '@/pages/CargosEPermissoes/index.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota para a página de login */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Rota para a página de cargos e permissões */}
        <Route path="/cargos-e-permissoes" element={<CargosEPermissoesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
