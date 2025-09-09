// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { getNegocios } from '@/services/negocioService';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import CrmListView from './CrmListView';
import AddNegocioModal from './AddNegocioModal';
import NegocioDetalhesModal from './NegocioDetalhesModal';
import EmpresaDetalhesModal from './EmpresaDetalhesModal';
import FiltrosPopover from './FiltrosPopover';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ErrorBoundary from '../ErrorBoundary';

const PaginaCRM = () => {
  // --- NENHUMA ALTERAÇÃO NOS ESTADOS ---
  const [viewMode, setViewMode] = useState('kanban');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const filtrosButtonRef = useRef(null);
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState(null);
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtros, setFiltros] = useState({ responsavelId: 'todos', dataInicio: '', dataFim: '' });
  const [negocios, setNegocios] = useState([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [termoPesquisaDebounced, setTermoPesquisaDebounced] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('Ativo');
  const [dataVersion, setDataVersion] = useState(0);

  // --- NENHUMA ALTERAÇÃO NOS useEffect INICIAIS ---
  useEffect(() => {
    const timerId = setTimeout(() => { setTermoPesquisaDebounced(termoPesquisa); }, 500);
    return () => { clearTimeout(timerId); };
  }, [termoPesquisa]);

  useEffect(() => {
    const fetchData = async () => {
      const [funisRes, usersRes] = await Promise.all([
        supabase.from('crm_funis').select('id, nome_funil').order('created_at'),
        supabase.from('profiles').select('id, full_name, avatar_url').order('full_name')
      ]);
      if (funisRes.data) {
        setFunis(funisRes.data);
        if (funisRes.data.length > 0) {
          setFunilSelecionadoId(funisRes.data[0].id);
        } else { setLoadingNegocios(false); }
      }
      if (usersRes.data) setListaDeUsers(usersRes.data || []);
    };
    fetchData();
  }, []);

  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) {
      setNegocios([]);
      setLoadingNegocios(false);
      return;
    }
    setLoadingNegocios(true);
    try {
      const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
      if (etapasError) throw etapasError;
      setEtapasDoFunil(etapasData || []);
      
      const etapaIds = (etapasData || []).map(e => e.id);

      const filtrosParaApi = {
        status: filtroStatus,
        etapaIds: etapaIds,
        responsavelId: filtros.responsavelId,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        termoPesquisa: termoPesquisaDebounced,
      };

      const { data: negociosData, error: negociosError } = await getNegocios(filtrosParaApi);
      
      if (negociosError) throw negociosError;
      
      setNegocios(negociosData || []);

    } catch (error) {
      console.error("Ocorreu um erro ao buscar dados do funil:", error);
      setNegocios([]);
    } finally {
      setLoadingNegocios(false);
    }
  }, [funilSelecionadoId, filtros, termoPesquisaDebounced, filtroStatus]);

  useEffect(() => { fetchDadosDoFunil(); }, [fetchDadosDoFunil]);
  
  const handleAplicaFiltros = (novosFiltros) => { setFiltros(novosFiltros); setIsFiltrosOpen(false); };
  
  // --- ALTERAÇÃO PRINCIPAL AQUI ---
  // Substituímos a antiga 'handleDataChange' por esta versão mais inteligente.
  const handleRefreshData = (updatedData = null) => {
    // Se recebemos um objeto de negócio atualizado (como ao mudar de etapa)
    if (updatedData && typeof updatedData === 'object' && updatedData.id) {
        // Atualizamos a lista de negócios de forma eficiente, sem nova chamada à API
        setNegocios(prevNegocios =>
            prevNegocios.map(n => (n.id === updatedData.id ? updatedData : n))
        );
        // E garantimos que o negócio selecionado (no modal) também receba os novos dados
        if (negocioSelecionado && negocioSelecionado.id === updatedData.id) {
            setNegocioSelecionado(updatedData);
        }
    } else {
        // Se não recebemos dados específicos (ex: ao adicionar nova tarefa ou novo negócio),
        // simplesmente buscamos a lista inteira novamente.
        fetchDadosDoFunil();
    }
    // Incrementamos a versão dos dados para atualizar componentes como o Dashboard
    setDataVersion(v => v + 1);
    
    // O mais importante: NÃO chamamos setNegocioSelecionado(null) aqui.
  };

  const handleAbrirDetalhesEmpresa = (empresa) => {
    setEmpresaSelecionada(empresa);
    setNegocioSelecionado(null);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        {/* Nenhuma alteração no Header */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Funil de Vendas</h1>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Filter size={16} />
                <select value={funilSelecionadoId || ''} onChange={(e) => setFunilSelecionadoId(e.target.value)} className="text-sm font-medium bg-transparent border-none focus:ring-0">
                  {funis.map(funil => <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>)}
                </select>
              </div>
            </div>
            <div className="w-full md:w-auto flex flex-wrap items-center justify-start md:justify-end gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Pesquisar negócios..." className="pl-10 pr-4 py-2 w-full sm:w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700" value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)} />
              </div>
              
              {filtroStatus === 'Ativo' && (
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                  <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`} title="Visualização em Kanban"><LayoutGrid size={20} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`} title="Visualização em Lista"><List size={20} /></button>
                </div>
              )}

              <div className="relative">
                <button ref={filtrosButtonRef} onClick={() => setIsFiltrosOpen(!isFiltrosOpen)} className="flex items-center gap-2 py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                  <SlidersHorizontal size={16} /> Filtros
                </button>
                {isFiltrosOpen && (<FiltrosPopover onClose={() => setIsFiltrosOpen(false)} listaDeUsers={listaDeUsers} filtrosAtuais={filtros} onAplicarFiltros={handleAplicaFiltros} buttonRef={filtrosButtonRef} />)}
              </div>
              <button onClick={() => setAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={20} /> Novo Negócio</button>
            </div>
          </div>
        </header>
        
        {/* Nenhuma alteração nos botões de filtro de status */}
        <div className="flex items-center gap-2 mb-6 border-b dark:border-gray-700 overflow-x-auto">
            <button onClick={() => setFiltroStatus('Ativo')} className={`flex items-center gap-2 py-3 px-4 text-sm font-medium whitespace-nowrap ${filtroStatus === 'Ativo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <LayoutGrid size={16} /> Em Andamento
            </button>
            <button onClick={() => setFiltroStatus('Ganho')} className={`flex items-center gap-2 py-3 px-4 text-sm font-medium whitespace-nowrap ${filtroStatus === 'Ganho' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <CheckCircle2 size={16} /> Ganhos
            </button>
            <button onClick={() => setFiltroStatus('Perdido')} className={`flex items-center gap-2 py-3 px-4 text-sm font-medium whitespace-nowrap ${filtroStatus === 'Perdido' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <XCircle size={16} /> Perdidos
            </button>
        </div>

        <section className="mb-6">
          <CrmDashboard funilId={funilSelecionadoId} dataVersion={dataVersion} />
        </section>
        
        <main>
          {loadingNegocios ? (
            <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
          ) : filtroStatus === 'Ativo' ? (
            viewMode === 'kanban' ? (
              // --- ALTERAÇÃO AQUI --- Passamos a nova função handleRefreshData
              <CrmBoard etapas={etapasDoFunil} negocios={negocios} onNegocioClick={setNegocioSelecionado} onDataChange={handleRefreshData} />
            ) : (
              <CrmListView negocios={negocios} etapas={etapasDoFunil} onNegocioClick={setNegocioSelecionado} />
            )
          ) : (
            <CrmListView negocios={negocios} etapas={etapasDoFunil} onNegocioClick={setNegocioSelecionado} />
          )}
        </main>
      </div>
      
      {/* --- ALTERAÇÃO AQUI --- Passamos a nova função handleRefreshData */}
      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} onNegocioAdicionado={handleRefreshData} />}
      
      {negocioSelecionado && (
        <ErrorBoundary>
            <NegocioDetalhesModal
                isOpen={!!negocioSelecionado}
                negocio={negocioSelecionado}
                onClose={() => setNegocioSelecionado(null)}
                // --- ALTERAÇÃO AQUI --- Passamos a nova função handleRefreshData
                onDataChange={handleRefreshData}
                etapasDoFunil={etapasDoFunil}
                listaDeUsers={listaDeUsers}
                onEmpresaClick={handleAbrirDetalhesEmpresa}
            />
        </ErrorBoundary>
      )}

      {empresaSelecionada && (
        <EmpresaDetalhesModal
          isOpen={!!empresaSelecionada}
          onClose={() => setEmpresaSelecionada(null)}
          empresa={empresaSelecionada}
          // --- ALTERAÇÃO AQUI --- Passamos a nova função handleRefreshData
          onEmpresaUpdate={handleRefreshData}
        />
      )}
    </>
  );
};
export default PaginaCRM;