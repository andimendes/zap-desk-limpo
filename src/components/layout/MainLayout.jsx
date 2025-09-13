import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useAccess } from '../../contexts/useAccess';
import Can from '../../contexts/Can';
import { 
    MessageSquare, DollarSign, BarChart2, User as UserIcon, LogOut,
    Settings, LayoutDashboard, Building, Users, Target, Shield,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon, text, to, isExpanded, onClick = () => {} }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <li className="relative">
            <Link to={to} onClick={onClick} className={`flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${
                isActive 
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}>
                <span className="flex-shrink-0">{icon}</span>
                <span className={`overflow-hidden transition-all whitespace-nowrap ${isExpanded ? "w-52 ml-3" : "w-0"}`}>{text}</span>
            </Link>
            {!isExpanded && (
                <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap`}>
                    {text}
                </div>
            )}
        </li>
    );
};

export default function MainLayout({ children, onOpenSettings }) {
    const { profile } = useAuth();
    const { hasModuleAccess } = useAccess();
    const [isExpanded, setIsExpanded] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    const navStructure = {
        'MENU': [
            { id: 'dashboard', to: '/dashboard', icon: <LayoutDashboard size={20} />, text: 'Dashboard', module: null },
            { id: 'chamados', to: '/chamados', icon: <MessageSquare size={20} />, text: 'Chamados', module: 'ATENDIMENTO' },
            { id: 'empresas', to: '/empresas', icon: <Building size={20} />, text: 'Empresas', module: null },
            { id: 'contatos', to: '/contatos', icon: <Users size={20} />, text: 'Contatos', module: null },
            { id: 'crm', to: '/crm', icon: <Target size={20} />, text: 'CRM', module: 'CRM' },
        ],
        'FUTUROS MÓDULOS': [
            { id: 'financeiro', to: '/financeiro', icon: <DollarSign size={20} />, text: 'Financeiro', module: 'FINANCEIRO' },
            { id: 'relatorios', to: '/relatorios', icon: <BarChart2 size={20} />, text: 'Relatórios', module: null },
        ]
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <aside className={`flex flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300 relative ${isExpanded ? 'w-64' : 'w-20'}`}>
                <div className="flex items-center justify-between p-4 border-b h-16 dark:border-gray-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img src="https://f005.backblazeb2.com/file/Zap-Contabilidade/%C3%8Dcone+-+Colorido.png" alt="Logo" className="w-8 h-8 flex-shrink-0" />
                        <span className={`font-bold text-lg whitespace-nowrap transition-all duration-200 ${isExpanded ? "w-32 opacity-100 ml-2" : "w-0 opacity-0"}`}>Zap Desk Pro</span>
                    </div>
                </div>
                
                <button onClick={() => setIsExpanded(c => !c)} className="absolute top-[62px] -right-3 p-1.5 bg-white border rounded-full text-gray-600 shadow-md hover:bg-gray-100 transition z-10">
                    {isExpanded ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>}
                </button>

                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    {Object.entries(navStructure).map(([sectionTitle, items]) => (
                        <div key={sectionTitle} className="mb-4">
                           <p className={`text-xs font-semibold text-gray-400 uppercase transition-all mb-2 ${isExpanded ? 'px-3' : 'text-center'}`}>{isExpanded ? sectionTitle : '•'}</p>
                           <ul>
                               {items.map(item => (
                                   (item.module === null || hasModuleAccess(item.module)) && (
                                       <SidebarItem key={item.id} to={item.to} icon={item.icon} isExpanded={isExpanded} text={item.text} />
                                   )
                               ))}
                           </ul>
                        </div>
                    ))}
                </nav>

                <div className="p-3 border-t dark:border-gray-700">
                    {/* Link para o Painel Master, visível apenas para Super Admin */}
                    {profile?.is_super_admin && (
                        <ul>
                           <SidebarItem to="/master-admin" icon={<Shield size={20} />} isExpanded={isExpanded} text="Painel Master" />
                        </ul>
                    )}

                    {/* Link para o Painel Admin do Tenant, visível para admins do tenant */}
                    <Can>
                        <ul>
                           <SidebarItem to="/admin/equipa" icon={<Settings size={20} />} isExpanded={isExpanded} text="Painel Admin" />
                        </ul>
                    </Can>
                    
                    <div onClick={onOpenSettings} className="flex items-center p-2 mt-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        <UserIcon size={24} className="flex-shrink-0 text-gray-600" />
                        <div className={`overflow-hidden transition-all flex flex-col ${isExpanded ? "w-52 ml-3" : "w-0"}`}>
                            <span className="font-semibold text-sm whitespace-nowrap text-gray-800">{profile?.full_name || 'Utilizador'}</span>
                            <span className="text-xs text-blue-500 whitespace-nowrap">Ver Perfil</span>
                        </div>
                    </div>
                     <ul>
                        <SidebarItem to="#" icon={<LogOut size={20} />} isExpanded={isExpanded} text="Sair" onClick={handleLogout} />
                    </ul>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}