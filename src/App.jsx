import React, { useState, useEffect } from 'react';

// --- Importações do React Router ---
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importações de Contextos
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

/**
 * Componente que gere o conteúdo principal da aplicação (quando o utilizador está logado).
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

  // Função que decide qual página renderizar com base no estado 'activePage'
  const renderActivePage = () => {
    switch (activePage) {
      case 'clientes': return <ClientesPage />;
      case 'chamados': return <ChamadosPage />;
      case 'configuracoes': return <AdminPage />; // <-- 2. ROTA UNIFICADA PARA TODAS AS CONFIGURAÇÕES
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
        profile={profile} // Passa o perfil para o MainLayout
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
 */
function App() {
  // Efeito para alterar o título e o favicon da página
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
          {/* Rotas Públicas (acessíveis sem login) */}
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          
          {/* Rota "Curinga" que renderiza o AppContent. 
              O AppContent decide se mostra a página de login ou o layout principal. */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
