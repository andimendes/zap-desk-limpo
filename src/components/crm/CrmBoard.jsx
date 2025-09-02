// src/components/crm/CrmBoard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2 } from 'lucide-react';

const EtapaColuna = ({ etapa, negocios, totalValor, totalNegocios }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">{etapa.nome_etapa}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}・{totalNegocios} negócio(s)
        </p>
      </div>
      <Droppable droppableId={String(etapa.id)}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-grow min-h-[200px] transition-colors duration-200 rounded-md ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
            {negocios}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// --- MUDANÇA 1: RECEBEMOS 'listaDeUsers' COMO PROP ---
const CrmBoard = ({ funilSelecionadoId, onEtapasCarregadas, onDataChange, listaDeUsers }) => {
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  
  // O estado de 'listaDeUsers' foi removido daqui.
  
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  // --- MUDANÇA 2: A LÓGICA PARA BUSCAR USUÁRIOS FOI REMOVIDA DAQUI ---
  // A busca agora é feita pelo componente pai (PaginaCRM).

  const fetchEtapasENegocios = useCallback(async () => {
      if (!funilSelecionadoId) return;
      setLoading(true);
      setError(null);
      try {
        const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
        if (etapasError) throw etapasError;
        setEtapas(etapasData);
        onEtapasCarregadas(etapasData);

        const etapaIds = etapasData.map(e => e.id);
        if (etapaIds.length > 0) {
          const { data: negociosData, error: negociosError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').in('etapa_id', etapaIds).eq('status', 'Ativo');
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
  }, [funilSelecionadoId, onEtapasCarregadas]);

  useEffect(() => {
    fetchEtapasENegocios();
  }, [fetchEtapasENegocios]);
  
  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const novosNegocios = negocios.map(n => String(n.id) === draggableId ? { ...n, etapa_id: destination.droppableId } : n);
    setNegocios(novosNegocios);
    const { error } = await supabase.from('crm_negocios').update({ etapa_id: destination.droppableId }).eq('id', draggableId);
    if (error) {
      alert("Erro ao mover o negócio.");
      fetchEtapasENegocios();
    } else {
      onDataChange();
    }
  };
    
  const handleNegocioDataChange = (negocioAtualizado) => {
    if (negocioAtualizado.status === 'Excluido') {
        setNegocios(current => current.filter(n => n.id !== negocioAtualizado.id));
    } else {
        setNegocios(current => current.map(n => n.id === negocioAtualizado.id ? negocioAtualizado : n));
        if (negocioSelecionado && negocioSelecionado.id === negocioAtualizado.id) {
            setNegocioSelecionado(negocioAtualizado);
        }
    }
    onDataChange();
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="flex space-x-6 overflow-x-auto pb-4 justify-center">
              {loading ? (
                <div className="flex justify-center w-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
              ) : etapas.length > 0 ? (
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
                <div className="w-full text-center py-10"><p className="text-gray-500 dark:text-gray-400">Nenhuma etapa encontrada para este funil.</p></div>
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
          onDataChange={handleNegocioDataChange}
          etapasDoFunil={etapas} 
          // --- MUDANÇA 3: O MODAL AGORA RECEBE A LISTA DE USUÁRIOS DA PROP ---
          listaDeUsers={listaDeUsers}
        />}
    </>
  );
};

export default CrmBoard;