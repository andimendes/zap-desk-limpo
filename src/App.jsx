import React, { useState } from 'react';

// Importações de Contextos
// Usando o alias '@' para garantir que os caminhos sejam resolvidos corretamente.
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Importações de Páginas
import AuthPage from '@/pages/AuthPage';
import ClientesPage from '@/pages/ClientesPage';
import ChamadosPage from '@/pages/ChamadosPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import CargosEPermissoesPage from '@/pages/admin/CargosEPermissoesPage';
import GestaoDeEquipaPage from '@/pages/admin/GestaoDeEquipaPage';

// Importações de Componentes de Layout
import MainLayout from '@/components/layout/MainLayout';
import SettingsModal from '@/components/layout/SettingsModal';

/**
 * Componente principal que gere o conteúdo da aplicação.
 * Verifica o estado de autenticação e renderiza a página correta.
 */
const AppContent = () => {
  const { session, loading, profile } = useAuth();
  const [activePage, setActivePage] = useState('chamados');
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Mostra uma mensagem de "A carregar..." enquanto a sessão está a ser verificada.
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  // Se não houver sessão ativa, mostra a página de autenticação.
  if (!session) {
    return <AuthPage />;
  }

  // Função para renderizar a página ativa com base no estado 'activePage'.
  const renderActivePage = () => {
    switch (activePage) {
      case 'clientes':
        return <ClientesPage />;
      case 'chamados':
        return <ChamadosPage />;
      case 'cargos-e-permissoes':
        return <CargosEPermissoesPage />;
      case 'gestao-de-equipa':
        return <GestaoDeEquipaPage />;
      case 'crm':
        return <PlaceholderPage title="CRM" />;
      case 'atendimento':
        return <PlaceholderPage title="Atendimento" />;
      case 'base-conhecimento':
        return <PlaceholderPage title="Base de Conhecimento" />;
      case 'financeiro':
        return <PlaceholderPage title="Financeiro" />;
      case 'relatorios':
        return <PlaceholderPage title="Relatórios e Análises" />;
      default:
        return <ChamadosPage />;
    }
  };

  return (
    <ThemeProvider>
      <MainLayout
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenSettings={() => setSettingsOpen(true)}
        // Passamos o `profile` para o MainLayout para ele saber se mostra os botões de admin
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
 * Envolve a aplicação com o AuthProvider para gerir a autenticação.
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
