import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Importações de Páginas
import AuthPage from '@/pages/AuthPage';
import ClientesPage from '@/pages/ClientesPage';
import ChamadosPage from '@/pages/ChamadosPage';
import CrmPage from '@/pages/CrmPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import AdminPage from '@/pages/admin/AdminPage'; // <-- 1. IMPORTAR A PÁGINA UNIFICADA
import ConfirmacaoPage from '@/pages/ConfirmacaoPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';

// Importações de Componentes de Layout
import MainLayout from '@/components/layout/MainLayout';
import SettingsModal from '@/components/layout/SettingsModal';

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
      case 'configuracoes': return <AdminPage />; // <-- 2. ROTA UNIFICADA
      case 'crm': return <CrmPage />;
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
  useEffect(() => {
    document.title = 'Zap Desk';
    let favicon = document.querySelector("link[rel*='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = 'https://f005.backblazeb2.com/file/Zap-Contabilidade/%C3%8Dcone+-+Colorido.png';
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
