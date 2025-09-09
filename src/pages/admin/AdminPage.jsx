import React from 'react';
import { NavLink as RouterNavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Settings, Users, Shield, Target, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';

// --- CORREÇÃO FINAL: Usando o alias '@/' que aponta para a pasta 'src' ---
import { useAuth } from '@/contexts/AuthContext.jsx';
import Can from '@/contexts/Can.jsx'; 

// Importa as páginas de configurações que estão na mesma pasta
import GestaoDeEquipePage from './GestaoDeEquipePage.jsx'; 
import CargosEPermissoesPage from './CargosEPermissoesPage.jsx';
import CrmSettingsPage from './CrmSettingsPage.jsx';
import AdminProdutosPage from './AdminProdutosPage.jsx';

// Componente para os links de navegação (sem alterações)
const AdminNavLink = ({ to, icon, children }) => (
    <RouterNavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-gray-800/80 ${
                isActive ? 'bg-gray-100 font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-50' : ''
            }`
        }
    >
        {icon}
        {children}
    </RouterNavLink>
);

/**
 * Componente de fallback para quando o usuário não é admin.
 */
const NotAuthorized = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Negado</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
            Você não tem permissão para aceder a esta área de configurações.
        </p>
    </div>
);


/**
 * O componente principal do Painel de Administração, agora com verificação de permissão.
 */
const AdminPanel = () => {
    return (
        <Can>
            <div className="grid h-full w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <aside className="hidden border-r bg-gray-50/70 dark:bg-gray-900/50 md:block">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                                <Settings className="h-6 w-6" />
                                <span>Configurações</span>
                            </span>
                        </div>
                        <nav className="flex-1 overflow-auto py-4 px-2 text-sm font-medium lg:px-4">
                            <AdminNavLink to="/admin/equipa" icon={<Users className="h-4 w-4" />}>
                                Equipe
                            </AdminNavLink>
                            <AdminNavLink to="/admin/cargos" icon={<Shield className="h-4 w-4" />}>
                                Cargos e Permissões
                            </AdminNavLink>
                            <AdminNavLink to="/admin/crm" icon={<Target className="h-4 w-4" />}>
                                CRM
                            </AdminNavLink>
                            <AdminNavLink to="/admin/produtos" icon={<ShoppingBag className="h-4 w-4" />}>
                                Produtos e Serviços
                            </AdminNavLink>
                        </nav>
                    </div>
                </aside>
                <main className="flex flex-col">
                    <Routes>
                        <Route path="equipa" element={<GestaoDeEquipePage />} />
                        <Route path="cargos" element={<CargosEPermissoesPage />} />
                        <Route path="crm" element={<CrmSettingsPage />} />
                        <Route path="produtos" element={<AdminProdutosPage />} />
                        <Route path="*" element={<Navigate to="equipa" replace />} />
                    </Routes>
                </main>
            </div>
        </Can>
    );
};

// Componente final que decide se mostra o painel ou a mensagem de acesso negado
const AdminPageWrapper = () => {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;
    }

    const isUserAdmin = profile && profile.roles && profile.roles.some(role => role.toLowerCase() === 'admin');

    return isUserAdmin ? <AdminPanel /> : <NotAuthorized />;
}


export default AdminPageWrapper;