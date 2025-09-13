import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Páginas Públicas
import AuthPage from '@/pages/AuthPage';
import CadastroEmpresa from '@/pages/CadastroEmpresa';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';

// Páginas Principais
import ChamadosPage from '@/pages/ChamadosPage';
import EmpresasPage from '@/pages/EmpresasPage';
import ContatosPage from '@/pages/ContatosPage';
import CrmPage from '@/pages/CrmPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import AdminPage from '@/pages/admin/AdminPage';
import DashboardPage from '@/pages/DashboardPage';
import MasterAdminPage from '@/pages/admin/MasterAdminPage'; // NOVO: Importa a nova página

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import SettingsModal from '@/components/layout/SettingsModal';

// Componente para proteger as rotas que precisam de autenticação
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


const AppContent = () => {
  const { profile, session } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <ThemeProvider>
      <MainLayout onOpenSettings={() => setSettingsOpen(true)}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chamados" element={<ChamadosPage />} />
          <Route path="/empresas" element={<EmpresasPage />} />
          <Route path="/contatos" element={<ContatosPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          
          {/* NOVO: Rota protegida para a página do Admin Master */}
          {profile?.is_super_admin && (
            <Route path="/master-admin" element={<MasterAdminPage />} />
          )}
          
          {/* Páginas de Exemplo */}
          <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" />} />
          <Route path="/base-conhecimento" element={<PlaceholderPage title="Base de Conhecimento" />} />
          <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" />} />
          <Route path="/relatorios" element={<PlaceholderPage title="Relatórios e Análises" />} />
          
          {/* Redirecionamento Padrão */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </MainLayout>
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        userProfile={profile}
        userAuth={session?.user}
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
          {/* Rotas Públicas */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/cadastro" element={<CadastroEmpresa />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          
          {/* Rotas Protegidas */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;