import React, { useState } from 'react';
// --- NOVO: Importações do React Router ---
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importações de Contextos
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Importações de Páginas
import AuthPage from '@/pages/AuthPage';
import ClientesPage from '@/pages/ClientesPage';
import ChamadosPage from '@/pages/ChamadosPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import CargosEPermissoesPage from '@/pages/admin/CargosEPermissoesPage';
import GestaoDeEquipaPage from '@/pages/admin/GestaoDeEquipePage';
// --- NOVO: Importa a nova página de confirmação ---
import ConfirmacaoPage from '@/pages/ConfirmacaoPage';

// Importações de Componentes de Layout
import MainLayout from '@/components/layout/MainLayout';
import SettingsModal from '@/components/layout/SettingsModal';

/**
 * Componente que gere o conteúdo principal da aplicação (quando o utilizador está logado).
 * O código aqui permanece praticamente o mesmo.
 */
const AppContent = () => {
  const { session, loading, profile } = useAuth();
  const [activePage, setActivePage] = useState('chamados');
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  if (!session) {
    return <AuthPage />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'clientes': return <ClientesPage />;
      case 'chamados': return <ChamadosPage />;
      case 'cargos-e-permissoes': return <CargosEPermissoesPage />;
      case 'gestao-de-equipa': return <GestaoDeEquipaPage />;
      case 'crm': return <PlaceholderPage title="CRM" />;
      case 'atendimento': return <PlaceholderPage title="Atendimento" />;
      case 'base-conhecimento': return <PlaceholderPage title="Base de Conhecimento" />;
      case 'financeiro': return <PlaceholderPage title="Financeiro" />;
      case 'relatorios': return <PlaceholderPage title="Relatórios e Análises" />;
      default: return <ChamadosPage />;
    }
  };

  return (
    <ThemeProvider>
      <MainLayout
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenSettings={() => setSettingsOpen(true)}
        profile={profile}
      >
        {renderActivePage()}
      </MainLayout>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        userProfile={profile}
        userAuth={session.user}
      />
    </ThemeProvider>
  );
};

/**
 * Componente raiz da aplicação.
 * Agora envolve a aplicação com o Router e define as rotas principais.
 */
function App() {
  return (
    <AuthProvider>
      {/* --- NOVO: BrowserRouter envolve toda a aplicação --- */}
      <BrowserRouter>
        {/* --- NOVO: Routes gere qual componente mostrar com base no URL --- */}
        <Routes>
          {/* Rota para a nossa nova página de confirmação */}
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          
          {/* Rota "catch-all": Qualquer outro URL carrega a aplicação principal */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
