// src/components/crm/NegocioCard.jsx

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/supabaseClient'; // --- MUDANÇA AQUI: Importar supabase para uso direto ---

const differenceInDays = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return 0;
    const diff = new Date(dateLeft).getTime() - new Date(dateRight).getTime();
    if (isNaN(diff)) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
};

const NegocioCard = ({ negocio, index, onCardClick, etapasDoFunil }) => {
  const diasDesdeCriacao = differenceInDays(new Date(), negocio.created_at);

  // A lógica de construção da URL pública permanece a mesma, mas agora o 'supabase' está acessível
  const avatarUrl = negocio.responsavel?.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(negocio.responsavel.avatar_url).data.publicUrl
    : null;

  return (
    <Draggable draggableId={String(negocio.id)} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef} 
          {...provided.draggableProps} 
          {...provided.dragHandleProps} 
          onClick={() => onCardClick(negocio)} 
          className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 ${snapshot.isDragging ? 'border-blue-400 ring-2 ring-blue-400' : 'border-blue-500'} cursor-pointer flex flex-col gap-3`}
        >
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{negocio.empresa_contato}</p>
            {negocio.contato_principal_nome && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Contato: {negocio.contato_principal_nome}</p>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User size={16} />
              )}
              <span>{negocio.responsavel?.full_name || 'Sem responsável'}</span>
            </div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-200/50 pt-3">
            <div className="flex items-center gap-1.5" title={`Criado há ${diasDesdeCriacao} dias`}>
              <Clock size={12} />
              <span>{diasDesdeCriacao}d de idade</span>
            </div>
            {!negocio.tem_tarefa_futura && (
              <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500" title="Nenhuma tarefa futura agendada"><AlertTriangle size={12} /><span>Sem tarefa</span></div>
            )}
          </div>
          
          <style jsx>{`
            .tooltip-container { position: relative; display: inline-block; }
            .tooltip-text { visibility: hidden; width: 120px; background-color: #333; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 10; bottom: 150%; left: 50%; margin-left: -60px; opacity: 0; transition: opacity 0.3s; }
            .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }
          `}</style>
        </div>
      )}
    </Draggable>
  );
};

export default NegocioCard;