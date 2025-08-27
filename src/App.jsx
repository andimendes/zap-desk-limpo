import React, { useState } from 'react';
// ATENÇÃO: Verifique se o ficheiro 'supabaseClient.js' está na pasta 'src' e foi enviado para o GitHub.
import { supabase } from './supabaseClient';
// ATENÇÃO: Verifique se a pasta 'contexts' com 'AuthContext.jsx' existe e foi enviada para o GitHub.
import { AuthProvider, useAuth } from './contexts/AuthContext';
// ATENÇÃO: Verifique se a pasta 'contexts' com 'ThemeContext.jsx' existe e foi enviada para o GitHub.
import { ThemeProvider } from './contexts/ThemeContext';

// --- PÁGINAS ---
// ATENÇÃO: Verifique se o ficheiro 'AuthPage.jsx' existe na pasta 'pages' e foi enviado para o GitHub.
import AuthPage from './pages/AuthPage';
// CORRIGIDO: O caminho agora aponta diretamente para o ficheiro index.jsx para evitar erros de resolução no build.
import CargosEPermissoesPage from './pages/CargosEPermissoes/index.jsx';

// --- PÁGINAS COM PROBLEMAS (NÃO ENCONTRADAS NO GITHUB) ---
// As importações abaixo foram comentadas porque os ficheiros não foram encontrados no seu repositório.
// Para corrigir, envie os ficheiros para o GitHub e descomente as linhas.
// import ClientesPage from './pages/ClientesPage';
// import ChamadosPage from './pages/ChamadosPage';
// import GestaoDeEquipaPage from './pages/admin/GestaoDeEquipaPage';
import PlaceholderPage from './pages/PlaceholderPage'; // Assumindo que este ficheiro existe

// --- COMPONENTES ---
// ATENÇÃO: Verifique se a pasta 'components' com os layouts e modais existe e foi enviada para o GitHub.
import MainLayout from './components/layout/MainLayout';
import SettingsModal from './components/layout/SettingsModal';


const AppContent = () => {
  const { session, loading, profile } = useAuth();
  const [activePage, setActivePage] = useState('chamados');
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>A carregar...</p></div>;
  }

  if (!session) {
    // Se não houver ficheiro AuthPage, talvez queira redirecionar para LoginPage que já existe.
    // Por enquanto, vamos manter AuthPage, mas verifique o nome do ficheiro.
    return <AuthPage />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      // case 'clientes': return <ClientesPage />; // Comentado porque o ficheiro não existe
      // case 'chamados': return <ChamadosPage />; // Comentado porque o ficheiro não existe
      case 'cargos-e-permissoes': return <CargosEPermissoesPage />;
      // case 'gestao-de-equipa': return <GestaoDeEquipaPage />; // Comentado porque o ficheiro não existe

      // Estas páginas usam um componente genérico 'PlaceholderPage'.
      // Verifique se 'PlaceholderPage.jsx' existe na pasta 'pages'.
      case 'crm': return <PlaceholderPage title="CRM" />;
      case 'atendimento': return <PlaceholderPage title="Atendimento" />;
      case 'base-conhecimento': return <PlaceholderPage title="Base de Conhecimento" />;
      case 'financeiro': return <PlaceholderPage title="Financeiro" />;
      case 'relatorios': return <PlaceholderPage title="Relatórios e Análises" />;
      default: return <CargosEPermissoesPage />; // Alterado para uma página que existe
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
