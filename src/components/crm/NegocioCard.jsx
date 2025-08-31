import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User } from 'lucide-react'; // Ícone de utilizador

const NegocioCard = ({ negocio, index, onCardClick }) => {
  return (
    <Draggable draggableId={String(negocio.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(negocio)}
          className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 border-blue-500 cursor-pointer ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
          }`}
        >
          <h4 className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{negocio.empresa_contato}</p>
          
          {/* --- ESTA É A PARTE NOVA --- */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <User size={12} />
            <span>{negocio.responsavel?.full_name || 'Sem responsável'}</span>
          </div>
          
          <div className="mt-3 text-right">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default NegocioCard;