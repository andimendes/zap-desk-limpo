import React from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Ticket, Building, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, isExpanded, setIsExpanded }) => {
  const { profile } = useAuth();
  const userRole = profile?.role || 'Atendente';
  const navItems = {
    Atendente: [{ id: 'dashboard', text: 'Dashboard', icon: <LayoutDashboard /> }, { id: 'chamados', text: 'Meus Chamados', icon: <Ticket /> }],
    Gerente: [{ id: 'dashboard', text: 'Dashboard', icon: <LayoutDashboard /> }, { id: 'chamados', text: 'Todos Chamados', icon: <Ticket /> }, { id: 'clientes', text: 'Clientes', icon: <Building /> }, { id: 'configuracoes', text: 'Gerenciar Equipe', icon: <Settings /> }],
    ADM: [{ id: 'dashboard', text: 'Dashboard', icon: <LayoutDashboard /> }, { id: 'chamados', text: 'Todos Chamados', icon: <Ticket /> }, { id: 'clientes', text: 'Clientes', icon: <Building /> }, { id: 'configuracoes', text: 'Configurações', icon: <Settings /> }]
  };
  const userNavItems = navItems[userRole] || [];
  
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
      <nav className="flex-1 px-3 py-4 space-y-2">
        <ul>{userNavItems.map(item => <SidebarItem key={item.id} {...item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />)}</ul>
      </nav>
      <div className="p-3 border-t">
        <ul><SidebarItem icon={<LogOut />} text="Sair" onClick={() => supabase.auth.signOut()} /></ul>
      </div>
    </aside>
  );
};

export default Sidebar;
