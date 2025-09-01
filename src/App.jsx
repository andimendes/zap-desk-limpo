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
import AdminPage from '@/pages/admin/AdminPage'; 
import DashboardPage from '@/pages/DashboardPage';

// Layouts
import MainLayout from '@/components/layout/MainLayout.jsx';
// --- 1. A IMPORTAÇÃO FOI "DESLIGADA" ---
// import SettingsModal from '@/components/layout/SettingsModal';

/**
 * Componente que gere o conteúdo principal da aplicação (quando o utilizador está logado).
 */
const AppContent = () => {
  const { session, loading, profile } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  if (!session) {
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chamados" element={<ChamadosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" />} />
          <Route path="/base-conhecimento" element={<PlaceholderPage title="Base de Conhecimento" />} />
          <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" />} />
          <Route path="/relatorios" element={<PlaceholderPage title="Relatórios e Análises" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </MainLayout>
      
      {/* --- 2. O COMPONENTE FOI "DESLIGADO" --- */}
      {/*
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        userProfile={profile}
        userAuth={session.user}
      />
      */}
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
          <Route path="/login" element={<AuthPage />} />
          <Route path="/confirmacao" element={<ConfirmacaoPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;