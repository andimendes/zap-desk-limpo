// src/components/crm/CrmBoard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import AddNegocioModal from './AddNegocioModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // <-- 1. IMPORTAR

// Componente para um único card de negócio (agora com props para o drag and drop)
const NegocioCard = ({ negocio, index }) => {
  return (
    <Draggable draggableId={negocio.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-4 mb-4 rounded-lg shadow-md border-l-4 border-blue-500 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
          }`}
        >
          <h4 className="font-bold text-gray-800">{negocio.titulo}</h4>
          <p className="text-sm text-gray-600 mt-1">{negocio.empresa_contato}</p>
          <p className="text-sm text-gray-500 mt-2">{negocio.nome_contato}</p>
          <div className="mt-3 text-right">
            <span className="text-lg font-semibold text-gray-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Componente para uma coluna (agora uma área "soltável")
const EtapaColuna = ({ etapa, negocios }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0">
      <h3 className="font-bold text-lg text-gray-700 mb-4 pb-2 border-b-2 border-gray-300">
        {etapa.nome_etapa}
      </h3>
      <Droppable droppableId={etapa.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`h-full min-h-[200px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {negocios.map((negocio, index) => (
              <NegocioCard key={negocio.id} negocio={negocio} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Componente principal do Quadro CRM
const CrmBoard = () => {
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    // ... (a função fetchData permanece a mesma)
  };

  useEffect(() => {
    // ... (o useEffect permanece o mesmo)
  }, []);

  const handleNegocioAdicionado = (novoNegocio) => {
    setNegocios(currentNegocios => [...currentNegocios, novoNegocio]);
  };

  // <-- 2. FUNÇÃO PRINCIPAL PARA O DRAG AND DROP -->
  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Se o card for solto fora de uma coluna, não faz nada
    if (!destination) {
      return;
    }

    // Se o card for solto na mesma posição em que começou, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Atualização otimista da UI (move o card visualmente antes de confirmar no DB)
    const negocioMovido = negocios.find(n => n.id === draggableId);
    const novosNegocios = negocios.filter(n => n.id !== draggableId);
    negocioMovido.etapa_id = destination.droppableId;
    novosNegocios.splice(destination.index, 0, negocioMovido);
    setNegocios(novosNegocios);

    // Atualizar a informação no Supabase
    try {
      const { error } = await supabase
        .from('crm_negocios')
        .update({ etapa_id: destination.droppableId })
        .eq('id', draggableId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar a etapa do negócio:", error);
      // Se der erro, reverte a UI para o estado anterior
      fetchData(); 
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl">A carregar o seu pipeline...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-xl text-red-500">{error}</div>;
  }

  return (
    <>
      <DragDropContext onDragEnd={handleOnDragEnd}> {/* <-- 3. ENVOLVER COM O CONTEXTO */}
        <div className="bg-gray-50 min-h-screen p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Central de Oportunidades</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              + Adicionar Negócio
            </button>
          </div>

          <div className="flex space-x-6 overflow-x-auto pb-4">
            {etapas.length > 0 ? (
              etapas.map(etapa => {
                const negociosDaEtapa = negocios.filter(n => n.etapa_id === etapa.id);
                return <EtapaColuna key={etapa.id} etapa={etapa} negocios={negociosDaEtapa} />;
              })
            ) : (
              <p>Nenhuma etapa encontrada. Crie um funil e etapas primeiro.</p>
            )}
          </div>
        </div>
      </DragDropContext>

      <AddNegocioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        etapas={etapas}
        onNegocioAdicionado={handleNegocioAdicionado}
      />
    </>
  );
};

export default CrmBoard;
