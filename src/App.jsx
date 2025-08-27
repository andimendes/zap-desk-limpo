import React, { useState, useEffect } from 'react'; // <-- Adicionado useEffect
// --- Importações do React Router ---
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
import ConfirmacaoPage from '@/pages/ConfirmacaoPage';

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
 */
function App() {
  // --- NOVO: Efeito para alterar o título e o favicon ---
  useEffect(() => {
    // Altera o título da aba do navegador
    document.title = 'Zap Desk';

    // Procura por um favicon existente
    let favicon = document.querySelector("link[rel*='icon']");
    
    // Se não existir, cria um novo
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(favicon);
    }
    
    // Define o tipo e o caminho da imagem para o novo favicon
    favicon.type = 'image/png';
    favicon.href = 'https://f005.backblazeb2.com/file/Zap-Contabilidade/%C3%8Dcone+-+Colorido.png';
  }, []); // O array vazio [] garante que este efeito só é executado uma vez

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
