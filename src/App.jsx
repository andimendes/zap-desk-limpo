import React, { useState, useContext, createContext } from 'react';

// --- Início dos Módulos Faltantes (Versões Simuladas) ---

// Simulação para ./contexts/AuthContext
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Simula um estado de autenticação. Altere 'session' para null 
  // para testar a página de login.
  const value = {
    session: { user: { id: '123', email: 'teste@exemplo.com' } },
    loading: false,
    profile: { id: '123', username: 'Usuário Teste', role: 'admin' }
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Simulação para ./contexts/ThemeContext
const ThemeContext = createContext(null);
export const ThemeProvider = ({ children }) => {
  // Este provedor simplesmente renderiza os filhos, sem lógica de tema por enquanto.
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};

// Simulação para as páginas e componentes
const AuthPage = () => <div className="p-4 text-center">Página de Autenticação</div>;
const ClientesPage = () => <div className="p-4">Página de Clientes</div>;
const ChamadosPage = () => <div className="p-4">Página de Chamados</div>;
const CargosEPermissoesPage = () => <div className="p-4">Página de Cargos e Permissões</div>;
const GestaoDeEquipaPage = () => <div className="p-4">Página de Gestão de Equipa</div>;
const PlaceholderPage = ({ title }) => <div className="p-4">Página: {title}</div>;

const MainLayout = ({ activePage, setActivePage, onOpenSettings, profile, children }) => (
  <div className="flex h-screen bg-gray-100">
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <nav>
        <ul>
          <li className={`p-2 rounded cursor-pointer ${activePage === 'chamados' ? 'bg-gray-700' : ''}`} onClick={() => setActivePage('chamados')}>Chamados</li>
          <li className={`p-2 rounded cursor-pointer ${activePage === 'clientes' ? 'bg-gray-700' : ''}`} onClick={() => setActivePage('clientes')}>Clientes</li>
          {/* Adicione outros itens de menu aqui */}
        </ul>
        {profile?.role === 'admin' && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Admin</h3>
            <ul>
              <li className={`p-2 rounded cursor-pointer ${activePage === 'cargos-e-permissoes' ? 'bg-gray-700' : ''}`} onClick={() => setActivePage('cargos-e-permissoes')}>Cargos e Permissões</li>
              <li className={`p-2 rounded cursor-pointer ${activePage === 'gestao-de-equipa' ? 'bg-gray-700' : ''}`} onClick={() => setActivePage('gestao-de-equipa')}>Gestão de Equipa</li>
            </ul>
          </div>
        )}
      </nav>
      <button onClick={onOpenSettings} className="mt-auto w-full bg-gray-700 hover:bg-gray-600 p-2 rounded">Definições</button>
    </aside>
    <main className="flex-1 p-6">
      {children}
    </main>
  </div>
);

const SettingsModal = ({ isOpen, onClose, userProfile, userAuth }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4">Definições</h2>
        <p><strong>Utilizador:</strong> {userProfile?.username}</p>
        <p><strong>Email:</strong> {userAuth?.email}</p>
        <button onClick={onClose} className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">Fechar</button>
      </div>
    </div>
  );
};

// --- Fim dos Módulos Faltantes ---


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
