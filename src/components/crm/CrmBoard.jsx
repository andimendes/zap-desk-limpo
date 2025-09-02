// src/components/crm/CrmBoard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

const EtapaColuna = ({ etapa, negocios, totalValor, totalNegocios }) => {
  // ... (Componente EtapaColuna continua o mesmo)
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

// --- MUDANÇA 1: O COMPONENTE AGORA É MUITO MAIS SIMPLES ---
// Ele recebe as listas de 'etapas', 'negocios' e 'listaDeUsers' prontas.
// E recebe funções 'onDragEnd' e 'onDataChange' para avisar o pai de qualquer mudança.
const CrmBoard = ({ etapas, negocios, listaDeUsers, onDragEnd, onDataChange }) => {
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  // --- MUDANÇA 2: TODA A LÓGICA DE BUSCA DE DADOS FOI REMOVIDA DAQUI ---

  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    // Otimismo: Atualiza a UI imediatamente (esta parte é opcional mas melhora a experiência)
    // A lógica principal de atualização está no pai.
    
    // Atualiza o negócio no banco de dados
    const { error } = await supabase.from('crm_negocios').update({ etapa_id: destination.droppableId }).eq('id', draggableId);
    if (error) {
      alert("Erro ao mover o negócio.");
    }
    // Avisa o componente pai para recarregar todos os dados.
    onDragEnd(); 
  };
    
  const handleNegocioDataChange = () => {
    // Apenas avisa o componente pai que algo mudou (ex: um negócio foi editado ou excluído)
    onDataChange();
    setNegocioSelecionado(null);
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex space-x-6 overflow-x-auto pb-4 justify-center">
              {etapas.length > 0 ? (
                etapas.map(etapa => {
                  const negociosDaEtapa = negocios.filter(n => String(n.etapa_id) === String(etapa.id));
                  const valorDaEtapa = negociosDaEtapa.reduce((sum, n) => sum + (n.valor || 0), 0);
                  return (
                    <EtapaColuna 
                      key={etapa.id} 
                      etapa={etapa} 
                      negocios={negociosDaEtapa.map((negocio, index) => (
                        <NegocioCard key={negocio.id} negocio={negocio} index={index} onCardClick={setNegocioSelecionado} etapasDoFunil={etapas} />
                      ))}
                      totalValor={valorDaEtapa}
                      totalNegocios={negociosDaEtapa.length}
                    />
                  );
                })
              ) : (
                <div className="w-full text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">Nenhum negócio encontrado com os filtros atuais.</p>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {negocioSelecionado && 
        <NegocioDetalhesModal 
          isOpen={!!negocioSelecionado} 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
          onDataChange={handleNegocioDataChange} // O modal agora chama esta função simplificada
          etapasDoFunil={etapas} 
          listaDeUsers={listaDeUsers}
        />}
    </>
  );
};

export default CrmBoard;