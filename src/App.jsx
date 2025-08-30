import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Páginas Públicas
import AuthPage from '@/pages/AuthPage';
import ConfirmacaoPage from '@/pages/ConfirmacaoPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';

// Páginas Principais
import ChamadosPage from '@/pages/ChamadosPage';
import ClientesPage from '@/pages/ClientesPage';
import CrmPage from '@/pages/CrmPage';
import PlaceholderPage from '@/pages/PlaceholderPage';

// --- 1. IMPORTAR A PÁGINA ADMIN ---
import AdminPage from '@/pages/admin/AdminPage'; 

// Layouts
import MainLayout from '@/components/layout/MainLayoutCorrigido';
import SettingsModal from '@/components/layout/SettingsModal';

/**
 * Componente que gere o conteúdo principal da aplicação (quando o utilizador está logado).
 */
const AppContent = () => {
  const { session, loading, profile } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  // Se não houver sessão, o utilizador é redirecionado para a página de autenticação
  if (!session) {
    // Usamos um componente Navigate dentro de uma rota para lidar com o redirecionamento
    return (
        <Routes>
            <Route path="*" element={<AuthPage />} />
        </Routes>
    );
  }
  
  return (
    <ThemeProvider>
      <MainLayout onOpenSettings={() => setSettingsOpen(true)}>
        <Routes>
          <Route path="/chamados" element={<ChamadosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          
          {/* --- 2. ESTA É A ROTA QUE FALTAVA --- */}
          {/* Qualquer URL que comece com /admin/ será renderizado pela AdminPage.
              O '*' (wildcard) permite que as rotas internas do AdminPanel funcionem. */}
          <Route path="/admin/*" element={<AdminPage />} />

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
          {/* Rotas Públicas */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          
          {/* Rota "Curinga" que renderiza o AppContent */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;