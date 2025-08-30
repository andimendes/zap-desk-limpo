import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AddNegocioModal from './AddNegocioModal';
import NegocioDetalhesModal from './NegocioDetalhesModal';
import { DragDropContext, Droppable } from '@hello-pangea/dnd'; // -> Biblioteca atualizada
import { Loader2, AlertTriangle } from 'lucide-react';
import NegocioCard from './NegocioCard';

// Componente da Coluna (Etapa)
const EtapaColuna = ({ etapa, negocios, onCardClick }) => {
  // ... (conteúdo do componente EtapaColuna - sem alterações)
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-80 flex-shrink-0">
      <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        {etapa.nome_etapa}
      </h3>
      <Droppable droppableId={String(etapa.id)}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="h-full min-h-[200px]">
            {negocios.map((negocio, index) => (
              <NegocioCard 
                key={negocio.id} 
                negocio={negocio} 
                index={index}
                onCardClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Componente Principal do Quadro CRM
const CrmBoard = () => {
  // ... (todos os seus 'useState' hooks existentes)
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);

  // -> INÍCIO DA CORREÇÃO PARA O ERRO "Invariant failed"
  const [winReady, setWinReady] = useState(false);
  useEffect(() => {
    setWinReady(true);
  }, []);
  // -> FIM DA CORREÇÃO

  useEffect(() => {
    const fetchFunis = async () => { /* ... (código existente, verifique se está completo no seu ficheiro) ... */ };
    fetchFunis();
  }, []);

  useEffect(() => {
    if (!funilSelecionadoId) return;
    const fetchEtapasENegocios = async () => { /* ... (código existente, verifique se está completo no seu ficheiro) ... */ };
    fetchEtapasENegocios();
  }, [funilSelecionadoId]);

  const handleCardClick = (negocio) => setNegocioSelecionado(negocio);
  const handleNegocioUpdate = (negocioId) => {
    setNegocios(current => current.filter(n => n.id !== negocioId));
    setNegocioSelecionado(null);
  };
  const handleNegocioAdicionado = (novo) => setNegocios(current => [...current, novo]);

  const handleOnDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Lógica otimista de UI
    const items = Array.from(negocios);
    const [movedItem] = items.filter(n => n.id.toString() === draggableId);
    const remainingItems = items.filter(n => n.id.toString() !== draggableId);
    
    const updatedItem = { ...movedItem, etapa_id: parseInt(destination.droppableId) };
    remainingItems.splice(destination.index, 0, updatedItem);
    setNegocios(remainingItems);

    // Sincronização com a base de dados
    const { error } = await supabase.from('crm_negocios').update({ etapa_id: destination.droppableId }).eq('id', draggableId);
    if (error) {
      setError("Erro ao mover o negócio. A alteração foi revertida.");
      setNegocios(negocios); // Reverte em caso de erro
    }
  };
  
  return (
    <>
      {winReady && ( // -> Apenas renderiza quando o componente está pronto
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-gray-50 dark:bg-gray-900/80 min-h-full p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
               {/* ... (código do header existente, verifique se está completo no seu ficheiro) ... */}
               <button onClick={() => setAddModalOpen(true)}>+ Adicionar Negócio</button>
            </div>

            {error && <div className="bg-red-100 ...">{error}</div>}

            {/* Quadro Kanban */}
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {etapas.map(etapa => {
                  const negociosDaEtapa = negocios.filter(n => n.etapa_id.toString() === etapa.id.toString());
                  return (
                    <EtapaColuna 
                      key={etapa.id} 
                      etapa={etapa} 
                      negocios={negociosDaEtapa}
                      onCardClick={handleCardClick}
                    />
                  );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Modais */}
      {isAddModalOpen && <AddNegocioModal onClose={() => setAddModalOpen(false)} onNegocioAdicionado={handleNegocioAdicionado} etapas={etapas} />}
      {negocioSelecionado && <NegocioDetalhesModal negocio={negocioSelecionado} onClose={() => setNegocioSelecionado(null)} onNegocioUpdate={handleNegocioUpdate} />}
    </>
  );
};

export default CrmBoard;