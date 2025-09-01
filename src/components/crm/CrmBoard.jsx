// src/components/crm/CrmBoard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import AddNegocioModal from './AddNegocioModal.jsx';
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2, AlertTriangle, Users } from 'lucide-react';

// --- COMPONENTE DA COLUNA ATUALIZADO ---
const EtapaColuna = ({ etapa, negocios, onCardClick, totalValor, totalNegocios }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">
          {etapa.nome_etapa}
        </h3>
        {/* NOVO: Resumo da etapa com valor e contagem */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}・{totalNegocios} negócio(s)
        </p>
      </div>
      <Droppable droppableId={String(etapa.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow min-h-[200px] transition-colors duration-200 rounded-md ${
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

const CrmBoard = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtroResponsavelId, setFiltroResponsavelId] = useState('todos');
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Usando Promise.all para buscar funis e usuários em paralelo
      const [funisRes, usersRes] = await Promise.all([
        supabase.from('crm_funis').select('*').order('created_at'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);

      if (funisRes.error) {
        setError("Não foi possível carregar os funis.");
      } else {
        setFunis(funisRes.data);
        if (funisRes.data && funisRes.data.length > 0) {
          setFunilSelecionadoId(funisRes.data[0].id);
        }
      }
      
      if (usersRes.error) {
        setError("Não foi possível carregar a lista de responsáveis.");
      } else {
        setListaDeUsers(usersRes.data);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!funilSelecionadoId) return;

    const fetchEtapasENegocios = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
        if (etapasError) throw etapasError;
        setEtapas(etapasData);
        
        const etapaIds = etapasData.map(e => e.id);
        if (etapaIds.length > 0) {
          let query = supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').in('etapa_id', etapaIds).eq('status', 'Ativo');
          
          if (filtroResponsavelId !== 'todos') {
            query = query.eq('responsavel_id', filtroResponsavelId);
          }
          
          const { data: negociosData, error: negociosError } = await query;
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
  }, [funilSelecionadoId, filtroResponsavelId]);
  
  const handleOnDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const negocioMovido = negocios.find(n => String(n.id) === draggableId);
    if (negocioMovido.etapa_id === destination.droppableId) return;

    // Atualização otimista da UI
    const novosNegocios = negocios.map(n => 
      String(n.id) === draggableId ? { ...n, etapa_id: destination.droppableId } : n
    );
    setNegocios(novosNegocios);

    // Atualização no Supabase
    const { error } = await supabase.from('crm_negocios').update({ etapa_id: destination.droppableId }).eq('id', draggableId);
    if (error) {
      alert("Erro ao mover o negócio. A página será atualizada.");
      // Reverte a UI em caso de erro
      setNegocios(negocios);
    }
  };
  
  const handleNegocioAdicionado = (novoNegocio) => { setNegocios(current => [...current, novoNegocio]); };
  
  const handleNegocioUpdate = (id) => {
    setNegocios(current => current.filter(n => n.id !== id));
    setNegocioSelecionado(null);
  };
  
  const handleNegocioDataChange = (negocioAtualizado) => {
    setNegocios(currentNegocios => currentNegocios.map(n => n.id === negocioAtualizado.id ? negocioAtualizado : n));
    // Atualiza também o negócio selecionado no modal para refletir a mudança imediatamente
    if (negocioSelecionado && negocioSelecionado.id === negocioAtualizado.id) {
      setNegocioSelecionado(negocioAtualizado);
    }
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-gray-50 dark:bg-gray-900/80 min-h-full p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <select value={funilSelecionadoId} onChange={(e) => setFunilSelecionadoId(e.target.value)} className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 dark:text-gray-100">
                  {funis.map(funil => <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <select
                    value={filtroResponsavelId}
                    onChange={(e) => setFiltroResponsavelId(e.target.value)}
                    className="bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 border-none focus:ring-0"
                  >
                    <option value="todos">Todos os Responsáveis</option>
                    {listaDeUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => setAddModalOpen(true)} disabled={etapas.length === 0} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                + Adicionar Negócio
              </button>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4"><p>{error}</p></div>}
            
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {loading ? (
                <div className="flex justify-center w-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
              ) : etapas.length > 0 ? (
                etapas.map(etapa => {
                  // Lógica para calcular os totais da etapa
                  const negociosDaEtapa = negocios.filter(n => String(n.etapa_id) === String(etapa.id));
                  const valorDaEtapa = negociosDaEtapa.reduce((sum, n) => sum + (n.valor || 0), 0);
                  
                  return (
                    <EtapaColuna 
                      key={etapa.id} 
                      etapa={etapa} 
                      negocios={negociosDaEtapa} 
                      onCardClick={setNegocioSelecionado} 
                      totalValor={valorDaEtapa}
                      totalNegocios={negociosDaEtapa.length}
                    />
                  );
                })
              ) : (
                <div className="w-full text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma etapa encontrada para este funil.</p>
                  <p className="text-sm text-gray-400">Vá em Configurações para adicionar etapas ao funil "{funis.find(f=>f.id === funilSelecionadoId)?.nome_funil}".</p>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapas} onNegocioAdicionado={handleNegocioAdicionado} />}
      
      {negocioSelecionado && 
        <NegocioDetalhesModal 
          isOpen={!!negocioSelecionado} 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
          onNegocioUpdate={handleNegocioUpdate}
          onDataChange={handleNegocioDataChange}
          // --- NOVO: Passando props adicionais para o modal redesenhado ---
          etapasDoFunil={etapas} 
          listaDeUsers={listaDeUsers}
        />}
    </>
  );
};

export default CrmBoard;