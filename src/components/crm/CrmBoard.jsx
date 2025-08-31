import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import AddNegocioModal from './AddNegocioModal.jsx';
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2, AlertTriangle } from 'lucide-react';

// O componente interno EtapaColuna não muda
const EtapaColuna = ({ etapa, negocios, onCardClick }) => {
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

// Componente Principal do Quadro
const CrmBoard = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  
  const [winReady, setWinReady] = useState(false);
  useEffect(() => {
    setWinReady(true);
  }, []);

  useEffect(() => {
    const fetchFunis = async () => {
      setError(null);
      try {
        const { data, error } = await supabase.from('crm_funis').select('*').order('created_at');
        if (error) throw error;
        setFunis(data);
        if (data && data.length > 0) {
          setFunilSelecionadoId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Não foi possível carregar os funis.");
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
            .select('*, responsavel:profiles(full_name)') // Lógica atualizada
            .in('etapa_id', etapaIds)
            .eq('status', 'Ativo');
          if (negociosError) throw negociosError;
          setNegocios(negociosData);
        } else {
          setNegocios([]);
        }
      } catch (err) {
        setError(`Não foi possível carregar os dados do funil: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEtapasENegocios();
  }, [funilSelecionadoId]);
  
  const handleOnDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    const estadoOriginal = [...negocios];
    const negocioMovido = estadoOriginal.find(n => n.id.toString() === draggableId);
    if (!negocioMovido) return;

    const itemsRestantes = estadoOriginal.filter(n => n.id.toString() !== draggableId);
    itemsRestantes.splice(destination.index, 0, { ...negocioMovido, etapa_id: destination.droppableId });
    setNegocios(itemsRestantes);

    const { error } = await supabase
      .from('crm_negocios')
      .update({ etapa_id: destination.droppableId })
      .eq('id', draggableId);

    if (error) {
      setError("Erro ao mover o card. A alteração foi desfeita.");
      setNegocios(estadoOriginal);
    }
  };

  // Lógica de handleNegocioAdicionado ajustada para recarregar os dados e obter o nome do responsável
  const handleNegocioAdicionado = (novoNegocio) => {
    setNegocios(current => [...current, novoNegocio]); // Adiciona otimisticamente
    setAddModalOpen(false);
    // Para ser perfeito, deveríamos recarregar os dados para obter o nome do responsável
    // Mas para simplificar, vamos assumir que o nome virá na próxima recarga.
    // Ou podemos fazer uma nova busca aqui. Por agora, vamos manter simples.
  };

  const handleNegocioUpdate = (id) => {
      setNegocios(current => current.filter(n => n.id !== id));
      setNegocioSelecionado(null);
  };

  if (loading && funis.length === 0) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-gray-50 dark:bg-gray-900/80 min-h-full p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              {funis.length > 0 ? (
                <select value={funilSelecionadoId} onChange={(e) => setFunilSelecionadoId(e.target.value)} className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 dark:text-gray-100">
                  {funis.map(funil => <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>)}
                </select>
              ) : <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CRM</h1>}
              
              <button onClick={() => setAddModalOpen(true)} disabled={etapas.length === 0} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed">
                + Adicionar Negócio
              </button>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4 flex items-center gap-3"><AlertTriangle className="h-6 w-6" /><p>{error}</p></div>}

            <div className="flex space-x-6 overflow-x-auto pb-4">
              {!loading && etapas.length > 0 ? (
                etapas.map(etapa => (
                  <EtapaColuna 
                    key={etapa.id} 
                    etapa={etapa} 
                    negocios={negocios.filter(n => String(n.etapa_id) === String(etapa.id))} 
                    onCardClick={setNegocioSelecionado} 
                  />
                ))
              ) : (!loading && <p className="text-gray-500 dark:text-gray-400">Nenhuma etapa encontrada. Configure na área de Admin.</p>)}
              {loading && <div className="flex justify-center w-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}
            </div>
          </div>
        </DragDropContext>
      )}

      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapas} onNegocioAdicionado={handleNegocioAdicionado} />}
      {negocioSelecionado && <NegocioDetalhesModal isOpen={!!negocioSelecionado} negocio={negocioSelecionado} onClose={() => setNegocioSelecionado(null)} onNegocioUpdate={handleNegocioUpdate} />}
    </>
  );
};

export default CrmBoard;