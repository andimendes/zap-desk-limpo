import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Páginas Públicas
import AuthPage from '@/pages/AuthPage';

// Páginas Principais
import ChamadosPage from '@/pages/ChamadosPage';
import EmpresasPage from '@/pages/EmpresasPage';
import ContatosPage from '@/pages/ContatosPage.jsx'; 
import CrmPage from '@/pages/CrmPage'; // RE-ADICIONADO
import PlaceholderPage from '@/pages/PlaceholderPage';
import AdminPage from '@/pages/admin/AdminPage'; 
import DashboardPage from '@/pages/DashboardPage';

// Layouts
import MainLayout from '@/components/layout/MainLayout.jsx';
import SettingsModal from '@/components/layout/SettingsModal';

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
          
          {/* --- ROTAS CORRIGIDAS E RE-ADICIONADAS --- */}
          <Route path="/empresas" element={<EmpresasPage />} />
          <Route path="/contatos" element={<ContatosPage />} /> 
          <Route path="/crm" element={<CrmPage />} /> {/* ROTA CRM DE VOLTA */}

          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" />} />
          <Route path="/base-conhecimento" element={<PlaceholderPage title="Base de Conhecimento" />} />
          <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" />} />
          <Route path="/relatorios" element={<PlaceholderPage title="Relatórios e Análises" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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

function App() {
  React.useEffect(() => {
    document.title = 'Zap Desk';
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;