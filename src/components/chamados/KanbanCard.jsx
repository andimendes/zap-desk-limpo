import React from 'react';
import { Clock, CheckSquare, Flag, Building } from 'lucide-react';
import { getSlaStatus } from '../../utils/sla';

// Sub-componente para criar um avatar com as iniciais do nome
const Avatar = ({ nome }) => {
    const iniciais = nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
    return (
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold">
            {iniciais}
        </div>
    );
};

const KanbanCard = ({ chamado, tarefasDoChamado = [], onClick }) => {
    // Paleta de cores aprimorada para prioridades com modo escuro
    const prioridadeCores = {
        'Urgente': { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-400', icon: <Flag size={14} /> },
        'Alta': { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', icon: <Flag size={14} /> },
        'Normal': { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-400', icon: <Flag size={14} className="text-gray-400" /> },
        'Baixa': { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-400', icon: <Flag size={14} className="text-gray-400" /> }
    };

    const prioridadeEstilo = prioridadeCores[chamado.prioridade] || { bg: 'bg-gray-50 dark:bg-gray-700', border: 'border-gray-400', text: 'text-gray-700 dark:text-gray-300', icon: <Flag size={14} className="text-gray-400"/> };
    const sla = getSlaStatus(chamado.created_at, chamado.sla_resolucao_horas);
    const totalTarefas = tarefasDoChamado.length;
    const tarefasConcluidas = tarefasDoChamado.filter(t => t.concluida).length;

    return (
        <div 
            onClick={onClick} 
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-3 border-l-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${prioridadeEstilo.border}`}
        >
            {/* Título do Chamado */}
            <h4 className="font-bold text-base mb-3 text-gray-800 dark:text-gray-100">{chamado.titulo}</h4>

            {/* Informações do Cliente */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Building size={14} className="mr-2 text-gray-400" />
                <span>{chamado.clientes?.nome_fantasia || chamado.clientes?.razao_social || 'Chamado Interno'}</span>
            </div>

            {/* Indicadores de SLA e Tarefas */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
                <div className={`text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${sla.color}`}><Clock size={12} />{sla.text}</div>
                {totalTarefas > 0 && (
                    <div className={`text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tarefasConcluidas === totalTarefas ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                        <CheckSquare size={12} />
                        {tarefasConcluidas}/{totalTarefas} Tarefas
                    </div>
                )}
            </div>

            <div className="border-t dark:border-gray-700 pt-3 flex items-center justify-between text-sm text-gray-500">
                {/* Prioridade */}
                <div className={`flex items-center gap-1.5 font-medium ${prioridadeEstilo.text}`}>
                    {prioridadeEstilo.icon}
                    <span>{chamado.prioridade}</span>
                </div>
                {/* Atendente */}
                <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-gray-400">{chamado.atendente?.full_name || 'Não atribuído'}</span>
                    <Avatar nome={chamado.atendente?.full_name} />
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;
