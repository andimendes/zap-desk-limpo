// src/components/crm/CrmBoard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import AddNegocioModal from './AddNegocioModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Componentes NegocioCard e EtapaColuna permanecem os mesmos...
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
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // Função para buscar os dados iniciais (todos os funis)
  useEffect(() => {
    const fetchFunis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('crm_funis').select('*');
        if (error) throw error;
        setFunis(data);
        if (data.length > 0) {
          setFunilSelecionadoId(data[0].id);
        }
      } catch (error) {
        setError("Não foi possível carregar os funis.");
      } finally {
        setLoading(false);
      }
    };
    fetchFunis();
  }, []);

  // Função para buscar etapas e negócios QUANDO o funil selecionado muda
  useEffect(() => {
    if (!funilSelecionadoId) return;

    const fetchEtapasENegocios = async () => {
      setLoading(true);
      try {
        const { data: etapasData, error: etapasError } = await supabase
          .from('crm_etapas')
          .select('*')
          .eq('funil_id', funilSelecionadoId)
          .order('ordem', { ascending: true });
        if (etapasError) throw etapasError;
        setEtapas(etapasData);

        const etapaIds = etapasData.map(e => e.id);
        if (etapaIds.length > 0) {
          const { data: negociosData, error: negociosError } = await supabase
            .from('crm_negocios')
            .select('*')
            .in('etapa_id', etapaIds);
          if (negociosError) throw negociosError;
          setNegocios(negociosData);
        } else {
          setNegocios([]);
        }
      } catch (error) {
        setError("Não foi possível carregar os dados do funil.");
      } finally {
        setLoading(false);
      }
    };
    fetchEtapasENegocios();
  }, [funilSelecionadoId]);

  const handleNegocioAdicionado = (novoNegocio) => {
    setNegocios(currentNegocios => [...currentNegocios, novoNegocio]);
  };

  const handleOnDragEnd = async (result) => {
    // ... (lógica do drag and drop permanece a mesma)
  };

  if (loading && !funis.length) {
    return <div className="p-8 text-center text-xl">A carregar os seus pipelines...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-xl text-red-500">{error}</div>;
  }

  return (
    <>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="bg-gray-50 min-h-screen p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <select
                value={funilSelecionadoId}
                onChange={(e) => setFunilSelecionadoId(e.target.value)}
                className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0"
              >
                {funis.map(funil => (
                  <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
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
              <p>Nenhuma etapa encontrada para este funil. Configure-o na área de Admin.</p>
            )}
          </div>
        </div>
      </DragDropContext>

      <AddNegocioModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        etapas={etapas}
        onNegocioAdicionado={handleNegocioAdicionado}
      />
    </>
  );
};

export default CrmBoard;
