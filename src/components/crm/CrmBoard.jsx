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

const CrmBoard = ({ etapas, negocios, onNegocioClick, onDataChange }) => {
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Atualiza o negócio para a nova etapa
    const { error: updateError } = await supabase
      .from('crm_negocios')
      .update({ etapa_id: destination.droppableId })
      .eq('id', draggableId);
    
    if (updateError) {
      alert("Não foi possível mover o negócio.");
      // Não recarrega os dados se houver erro
      return;
    }

    // --- NOVO CÓDIGO PARA REGISTRAR EVENTO ---
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const etapaAnterior = etapas.find(e => String(e.id) === source.droppableId);
      const etapaNova = etapas.find(e => String(e.id) === destination.droppableId);

      if (user && etapaAnterior && etapaNova) {
        await supabase
          .from('crm_eventos_negocio')
          .insert({
            negocio_id: draggableId,
            user_id: user.id,
            tipo_evento: 'MUDANCA_ETAPA',
            detalhes: {
              de: etapaAnterior.nome_etapa,
              para: etapaNova.nome_etapa,
            }
          });
      }
    } catch (eventError) {
      console.error("Erro ao registrar evento de mudança de etapa:", eventError);
      // Continua mesmo se o log falhar, pois não é uma ação crítica
    }
    // --- FIM DO NOVO CÓDIGO ---

    onDataChange(); 
  };
    
  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex space-x-6 overflow-x-auto pb-4 justify-center">
              {etapas && etapas.length > 0 ? (
                etapas.map(etapa => {
                  const negociosDaEtapa = negocios.filter(n => String(n.etapa_id) === String(etapa.id));
                  const valorDaEtapa = negociosDaEtapa.reduce((sum, n) => sum + (n.valor || 0), 0);
                  return (
                    <EtapaColuna 
                      key={etapa.id} 
                      etapa={etapa} 
                      negocios={negociosDaEtapa.map((negocio, index) => (
                        <NegocioCard key={negocio.id} negocio={negocio} index={index} onCardClick={onNegocioClick} etapasDoFunil={etapas} />
                      ))}
                      totalValor={valorDaEtapa}
                      totalNegocios={negociosDaEtapa.length}
                    />
                  );
                })
              ) : (
                <div className="w-full text-center py-10"><p className="text-gray-500 dark:text-gray-400">Nenhum negócio encontrado.</p></div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}
    </>
  );
};

export default CrmBoard;
