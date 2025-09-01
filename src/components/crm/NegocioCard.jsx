// src/components/crm/NegocioCard.jsx

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, DollarSign, AlertTriangle } from 'lucide-react';

// Novo componente para a barra de progresso
const FunilProgressBar = ({ etapas, etapaAtualId }) => {
  const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId);

  return (
    <div className="flex items-center gap-1 mt-3">
      {etapas.map((etapa, index) => {
        let cor = 'bg-gray-300 dark:bg-gray-600'; // Etapa futura
        if (index < etapaAtualIndex) {
          cor = 'bg-green-500'; // Etapa passada
        } else if (index === etapaAtualIndex) {
          cor = 'bg-blue-500'; // Etapa atual
        }

        return (
          <div 
            key={etapa.id}
            className="h-1.5 flex-1 rounded-full tooltip-container"
            data-tooltip={etapa.nome_etapa} // Para o tooltip
          >
            <div className={`h-full w-full rounded-full ${cor}`}></div>
            <span className="tooltip-text">{etapa.nome_etapa}</span>
          </div>
        );
      })}
    </div>
  );
};


const NegocioCard = ({ negocio, index, onCardClick, etapasDoFunil }) => {
  // Lógica de alerta (opcional, mas recomendado)
  // Pode ser expandido para verificar a data da última atividade
  const temAtividadeAtrasada = false; // Substituir pela lógica real no futuro

  return (
    <Draggable draggableId={String(negocio.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(negocio)}
          className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 ${snapshot.isDragging ? 'border-blue-400 ring-2 ring-blue-400' : 'border-blue-500'} cursor-pointer`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{negocio.empresa_contato}</p>
            </div>
            {temAtividadeAtrasada && <AlertTriangle size={16} className="text-red-500" />}
          </div>
          
          <div className="flex justify-between items-end mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <User size={12} />
              <span>{negocio.responsavel?.full_name || 'Sem responsável'}</span>
            </div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
            </span>
          </div>

          {/* --- NOSSA NOVA BARRA DE PROGRESSO --- */}
          {etapasDoFunil && etapasDoFunil.length > 0 && (
            <FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} />
          )}

          {/* Adicionando CSS para os tooltips diretamente aqui para simplicidade */}
          <style jsx>{`
            .tooltip-container {
              position: relative;
              display: inline-block;
            }
            .tooltip-text {
              visibility: hidden;
              width: 120px;
              background-color: #333;
              color: #fff;
              text-align: center;
              border-radius: 6px;
              padding: 5px 0;
              position: absolute;
              z-index: 10;
              bottom: 150%;
              left: 50%;
              margin-left: -60px;
              opacity: 0;
              transition: opacity 0.3s;
            }
            .tooltip-container:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }
          `}</style>
        </div>
      )}
    </Draggable>
  );
};

export default NegocioCard;