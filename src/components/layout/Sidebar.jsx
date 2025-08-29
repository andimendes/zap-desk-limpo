import React from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Ticket, 
  Building, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Briefcase, // Ícone para CRM
  Users, // Ícone para Clientes
  BookOpen, // Ícone para Base de Conhecimento
  DollarSign, // Ícone para Financeiro
  BarChart2, // Ícone para Relatórios
  MessageSquare // Ícone para Atendimento
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, isExpanded, setIsExpanded }) => {
  const { profile } = useAuth();
  const userRole = profile?.role || 'Atendente';

  // --- 1. CORREÇÃO PRINCIPAL AQUI ---
  // Unificámos os itens de admin num único link de "Configurações"
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
      // A rota 'configuracoes' agora abre a página unificada com abas
      { id: 'configuracoes', text: 'Configurações', icon: <Settings size={20} /> },
    ]
  };

  // Lógica para decidir quais secções mostrar com base na role do utilizador
  const getVisibleSections = () => {
    if (userRole === 'ADM' || userRole === 'Gerente') {
      return ['MENU', 'FUTUROS MÓDULOS', 'ADMIN'];
    }
    // Adicionar mais lógicas para outras roles se necessário
    return ['MENU'];
  };
  
  const SidebarItem = ({ icon, text, active, onClick }) => (
    <li onClick={onClick} className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
      {icon}
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
        {/* Aqui pode adicionar informações do utilizador se desejar */}
        <ul><SidebarItem icon={<LogOut />} text="Sair" onClick={() => supabase.auth.signOut()} /></ul>
      </div>
    </aside>
  );
};

export default Sidebar;