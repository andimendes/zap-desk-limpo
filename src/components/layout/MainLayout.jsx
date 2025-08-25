import React from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
    MessageSquare, Users, Target, PhoneForwarded, BookOpen, 
    DollarSign, BarChart2, User as UserIcon, LogOut,
    Shield
} from 'lucide-react';

const NavLink = ({ icon, children, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active 
        ? 'bg-blue-600 text-white shadow-inner' 
        : 'text-gray-300 hover:bg-blue-800 hover:text-white dark:text-gray-400 dark:hover:bg-gray-700'
    }`}>
        {icon}
        <span className="ml-3">{children}</span>
    </button>
);

export default function MainLayout({ children, activePage, setActivePage, onOpenSettings }) {
    const { profile } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <aside className="w-64 flex flex-col bg-gray-800 text-white p-4 dark:bg-gray-800">
                <div className="flex items-center justify-center py-4 mb-6">
                    <img 
                        src="https://f005.backblazeb2.com/file/Zap-Contabilidade/Simplificado+-+Horizontal+-+Negativo+3-3.png" 
                        alt="Logo Zap Desk Pro" 
                        className="h-12 w-auto"
                    />
                </div>
                <nav className="flex-1 space-y-2">
                    <p className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase font-semibold dark:text-gray-500">Menu</p>
                    <NavLink icon={<MessageSquare size={20} />} active={activePage === 'chamados'} onClick={() => setActivePage('chamados')}>Chamados</NavLink>
                    <NavLink icon={<Users size={20} />} active={activePage === 'clientes'} onClick={() => setActivePage('clientes')}>Clientes</NavLink>
                    
                    <p className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase font-semibold dark:text-gray-500">Futuros Módulos</p>
                    <NavLink icon={<Target size={20} />} active={activePage === 'crm'} onClick={() => setActivePage('crm')}>CRM</NavLink>
                    <NavLink icon={<PhoneForwarded size={20} />} active={activePage === 'atendimento'} onClick={() => setActivePage('atendimento')}>Atendimento</NavLink>
                    <NavLink icon={<BookOpen size={20} />} active={activePage === 'base-conhecimento'} onClick={() => setActivePage('base-conhecimento')}>Base de Conhecimento</NavLink>
                    <NavLink icon={<DollarSign size={20} />} active={activePage === 'financeiro'} onClick={() => setActivePage('financeiro')}>Financeiro</NavLink>
                    <NavLink icon={<BarChart2 size={20} />} active={activePage === 'relatorios'} onClick={() => setActivePage('relatorios')}>Relatórios</NavLink>
                </nav>

                <div className="mt-auto">
                    {profile?.roles?.includes('admin') && (
                        <>
                            <p className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase font-semibold dark:text-gray-500">Admin</p>
                            <NavLink 
                                icon={<Shield size={20} />} 
                                active={activePage === 'cargos-e-permissoes'} 
                                onClick={() => setActivePage('cargos-e-permissoes')}
                            >
                                Cargos e Permissões
                            </NavLink>
                            {/* **INÍCIO DA CORREÇÃO** - Texto alterado para "Equipe" */}
                            <NavLink 
                                icon={<Users size={20} />} 
                                active={activePage === 'gestao-de-equipa'} 
                                onClick={() => setActivePage('gestao-de-equipa')}
                            >
                                Equipe
                            </NavLink>
                            {/* **FIM DA CORREÇÃO** */}
                        </>
                    )}
                    
                    <button 
                        onClick={onOpenSettings} 
                        className="w-full flex flex-col items-start p-2 rounded-lg hover:bg-gray-700/50 text-left dark:hover:bg-gray-700 mt-4"
                    >
                        <div className="flex items-center">
                           <UserIcon size={20} className="text-gray-300 dark:text-gray-400" />
                           <span className="ml-3 text-sm font-medium text-gray-200 dark:text-gray-300">{profile?.full_name || 'Utilizador'}</span>
                        </div>
                        <span className="ml-9 text-xs text-blue-400 dark:text-blue-500">Ver Perfil e Configurações</span>
                    </button>

                    <button onClick={handleLogout} className="w-full flex items-center mt-2 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors dark:text-gray-400 dark:hover:bg-red-600">
                        <LogOut size={20} />
                        <span className="ml-3">Sair</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
