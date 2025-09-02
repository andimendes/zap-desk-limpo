// src/components/crm/ItemLinhaDoTempo.jsx

import React from 'react';
import { FileText, Calendar, CheckCircle, Trash2 } from 'lucide-react';

const formatarData = (data) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(data));
};

const ItemLinhaDoTempo = ({ item, onAction }) => {
    const isNota = item.tipo === 'nota';
    const isConcluida = item.concluida;

    const Icone = isNota ? FileText : (isConcluida ? CheckCircle : Calendar);
    const corIcone = isConcluida ? 'text-green-500' : 'text-gray-500';

    return (
        <li className="flex items-start gap-4 py-3 group">
            <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${corIcone}`}>
                    <Icone size={16} />
                </div>
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {isNota ? 'Nota' : (isConcluida ? 'Atividade concluída' : 'Atividade planejada')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatarData(item.data)}
                    </p>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mt-1 break-words">
                    {item.conteudo}
                </p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onAction('delete', item)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Excluir item"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </li>
    );
};

export default ItemLinhaDoTempo;