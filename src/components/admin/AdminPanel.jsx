import React from 'react';
import { NavLink as RouterNavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Settings, Users, Shield, Target } from 'lucide-react';

// Importa as páginas de configurações que você já criou
import GestaoDeEquipaPage from '@/pages/admin/GestaoDeEquipePage';
import CargosEPermissoesPage from '@/pages/admin/CargosEPermissoesPage';
import CrmSettingsPage from '@/pages/admin/CrmSettingsPage';

// --- ESTA É A CORREÇÃO ---
// O NavLink interno do painel de administração.
// A lógica `className` foi ajustada para ser mais simples e eficaz.
const AdminNavLink = ({ to, icon, children }) => (
    <RouterNavLink
        to={to}
        end // A propriedade 'end' garante que o link só fica ativo se o URL for exato
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
 * O componente principal do Painel de Administração.
 */
const AdminPanel = () => {
    return (
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
                        {/* As rotas aqui estão corretas, não precisam de alteração */}
                        <AdminNavLink to="/admin/equipa" icon={<Users className="h-4 w-4" />}>
                            Equipe
                        </AdminNavLink>
                        <AdminNavLink to="/admin/cargos" icon={<Shield className="h-4 w-4" />}>
                            Cargos e Permissões
                        </AdminNavLink>
                        <AdminNavLink to="/admin/crm" icon={<Target className="h-4 w-4" />}>
                            CRM
                        </AdminNavLink>
                    </nav>
                </div>
            </aside>
            <main className="flex flex-col p-4 sm:py-4 sm:pl-14 lg:p-6">
                <Routes>
                    <Route path="equipa" element={<GestaoDeEquipaPage />} />
                    <Route path="cargos" element={<CargosEPermissoesPage />} />
                    <Route path="crm" element={<CrmSettingsPage />} />
                    {/* A rota de redirecionamento está correta */}
                    <Route path="*" element={<Navigate to="equipa" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminPanel;