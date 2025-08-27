import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './pages/AuthPage';
import ClientesPage from './pages/ClientesPage';
import ChamadosPage from './pages/ChamadosPage';
import MainLayout from './components/layout/MainLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import SettingsModal from './components/layout/SettingsModal';

// <-- CORREÇÃO: Caminho revertido para 'admin' minúsculo, com extensão .jsx -->
import CargosEPermissoesPage from './pages/admin/CargosEPermissoesPage.jsx';
import GestaoDeEquipaPage from './pages/admin/GestaoDeEquipaPage.jsx';

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
