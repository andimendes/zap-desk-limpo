import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Vamos usar caminhos relativos e explícitos para garantir que o Vercel os encontre.
// Estes dois ficheiros são os que existem com certeza no seu repositório.
import LoginPage from './pages/LoginPage/index.jsx';
import CargosEPermissoesPage from './pages/CargosEPermissoes/index.jsx';

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
