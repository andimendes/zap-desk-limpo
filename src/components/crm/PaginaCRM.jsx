// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import CrmListView from './CrmListView'; // 1. Importamos a nova lista
import AddNegocioModal from './AddNegocioModal';
import NegocioDetalhesModal from './NegocioDetalhesModal'; // 2. Importamos o modal de detalhes
import FiltrosPopover from './FiltrosPopover';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter, Loader2 } from 'lucide-react';

const PaginaCRM = () => {
  // ... (outros estados continuam iguais)
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

  // 3. O estado para controlar o negócio selecionado AGORA VIVE AQUI
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);

  useEffect(() => { /* ... (useEffect sem alterações) ... */ }, []);

  const fetchDadosDoFunil = useCallback(async () => { /* ... (fetchDadosDoFunil sem alterações) ... */ }, [funilSelecionadoId, filtros]);

  useEffect(() => { fetchDadosDoFunil(); }, [fetchDadosDoFunil]);

  const handleAplicaFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
    setIsFiltrosOpen(false);
  };

  const handleDataChange = () => {
    // Esta função agora serve para recarregar os dados após qualquer alteração
    fetchDadosDoFunil();
    setNegocioSelecionado(null); // Fecha o modal de detalhes
  };
  
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">{/* ...cabeçalho sem alterações... */}</header>
        <section className="mb-6"><CrmDashboard /></section>

        <main>
          {loadingNegocios ? (
            <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
          ) : viewMode === 'kanban' ? (
            <CrmBoard 
              etapas={etapasDoFunil}
              negocios={negocios}
              onNegocioClick={setNegocioSelecionado} // 4. Passamos a função para abrir o modal
              onDataChange={handleDataChange}
            />
          ) : (
            // 5. Substituímos o placeholder pela nossa nova CrmListView
            <CrmListView 
              negocios={negocios}
              etapas={etapasDoFunil}
              onNegocioClick={setNegocioSelecionado} // A lista também pode abrir o modal
            />
          )}
        </main>
      </div>

      {isFiltrosOpen && <FiltrosPopover onClose={() => setIsFiltrosOpen(false)} listaDeUsers={listaDeUsers} filtrosAtuais={filtros} onAplicarFiltros={handleAplicaFiltros} />}
      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} onNegocioAdicionado={handleDataChange} />}

      {/* 6. O Modal de Detalhes agora é renderizado e controlado pela página principal */}
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