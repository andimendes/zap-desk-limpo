import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import AddNegocioModal from './AddNegocioModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Loader2, AlertTriangle } from 'lucide-react';

const NegocioCard = ({ negocio, index }) => {
  return (
    <Draggable draggableId={String(negocio.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 border-blue-500 ${
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

const EtapaColuna = ({ etapa, negocios }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-80 flex-shrink-0">
      <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        {etapa.nome_etapa}
      </h3>
      <Droppable droppableId={String(etapa.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`h-full min-h-[200px] transition-colors duration-200 rounded-md ${
              snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/30' : ''
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

const CrmBoard = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchFunis = async () => {
      setError(null);
      try {
        const { data, error } = await supabase.from('crm_funis').select('*').order('created_at');
        if (error) throw error;
        setFunis(data);
        if (data.length > 0) {
          setFunilSelecionadoId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setError("Não foi possível carregar os funis. Verifique se existem funis criados.");
        setLoading(false);
      }
    };
    fetchFunis();
  }, []);

  useEffect(() => {
    if (!funilSelecionadoId) return;

    const fetchEtapasENegocios = async () => {
      setLoading(true);
      setError(null);
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
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newNegocios = Array.from(negocios);
    const negocioArrastado = newNegocios.find(n => String(n.id) === draggableId);
    
    if (negocioArrastado) {
      negocioArrastado.etapa_id = destination.droppableId;
      setNegocios(newNegocios);

      const { error } = await supabase
        .from('crm_negocios')
        .update({ etapa_id: destination.droppableId })
        .eq('id', draggableId);

      if (error) {
        setError("Erro ao atualizar o negócio. A alteração foi revertida.");
        // Reverte a alteração no estado em caso de erro
        const revertedNegocios = Array.from(negocios);
        const originalNegocio = revertedNegocios.find(n => String(n.id) === draggableId);
        if(originalNegocio) originalNegocio.etapa_id = source.droppableId;
        setNegocios(revertedNegocios);
      }
    }
  };

  if (loading && !funis.length) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="bg-gray-50 dark:bg-gray-900/80 min-h-full p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
             {funis.length > 0 ? (
                <select
                    value={funilSelecionadoId}
                    onChange={(e) => setFunilSelecionadoId(e.target.value)}
                    className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 dark:text-gray-100"
                >
                    {funis.map(funil => (
                    <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>
                    ))}
                </select>
             ) : <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CRM</h1>}
            
            <button
              onClick={() => setAddModalOpen(true)}
              disabled={etapas.length === 0}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              + Adicionar Negócio
            </button>
          </div>

          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4 flex items-center gap-3"><AlertTriangle className="h-6 w-6" /><p>{error}</p></div>}

          <div className="flex space-x-6 overflow-x-auto pb-4">
            {!loading && etapas.length > 0 ? (
              etapas.map(etapa => {
                const negociosDaEtapa = negocios.filter(n => String(n.etapa_id) === String(etapa.id));
                return <EtapaColuna key={etapa.id} etapa={etapa} negocios={negociosDaEtapa} />;
              })
            ) : (
              !loading && <p className="text-gray-500 dark:text-gray-400">Nenhuma etapa encontrada para este funil. Configure-o na área de Admin.</p>
            )}
            {loading && etapas.length === 0 && <div className="flex justify-center w-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}
          </div>
        </div>
      </DragDropContext>

      {etapas.length > 0 && <AddNegocioModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        etapas={etapas}
        onNegocioAdicionado={handleNegocioAdicionado}
      />}
    </>
  );
};

export default CrmBoard;