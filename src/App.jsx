import React from 'react';

// --- Importações do React Router ---
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importações de Contextos
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Importações de Páginas
import AuthPage from '@/pages/AuthPage';
import ClientesPage from '@/pages/ClientesPage';
import ChamadosPage from '@/pages/ChamadosPage';
import CrmPage from '@/pages/CrmPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import CargosEPermissoesPage from '@/pages/admin/CargosEPermissoesPage';
import GestaoDeEquipaPage from '@/pages/admin/GestaoDeEquipePage';
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
  // CORREÇÃO: A declaração do useState estava incorreta.
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  if (!session) {
    return <AuthPage />;
  }
  
  return (
    <ThemeProvider>
      <MainLayout onOpenSettings={() => setSettingsOpen(true)}>
        <Routes>
          <Route path="/chamados" element={<ChamadosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          
          {/* Rotas de Administração */}
          <Route path="/cargos-e-permissoes" element={<CargosEPermissoesPage />} />
          <Route path="/gestao-de-equipa" element={<GestaoDeEquipaPage />} />

          {/* Rotas Futuras */}
          <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" />} />
          <Route path="/base-conhecimento" element={<PlaceholderPage title="Base de Conhecimento" />} />
          <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" />} />
          <Route path="/relatorios" element={<PlaceholderPage title="Relatórios e Análises" />} />
          
          {/* Rota Padrão: Redireciona para /chamados se nenhuma outra corresponder */}
          <Route path="*" element={<Navigate to="/chamados" replace />} />
        </Routes>
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
  React.useEffect(() => {
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
          
          {/* Rota "Curinga" que renderiza o AppContent. */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;