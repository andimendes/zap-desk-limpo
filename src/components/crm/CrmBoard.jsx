// src/components/crm/CrmBoard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

const EtapaColuna = ({ etapa, negocios, totalValor, totalNegocios }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">{etapa.nome_etapa}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}・{totalNegocios} negócio(s)</p>
      </div>
      <Droppable droppableId={String(etapa.id)}>{(provided, snapshot) => (<div ref={provided.innerRef} {...provided.droppableProps} className={`flex-grow min-h-[200px] transition-colors duration-200 rounded-md ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>{negocios}{provided.placeholder}</div>)}</Droppable>
    </div>
  );
};

// O CrmBoard agora é um componente puramente de apresentação
const CrmBoard = ({ etapas, negocios, onNegocioClick, onDataChange }) => {
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  // O estado e o componente do Modal de Detalhes foram removidos daqui

  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    await supabase.from('crm_negocios').update({ etapa_id: destination.droppableId }).eq('id', draggableId);
    onDataChange(); // Avisa o pai para recarregar os dados
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex space-x-6 overflow-x-auto pb-4 justify-center">
              {etapas.map(etapa => {
                const negociosDaEtapa = negocios.filter(n => String(n.etapa_id) === String(etapa.id));
                const valorDaEtapa = negociosDaEtapa.reduce((sum, n) => sum + (n.valor || 0), 0);
                return (
                  <EtapaColuna 
                    key={etapa.id} 
                    etapa={etapa} 
                    negocios={negociosDaEtapa.map((negocio, index) => (
                      <NegocioCard 
                        key={negocio.id} 
                        negocio={negocio} 
                        index={index} 
                        // A função onNegocioClick agora vem do pai
                        onCardClick={onNegocioClick} 
                        etapasDoFunil={etapas} 
                      />
                    ))}
                    totalValor={valorDaEtapa}
                    totalNegocios={negociosDaEtapa.length}
                  />
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
      {/* O Modal de Detalhes não é mais renderizado aqui */}
    </>
  );
};

export default CrmBoard;