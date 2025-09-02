// src/components/crm/NegocioCard.jsx

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, AlertTriangle, Clock } from 'lucide-react';

const FunilProgressBar = ({ etapas, etapaAtualId }) => {
  const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId);
  return (
    <div className="flex items-center gap-1 mt-3">
      {etapas.map((etapa, index) => {
        let cor = 'bg-gray-300 dark:bg-gray-600';
        if (index < etapaAtualIndex) cor = 'bg-green-500';
        else if (index === etapaAtualIndex) cor = 'bg-blue-500';
        return (<div key={etapa.id} className="h-1.5 flex-1 rounded-full tooltip-container" data-tooltip={etapa.nome_etapa}><div className={`h-full w-full rounded-full ${cor}`}></div><span className="tooltip-text">{etapa.nome_etapa}</span></div>);
      })}
    </div>
  );
};

const differenceInDays = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return 0;
    const diff = new Date(dateLeft).getTime() - new Date(dateRight).getTime();
    if (isNaN(diff)) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
};

const NegocioCard = ({ negocio, index, onCardClick, etapasDoFunil }) => {
  const diasParado = differenceInDays(new Date(), negocio.updated_at);

  return (
    <Draggable draggableId={String(negocio.id)} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => onCardClick(negocio)} className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 ${snapshot.isDragging ? 'border-blue-400 ring-2 ring-blue-400' : 'border-blue-500'} cursor-pointer flex flex-col gap-3`}>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{negocio.empresa_contato}</p>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><User size={12} /><span>{negocio.responsavel?.full_name || 'Sem responsável'}</span></div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-200/50 pt-3">
            <div className="flex items-center gap-1.5" title={`Parado nesta etapa há ${diasParado} dias`}><Clock size={12} /><span>{diasParado}d parado</span></div>
            {!negocio.tem_tarefa_futura && (
              <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500" title="Nenhuma tarefa futura agendada"><AlertTriangle size={12} /><span>Sem tarefa</span></div>
            )}
          </div>
          {etapasDoFunil && etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} />)}
          <style jsx>{`.tooltip-container { position: relative; display: inline-block; } .tooltip-text { visibility: hidden; width: 120px; background-color: #333; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 10; bottom: 150%; left: 50%; margin-left: -60px; opacity: 0; transition: opacity 0.3s; } .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }`}</style>
        </div>
      )}
    </Draggable>
  );
};

export default NegocioCard;