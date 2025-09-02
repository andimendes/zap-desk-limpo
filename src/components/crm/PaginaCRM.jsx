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

  useEffect(() => {
    const fetchData = async () => {
      const [funisRes, usersRes] = await Promise.all([
        supabase.from('crm_funis').select('id, nome_funil').order('created_at'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);

      if (funisRes.data) {
        setFunis(funisRes.data);
        // --- DOCUMENTAÇÃO DA CORREÇÃO ---
        // Em vez de pegar o primeiro funil, agora procuramos o primeiro VÁLIDO.
        if (funisRes.data.length > 0) {
          // Um UUID tem 36 caracteres. Buscamos o primeiro ID que pareça um UUID.
          const primeiroFunilValido = funisRes.data.find(f => typeof f.id === 'string' && f.id.length > 30);
          if (primeiroFunilValido) {
            setFunilSelecionadoId(primeiroFunilValido.id);
          } else {
            console.warn("Nenhum funil com ID válido (UUID) foi encontrado.");
            setLoadingNegocios(false);
          }
        } else {
          setLoadingNegocios(false);
        }
      }
      if (usersRes.data) setListaDeUsers(usersRes.data);
    };
    fetchData();
  }, []);

  const fetchDadosDoFunil = useCallback(async () => {
    if (!funilSelecionadoId) {
      setNegocios([]);
      // Não definimos loading como false aqui para esperar o useEffect acima resolver
      return;
    }
    
    setLoadingNegocios(true);
    try {
      const { data: etapasData, error: etapasError } = await supabase.from('crm_etapas').select('*').eq('funil_id', funilSelecionadoId).order('ordem');
      if (etapasError) throw etapasError;

      setEtapasDoFunil(etapasData || []);
      const etapaIds = (etapasData || []).map(e => e.id);

      if (etapaIds.length > 0) {
        let query = supabase.from('crm_negocios').select('*, responsavel:profiles(full_name), updated_at').in('etapa_id', etapaIds).eq('status', 'Ativo');
        if (filtros.responsavelId !== 'todos') query = query.eq('responsavel_id', filtros.responsavelId);
        if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio);
        if (filtros.dataFim) query = query.lte('created_at', filtros.dataFim);

        const { data: negociosData, error: negociosError } = await query;
        if (negociosError) throw negociosError;

        const negociosIds = (negociosData || []).map(n => n.id);
        if (negociosIds.length > 0) {
          const { data: tarefas } = await supabase.from('crm_atividades').select('negocio_id').in('negocio_id', negociosIds).eq('concluida', false);
          const tarefasValidas = Array.isArray(tarefas) ? tarefas : [];
          const negociosComTarefas = new Set(tarefasValidas.map(t => t.negocio_id));
          const negociosEnriquecidos = negociosData.map(negocio => ({...negocio, tem_tarefa_futura: negociosComTarefas.has(negocio.id)}));
          setNegocios(negociosEnriquecidos);
        } else {
          setNegocios([]);
        }
      } else {
        setNegocios([]);
      }
    } catch (error) {
      console.error("Ocorreu um erro ao buscar dados do funil:", error);
      setNegocios([]);
    } finally {
      setLoadingNegocios(false);
    }
  }, [funilSelecionadoId, filtros]);

  useEffect(() => { fetchDadosDoFunil(); }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => { setFiltros(novosFiltros); setIsFiltrosOpen(false); };
  const handleDataChange = () => { fetchDadosDoFunil(); setNegocioSelecionado(null); };
  
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">{/* ...cabeçalho completo... */}</header>
        <section className="mb-6"><CrmDashboard /></section>
        <main>
          {loadingNegocios ? <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div> : viewMode === 'kanban' ? <CrmBoard etapas={etapasDoFunil} negocios={negocios} onNegocioClick={setNegocioSelecionado} onDataChange={handleDataChange} /> : <CrmListView negocios={negocios} etapas={etapasDoFunil} onNegocioClick={setNegocioSelecionado} />}
        </main>
      </div>
      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} onNegocioAdicionado={handleDataChange} />}
      {negocioSelecionado && <NegocioDetalhesModal isOpen={!!negocioSelecionado} negocio={negocioSelecionado} onClose={() => setNegocioSelecionado(null)} onDataChange={handleDataChange} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} />}
    </>
  );
};
export default PaginaCRM;