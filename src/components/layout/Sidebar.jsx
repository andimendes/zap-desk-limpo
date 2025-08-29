import React, { useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Settings, LogOut, ChevronLeft, ChevronRight, Briefcase, 
  Users, Ticket, BookOpen, DollarSign, BarChart2, MessageSquare,
  User as UserIcon
} from 'lucide-react';

const Sidebar = ({ profile, activePage, setActivePage, isExpanded, setIsExpanded, onOpenSettings }) => {
  
  // --- CORREÇÃO DEFINITIVA ---
  // Função robusta que verifica a função do utilizador, ignorando espaços e maiúsculas/minúsculas.
  const isUserAdminOrManager = () => {
    // 1. Garante que o perfil e a propriedade 'role' existem.
    if (!profile || typeof profile.role !== 'string') {
      return false;
    }
    // 2. Remove espaços em branco do início e do fim, e converte para maiúsculas.
    const userRole = profile.role.trim().toUpperCase();
    
    // 3. Compara com os valores esperados.
    return userRole === 'ADM' || userRole === 'GERENTE';
  };

  const navItems = {
    MENU: [
      { id: 'chamados', text: 'Chamados', icon: <Ticket size={20} /> },
      { id: 'clientes', text: 'Clientes', icon: <Users size={20} /> },
    ],
    'FUTUROS MÓDULOS': [
      { id: 'crm', text: 'CRM', icon: <Briefcase size={20} /> },
      { id: 'atendimento', text: 'Atendimento', icon: <MessageSquare size={20} /> },
      { id: 'base-conhecimento', text: 'Base de Conhecimento', icon: <BookOpen size={20} /> },
      { id: 'financeiro', text: 'Financeiro', icon: <DollarSign size={20} /> },
      { id: 'relatorios', text: 'Relatórios', icon: <BarChart2 size={20} /> },
    ],
    ADMIN: [
      { id: 'configuracoes', text: 'Configurações', icon: <Settings size={20} /> },
    ]
  };

  const getVisibleSections = () => {
    if (isUserAdminOrManager()) {
      return ['MENU', 'FUTUROS MÓDULOS', 'ADMIN'];
    }
    return ['MENU'];
  };
  
  const SidebarItem = ({ icon, text, active, onClick }) => (
    <li onClick={onClick} className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
      <span className="flex-shrink-0">{icon}</span>
      <span className={`overflow-hidden transition-all ${isExpanded ? "w-52 ml-3" : "w-0"}`}>{text}</span>
      {!isExpanded && <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-800 text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}>{text}</div>}
    </li>
  );

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white border-r flex flex-col transition-all duration-300 z-20 ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b h-16">
        <div className="flex items-center gap-2">
            <img src="https://f005.backblazeb2.com/file/Zap-Contabilidade/%C3%8Dcone+-+Colorido.png" alt="Logo" className="w-8 flex-shrink-0" />
            <span className={`font-bold text-lg overflow-hidden transition-all ${isExpanded ? "w-32" : "w-0"}`}>Zap Desk Pro</span>
        </div>
        <button onClick={() => setIsExpanded(c => !c)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100">{isExpanded ? <ChevronLeft /> : <ChevronRight />}</button>
      </div>
      
      <nav className="flex-1 px-3 py-4">
        {getVisibleSections().map(sectionTitle => (
          <div key={sectionTitle} className="mb-4">
            <h3 className={`text-xs font-semibold text-gray-400 uppercase transition-all ${isExpanded ? 'px-3' : 'text-center'}`}>
              {isExpanded ? sectionTitle : '•'}
            </h3>
            <ul>
              {navItems[sectionTitle].map(item => (
                <SidebarItem 
                  key={item.id} 
                  icon={item.icon}
                  text={item.text} 
                  active={activePage === item.id} 
                  onClick={() => setActivePage(item.id)} 
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t">
        <div onClick={onOpenSettings} className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group hover:bg-gray-100 text-gray-600`}>
          <UserIcon size={20} />
          <div className={`overflow-hidden transition-all flex flex-col ${isExpanded ? "w-52 ml-3" : "w-0"}`}>
            <span className="font-semibold text-sm">{profile?.full_name || 'Utilizador'}</span>
            <span className="text-xs text-blue-500">Ver Perfil e Configurações</span>
          </div>
        </div>
        <ul>
          <SidebarItem icon={<LogOut size={20} />} text="Sair" onClick={() => supabase.auth.signOut()} />
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
