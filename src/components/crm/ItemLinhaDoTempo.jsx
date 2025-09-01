// src/components/crm/ItemLinhaDoTempo.jsx

import React from 'react';
import { MessageSquare, CheckCircle, Calendar, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ItemLinhaDoTempo = ({ item, onAction }) => {
  const Icone = {
    'nota': MessageSquare,
    'atividade': item.concluida ? CheckCircle : Calendar,
  }[item.tipo];

  const corIcone = {
    'nota': 'text-yellow-600 dark:text-yellow-400',
    'atividade': item.concluida ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400',
  }[item.tipo];
  
  return (
    <li className="flex gap-4 group">
      {/* Icone e Linha Vertical */}
      <div className="flex flex-col items-center">
        <div className={`p-2 bg-gray-100 dark:bg-gray-700 rounded-full ${corIcone}`}>
          <Icone size={16} />
        </div>
        <div className="flex-grow w-px bg-gray-200 dark:bg-gray-600"></div>
      </div>

      {/* Conteúdo do Item */}
      <div className="flex-1 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.tipo === 'atividade' ? `Atividade ${item.concluida ? 'concluída' : 'planeada'}` : 'Nota'}
            </p>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{item.conteudo}</p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {format(item.data, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>
        
        {/* Ações que aparecem em hover - apenas para atividades */}
        {item.tipo === 'atividade' && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onAction('edit', item.original)} className="p-1 text-gray-500 hover:text-green-600"><Pencil size={14}/></button>
            <button onClick={() => onAction('delete', item.original.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={14}/></button>
          </div>
        )}
      </div>
    </li>
  );
};

export default ItemLinhaDoTempo;