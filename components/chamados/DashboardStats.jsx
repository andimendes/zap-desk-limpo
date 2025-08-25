import React from 'react';
import { User, AlertTriangle, Paperclip, Ticket } from 'lucide-react';
import { getSlaStatus } from '../../utils/sla';

const DashboardStats = ({ chamados, tarefas }) => {
    const atrasados = chamados.filter(c => c.status !== 'Resolvido' && c.status !== 'Cancelado' && getSlaStatus(c.created_at, c.sla_resolucao_horas).isAtrasado).length;
    const aguardandoCliente = chamados.filter(c => c.status === 'Aguardando Cliente').length;
    const chamadosIdsComTarefas = new Set(tarefas.map(t => t.chamado_id));
    const semTarefas = chamados.filter(c => !chamadosIdsComTarefas.has(c.id) && c.status !== 'Resolvido' && c.status !== 'Cancelado').length;
    
    const StatCard = ({ title, value, icon }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
            {icon}
            <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500">{title}</p></div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Aguardando Cliente" value={aguardandoCliente} icon={<User size={32} className="text-purple-500" />} />
            <StatCard title="Chamados Atrasados" value={atrasados} icon={<AlertTriangle size={32} className="text-red-500" />} />
            <StatCard title="Sem Tarefas" value={semTarefas} icon={<Paperclip size={32} className="text-yellow-500" />} />
            <StatCard title="Total na Fila" value={chamados.filter(c => c.status !== 'Resolvido' && c.status !== 'Cancelado').length} icon={<Ticket size={32} className="text-blue-500" />} />
        </div>
    );
};

export default DashboardStats;
