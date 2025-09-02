// src/components/crm/CrmBoard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2 } from 'lucide-react';

const EtapaColuna = ({ etapa, negocios, totalValor, totalNegocios }) => {
  // ... (Componente EtapaColuna continua o mesmo)
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

// O CrmBoard agora recebe o ID do funil como uma "prop"
const CrmBoard = ({ funilSelecionadoId, onEtapasCarregadas, onDataChange }) => {
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  
  // O winReady continua sendo útil para o Drag and Drop
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  // Busca a lista de usuários (responsáveis) uma única vez
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name');
      if (error) console.error("Não foi possível carregar a lista de responsáveis.");
      else setListaDeUsers(data);
    };
    fetchUsers();
  }, []);

  // A função de buscar dados agora depende do funilSelecionadoId que vem de fora
  const fetchEtapasENegocios = useCallback(async () => {
      if (!funilSelecionadoId) return;
      setLoading(true);
      setError(null);
      try {
        const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
        if (etapasError) throw etapasError;
        setEtapas(etapasData);
        onEtapasCarregadas(etapasData); // Avisa o componente pai sobre as etapas carregadas

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
      onDataChange(); // Avisa o pai que um dado mudou
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
    onDataChange(); // Avisa o pai que um dado mudou
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          {/* --- AJUSTE 2 e 3: O CABEÇALHO ANTIGO FOI REMOVIDO DAQUI --- */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="flex space-x-6 overflow-x-auto pb-4">
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

      {/* O Modal de detalhes continua aqui, pois é específico do Board */}
      {negocioSelecionado && 
        <NegocioDetalhesModal 
          isOpen={!!negocioSelecionado} 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
          onDataChange={handleNegocioDataChange}
          etapasDoFunil={etapas} 
          listaDeUsers={listaDeUsers}
        />}
    </>
  );
};

export default CrmBoard;