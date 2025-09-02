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
  // ... (outros estados permanecem iguais)
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

  // --- MUDANÇA 1: ESTADOS PARA A BARRA DE PESQUISA ---
  const [termoPesquisa, setTermoPesquisa] = useState(''); // Guarda o valor do input em tempo real
  const [termoPesquisaDebounced, setTermoPesquisaDebounced] = useState(''); // Guarda o valor após o usuário parar de digitar

  // --- MUDANÇA 2: EFEITO DE "DEBOUNCE" PARA A PESQUISA ---
  // Este efeito cria um temporizador. Ele espera 500ms após a última letra ser digitada
  // para então atualizar o 'termoPesquisaDebounced', que é o que realmente dispara a busca.
  useEffect(() => {
    const timerId = setTimeout(() => {
      setTermoPesquisaDebounced(termoPesquisa);
    }, 500); // 500ms de espera

    return () => {
      clearTimeout(timerId); // Limpa o temporizador se o usuário digitar novamente
    };
  }, [termoPesquisa]);


  useEffect(() => { /* ... (useEffect da busca inicial sem alterações) ... */ }, []);

  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) { /* ... (sem alterações) ... */ }
    setLoadingNegocios(true);
    try {
      const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
      if (etapasError) throw etapasError;
      setEtapasDoFunil(etapasData || []);
      const etapaIds = (etapasData || []).map(e => e.id);
      if (etapaIds.length > 0) {
        let query = supabase.from('crm_negocios').select('*, responsavel:profiles(full_name, avatar_url), created_at, contato_principal_nome').in('etapa_id', etapaIds).eq('status', 'Ativo');
        
        // Aplica os filtros (sem alteração)
        if (filtros.responsavelId !== 'todos') query = query.eq('responsavel_id', filtros.responsavelId);
        if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio);
        if (filtros.dataFim) query = query.lte('created_at', filtros.dataFim);

        // --- MUDANÇA 3: APLICA O FILTRO DE PESQUISA NA CONSULTA ---
        if (termoPesquisaDebounced) {
          // .or() busca em múltiplos campos. 'ilike' busca por texto parcial e ignora maiúsculas/minúsculas.
          query = query.or(`titulo.ilike.%${termoPesquisaDebounced}%,empresa_contato.ilike.%${termoPesquisaDebounced}%`);
        }

        const { data: negociosData, error: negociosError } = await query;
        if (negociosError) throw negociosError;
        
        // ... (lógica de enriquecimento de dados continua a mesma)

      } else {
        setNegocios([]);
      }
    } catch (error) {
      console.error("Ocorreu um erro ao buscar dados do funil:", error);
      setNegocios([]);
    } finally {
      setLoadingNegocios(false);
    }
  // --- MUDANÇA 4: A BUSCA AGORA DEPENDE DO TERMO PESQUISADO (DEBOUNCED) ---
  }, [funilSelecionadoId, filtros, termoPesquisaDebounced]);

  useEffect(() => { fetchDadosDoFunil(); }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => { setFiltros(novosFiltros); setIsFiltrosOpen(false); };
  const handleDataChange = () => { fetchDadosDoFunil(); setNegocioSelecionado(null); };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-baseline gap-4">{/* ... (título e seletor de funil sem alterações) ... */}</div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                {/* --- MUDANÇA 5: CONECTAMOS O INPUT DE PESQUISA AO NOSSO ESTADO --- */}
                <input 
                  type="text" 
                  placeholder="Pesquisar negócios..." 
                  className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                />
              </div>
              {/* ... (restante do cabeçalho sem alterações) ... */}
            </div>
          </div>
        </header>
        {/* ... (restante do JSX sem alterações) ... */}
      </div>
      {/* ... (modais sem alterações) ... */}
    </>
  );
};

export default PaginaCRM;