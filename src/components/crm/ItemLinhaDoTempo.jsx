// src/components/crm/ItemLinhaDoTempo.jsx

import React from 'react';
// --- 1. Adicionamos o ícone de 'User' como fallback ---
import { FileText, Calendar, CheckCircle, Trash2, Pencil, User } from 'lucide-react';

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
        <li className="flex items-start gap-4 py-4 group border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
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

                {/* --- 2. NOVO BLOCO PARA EXIBIR O AUTOR --- */}
                {item.autor && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {item.autor.avatar_url ? (
                            <img src={item.autor.avatar_url} alt={item.autor.full_name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <User size={12} />
                            </div>
                        )}
                        <span>{item.autor.full_name || 'Usuário do Sistema'}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {!isConcluida && (
                    <button 
                        onClick={() => onAction('edit', item)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Editar item"
                    >
                        <Pencil size={16} />
                    </button>
                )}
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