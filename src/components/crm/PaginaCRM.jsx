// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import AddNegocioModal from './AddNegocioModal';
import FiltrosPopover from './FiltrosPopover';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal, Filter } from 'lucide-react';

const PaginaCRM = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    responsavelId: 'todos', 
    dataInicio: '', 
    dataFim: '' 
  });

  useEffect(() => {
    const fetchData = async () => {
      const [funisRes, usersRes] = await Promise.all([
        supabase.from('crm_funis').select('*').order('created_at'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);

      if (funisRes.error) console.error("Erro ao carregar funis.", funisRes.error);
      else {
        setFunis(funisRes.data);
        if (funisRes.data?.length > 0) setFunilSelecionadoId(funisRes.data[0].id);
      }

      if (usersRes.error) console.error("Erro ao carregar responsáveis.", usersRes.error);
      else setListaDeUsers(usersRes.data);
    };
    fetchData();
  }, []);
  
  const handleAplicaFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
    setIsFiltrosOpen(false);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          {/* Header continua o mesmo */}
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
                <button onClick={() => setIsFiltrosOpen(!isFiltrosOpen)} className="flex items-center gap-2 py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                    <SlidersHorizontal size={16} /> Filtros
                </button>
                <button onClick={() => setAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={20} /> Novo Negócio</button>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <CrmDashboard />
        </section>

        <main>
          {viewMode === 'kanban' ? (
            <CrmBoard 
              funilSelecionadoId={funilSelecionadoId}
              onEtapasCarregadas={setEtapasDoFunil}
              listaDeUsers={listaDeUsers}
              // --- DOCUMENTAÇÃO DA MUDANÇA ---
              // A MÁGICA COMEÇA AQUI: Passamos o estado 'filtros' para o CrmBoard.
              filtros={filtros}
            />
          ) : (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow"><h2 className="font-bold text-2xl text-gray-700 dark:text-gray-300">Visualização em Lista</h2><p className="text-gray-500 mt-2">Esta área será construída nos próximos passos.</p></div>
          )}
        </main>
      </div>

      {isFiltrosOpen && (
        <FiltrosPopover onClose={() => setIsFiltrosOpen(false)} listaDeUsers={listaDeUsers} filtrosAtuais={filtros} onAplicarFiltros={handleAplicaFiltros} />
      )}

      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapasDoFunil} />}
    </>
  );
};

export default PaginaCRM;