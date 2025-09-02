// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
// ... (outros imports)
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter, Loader2 } from 'lucide-react';
// ... (outros componentes importados)
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import CrmListView from './CrmListView';
import AddNegocioModal from './AddNegocioModal';
import NegocioDetalhesModal from './NegocioDetalhesModal';
import FiltrosPopover from './FiltrosPopover';


const PaginaCRM = () => {
  // ... (todos os estados continuam os mesmos)
  const [viewMode, setViewMode] = useState('kanban');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtros, setFiltros] = useState({ responsavelId: 'todos', dataInicio: '', dataFim: '' });
  const [negocios, setNegocios] = useState([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);


  useEffect(() => { /* ... (useEffect da busca inicial sem alterações) ... */ }, []);

  // --- MUDANÇA PRINCIPAL AQUI ---
  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) return;
    setLoadingNegocios(true);
    
    // 1. Busca as etapas (sem alteração)
    const { data: etapasData } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
    setEtapasDoFunil(etapasData || []);

    const etapaIds = (etapasData || []).map(e => e.id);
    if (etapaIds.length > 0) {
      // 2. Monta a busca de negócios com filtros (sem alteração)
      let query = supabase.from('crm_negocios')
        // Adicionamos 'updated_at' para calcular os dias parado. O ideal seria ter um campo 'etapa_modificada_em'.
        .select('*, responsavel:profiles(full_name), updated_at')
        .in('etapa_id', etapaIds)
        .eq('status', 'Ativo');
      
      if (filtros.responsavelId !== 'todos') query = query.eq('responsavel_id', filtros.responsavelId);
      if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio);
      if (filtros.dataFim) query = query.lte('created_at', filtros.dataFim);

      const { data: negociosData, error: negociosError } = await query;
      if (negociosError) {
        console.error("Erro ao buscar negócios:", negociosError);
        setNegocios([]);
      } else {
        // 3. ENRIQUECIMENTO DOS DADOS
        const negociosIds = negociosData.map(n => n.id);
        
        // Busca, de uma só vez, todas as tarefas não concluídas para os negócios encontrados
        const { data: tarefas } = await supabase
          .from('crm_atividades')
          .select('negocio_id')
          .in('negocio_id', negociosIds)
          .eq('concluida', false);
        
        // Cria um conjunto (Set) para busca rápida de IDs que têm tarefas
        const negociosComTarefas = new Set(tarefas.map(t => t.negocio_id));

        // Mapeia os negócios originais para adicionar a nova informação
        const negociosEnriquecidos = negociosData.map(negocio => ({
          ...negocio,
          tem_tarefa_futura: negociosComTarefas.has(negocio.id)
        }));

        setNegocios(negociosEnriquecidos);
      }
    } else {
      setNegocios([]);
    }
    setLoadingNegocios(false);
  }, [funilSelecionadoId, filtros]);

  useEffect(() => { fetchDadosDoFunil(); }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => { /* ... (sem alterações) ... */ };
  const handleDataChange = () => { /* ... (sem alterações) ... */ };
  
  return (
    // O JSX da página principal não muda, apenas o que é passado para o CrmBoard
    <>
      {/* ... (todo o JSX de PaginaCRM continua o mesmo) ... */}
    </>
  );
};

export default PaginaCRM;