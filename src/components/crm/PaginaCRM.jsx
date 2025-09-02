// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import CrmListView from './CrmListView';
import AddNegocioModal from './AddNegocioModal';
import NegocioDetalhesModal from './NegocioDetalhesModal';
import FiltrosPopover from './FiltrosPopover';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter, Loader2 } from 'lucide-react';

const PaginaCRM = () => {
  // Estados de controle da UI
  const [viewMode, setViewMode] = useState('kanban');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const filtrosButtonRef = useRef(null);
  
  // Estados de dados
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtros, setFiltros] = useState({ responsavelId: 'todos', dataInicio: '', dataFim: '' });
  const [negocios, setNegocios] = useState([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);

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

  // Lógica de busca de negócios que agora vive neste componente
  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) return;
    setLoadingNegocios(true);
    
    const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
    if (etapasError) {
      console.error("Erro ao buscar etapas:", etapasError);
      setLoadingNegocios(false);
      return;
    }
    setEtapasDoFunil(etapasData);

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
  }, [funilSelecionadoId, filtros]);

  useEffect(() => {
    fetchDadosDoFunil();
  }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
    setIsFiltrosOpen(false);
  };
  
  const handleDataChange = () => {
    fetchDadosDoFunil();
    setNegocioSelecionado(null);
  };
  
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        {/* --- CÓDIGO DO CABEÇALHO RESTAURADO --- */}
        <header className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Funil de Vendas</h1>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Filter size={16} />
                <select value={funilSelecionadoId} onChange={(e) => setFunilSelecionadoId(e.target.value)} className="text-sm font-medium bg-transparent border-none focus:ring-0">
                  {funis.map(funil => <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" placeholder="Pesquisar negócios..." className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"/>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`} title="Visualização em Kanban"><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`} title="Visualização em Lista"><List size={20} /></button>
                </div>
                <div className="relative">
                  <button ref={filtrosButtonRef} onClick={() => setIsFiltrosOpen(!isFiltrosOpen)} className="flex items-center gap-2 py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                      <SlidersHorizontal size={16} /> Filtros
                  </button>
                  {isFiltrosOpen && (
                    <FiltrosPopover onClose={() => setIsFiltrosOpen(false)} listaDeUsers={listaDeUsers} filtrosAtuais={filtros} onAplicarFiltros={handleAplicaFiltros} buttonRef={filtrosButtonRef} />
                  )}
                </div>
                <button onClick={() => setAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={20} /> Novo Negócio</button>
            </div>
          </div>
        </header>

        <section className="mb-6">
            <CrmDashboard />
        </section>

        <main>
          {loadingNegocios ? (
            <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
          ) : viewMode === 'kanban' ? (
            <CrmBoard 
              etapas={etapasDoFunil}
              negocios={negocios}
              onNegocioClick={setNegocioSelecionado}
              onDataChange={handleDataChange}
            />
          ) : (
            <CrmListView 
              negocios={negocios}
              etapas={etapasDoFunil}
              onNegocioClick={setNegocioSelecionado}
            />
          )}
        </main>
      </div>

      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} onNegocioAdicionado={handleDataChange} />}

      {negocioSelecionado && 
        <NegocioDetalhesModal 
          isOpen={!!negocioSelecionado} 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
          onDataChange={handleDataChange}
          etapasDoFunil={etapasDoFunil} 
          listaDeUsers={listaDeUsers}
        />}
    </>
  );
};

export default PaginaCRM;