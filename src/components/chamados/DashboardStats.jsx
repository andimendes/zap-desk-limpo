import React from 'react';
import { User, AlertTriangle, Paperclip, Ticket } from 'lucide-react';
import { getSlaStatus } from '../../utils/sla';

// O componente agora não precisa mais da lista de 'tarefas'
const DashboardStats = ({ chamados }) => {
    // A propriedade 'chamados' que recebemos agora é um array vazio no início,
    // então adicionamos uma verificação para evitar erros.
    if (!chamados) {
        return null; // Não renderiza nada se os chamados ainda não foram carregados
    }

    const atrasados = chamados.filter(c => c.status !== 'Resolvido' && c.status !== 'Cancelado' && getSlaStatus(c.created_at, c.sla_resolucao_horas).isAtrasado).length;
    const aguardandoCliente = chamados.filter(c => c.status === 'Aguardando Cliente').length;
    
    // --- LÓGICA CORRIGIDA ---
    // Agora, para saber os chamados "Sem Tarefas", apenas verificamos se o campo 
    // `total_tarefas` (que vem da nossa View) é nulo ou zero.
    const semTarefas = chamados.filter(c => 
        (c.total_tarefas === null || c.total_tarefas === 0) && 
        c.status !== 'Resolvido' && 
        c.status !== 'Cancelado'
    ).length;
    
    const StatCard = ({ title, value, icon }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
            {icon}
            <div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500">{title}</p>
            </div>
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