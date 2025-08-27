import React, 'useState', 'useEffect' } from 'react';

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
import UpdatePasswordPage from '@/pages/UpdatePasswordPage'; // --- 1. ALTERAÇÃO AQUI: IMPORTAR A NOVA PÁGINA ---

// Importações de Componentes de Layout
import MainLayout from '@/components/layout/MainLayout';
import SettingsModal from '@/components/layout/SettingsModal';

/**
 * Componente que gere o conteúdo principal da aplicação (quando o utilizador está logado).
 */
const AppContent = () => {
  // ... (O restante do seu componente AppContent permanece exatamente igual)
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
  // --- O seu efeito para alterar o título e o favicon permanece igual ---
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
          {/* Rotas Públicas */}
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          
          {/* --- 2. ALTERAÇÃO AQUI: ADICIONAR A NOVA ROTA --- */}
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          
          {/* Rota "Curinga" que lida com o login ou o conteúdo principal da app */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;