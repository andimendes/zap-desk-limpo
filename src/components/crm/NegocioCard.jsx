import React from 'react';
import { Draggable } from '@hello-pangea/dnd'; // -> Biblioteca atualizada

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
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">{negocio.nome_contato}</p>
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