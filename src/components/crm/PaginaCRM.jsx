// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import AddNegocioModal from './AddNegocioModal';
import FiltrosPopover from './FiltrosPopover';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter, Loader2 } from 'lucide-react';

const PaginaCRM = () => {
  // Estados de controle da UI
  const [viewMode, setViewMode] = useState('kanban');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  
  // Estados de dados
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtros, setFiltros] = useState({ responsavelId: 'todos', dataInicio: '', dataFim: '' });
  
  // --- MUDANÇA 1: O ESTADO DOS NEGÓCIOS E O LOADING AGORA VIVEM AQUI ---
  const [negocios, setNegocios] = useState([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);

  // Busca inicial de dados que não mudam (funis e usuários)
  useEffect(() => {
    const fetchData = async () => {
      const [funisRes, usersRes] = await Promise.all([
        supabase.from('crm_funis').select('*').order('created_at'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);
      if (funisRes.data) {
        setFunis(funisRes.data);
        if (funisRes.data.length > 0) setFunilSelecionadoId(funisRes.data[0].id);
      }
      if (usersRes.data) setListaDeUsers(usersRes.data);
    };
    fetchData();
  }, []);

  // --- MUDANÇA 2: A LÓGICA DE BUSCA DE NEGÓCIOS FOI MOVIDA PARA CÁ ---
  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) return;
    setLoadingNegocios(true);
    
    // 1. Busca as etapas do funil selecionado
    const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
    if (etapasError) {
      console.error("Erro ao buscar etapas:", etapasError);
      setLoadingNegocios(false);
      return;
    }
    setEtapasDoFunil(etapasData);

    // 2. Monta a busca de negócios com base nos filtros
    const etapaIds = etapasData.map(e => e.id);
    if (etapaIds.length > 0) {
      let query = supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').in('etapa_id', etapaIds).eq('status', 'Ativo');
      if (filtros.responsavelId !== 'todos') query = query.eq('responsavel_id', filtros.responsavelId);
      if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio);
      if (filtros.dataFim) query = query.lte('created_at', filtros.dataFim);

      const { data: negociosData, error: negociosError } = await query;
      if (negociosError) console.error("Erro ao buscar negócios:", negociosError);
      else setNegocios(negociosData || []);
    } else {
      setNegocios([]);
    }
    setLoadingNegocios(false);
  }, [funilSelecionadoId, filtros]); // A busca agora depende do funil e dos filtros

  // Este efeito executa a busca sempre que o funil ou os filtros mudam.
  useEffect(() => {
    fetchDadosDoFunil();
  }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
    setIsFiltrosOpen(false);
  };
  
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">{/* ...cabeçalho sem alterações... */}</header>
        <section className="mb-6"><CrmDashboard /></section>

        <main>
          {/* O conteúdo principal agora verifica o estado de loading */}
          {loadingNegocios ? (
            <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
          ) : viewMode === 'kanban' ? (
            <CrmBoard 
              // --- MUDANÇA 3: PASSAMOS OS DADOS PRONTOS PARA O KANBAN ---
              etapas={etapasDoFunil}
              negocios={negocios}
              listaDeUsers={listaDeUsers}
              onDragEnd={fetchDadosDoFunil} // Para recarregar após arrastar
              onDataChange={fetchDadosDoFunil} // Para recarregar após editar/excluir
            />
          ) : (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="font-bold text-2xl text-gray-700 dark:text-gray-300">Visualização em Lista</h2>
              <p className="text-gray-500 mt-2">Esta área será construída no próximo passo.</p>
            </div>
          )}
        </main>
      </div>

      {isFiltrosOpen && <FiltrosPopover onClose={() => setIsFiltrosOpen(false)} listaDeUsers={listaDeUsers} filtrosAtuais={filtros} onAplicarFiltros={handleAplicaFiltros} />}
      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} onNegocioAdicionado={fetchDadosDoFunil} />}
    </>
  );
};

export default PaginaCRM;