// CÓDIGO ATUALIZADO PARA ChamadoListItem.jsx
import React from 'react';
import { Flag, Building } from 'lucide-react';
import { getSlaStatus } from '../../utils/sla';

const Avatar = ({ nome }) => {
    const iniciais = nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
    return <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">{iniciais}</div>;
};

const ChamadoListItem = ({ chamado, onClick }) => {
    const sla = getSlaStatus(chamado.created_at, chamado.sla_resolucao_horas);
    const prioridadeCores = { 'Urgente': 'text-red-600', 'Alta': 'text-yellow-600', 'Normal': 'text-blue-600', 'Baixa': 'text-green-600' };

    return (
        <tr onClick={onClick} className="bg-white hover:bg-gray-50 cursor-pointer border-b">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">{chamado.titulo}</div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Building size={14} className="mr-2" />
                    {chamado.nome_fantasia || chamado.razao_social || "Chamado Interno"}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${sla.color}`}>{sla.text}</span></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold"><div className={`flex items-center gap-2 ${prioridadeCores[chamado.prioridade]}`}><Flag size={16} />{chamado.prioridade}</div></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{chamado.status}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <Avatar nome={chamado.atendente_full_name} />
                    <span className="text-sm text-gray-800">{chamado.atendente_full_name || 'Não atribuído'}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(chamado.created_at).toLocaleDateString('pt-BR')}</td>
        </tr>
    );
};

export default ChamadoListItem;