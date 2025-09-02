// src/components/crm/PaginaCRM.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';
import AddNegocioModal from './AddNegocioModal';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

const PaginaCRM = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');

  useEffect(() => {
    const fetchFunis = async () => {
      const { data, error } = await supabase.from('crm_funis').select('*').order('created_at');
      if (error) {
        console.error("Não foi possível carregar os funis.", error);
      } else {
        setFunis(data);
        if (data && data.length > 0) {
          setFunilSelecionadoId(data[0].id);
        }
      }
    };
    fetchFunis();
  }, []);

  const handleBoardDataChange = () => {
    console.log("Dados do board foram alterados.");
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* --- DOCUMENTAÇÃO DA CORREÇÃO --- */}
            {/* A alteração está aqui: trocamos 'items-center' por 'items-baseline'. */}
            {/* Isso alinha os elementos pela base do texto, o que é ideal para diferentes tamanhos de fonte. */}
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Funil de Vendas</h1>
              <select 
                value={funilSelecionadoId} 
                onChange={(e) => setFunilSelecionadoId(e.target.value)} 
                className="text-sm font-medium text-gray-500 bg-transparent border-none focus:ring-0 dark:text-gray-400"
              >
                {funis.map(funil => <option key={funil.id} value={funil.id}>{funil.nome_funil}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" placeholder="Pesquisar negócios..." className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"/>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                    <button className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow"><LayoutGrid size={20} /></button>
                    <button className="p-1.5 text-gray-500 dark:text-gray-400"><List size={20} /></button>
                </div>
                <button className="flex items-center gap-2 py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                    <SlidersHorizontal size={16} /> Filtros
                </button>
                <button onClick={() => setAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={20} /> Novo Negócio
                </button>
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
              onDataChange={handleBoardDataChange}
            />
          ) : (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="font-bold">Visualização em Lista</h2>
            </div>
          )}
        </main>
      </div>

      {isAddModalOpen && 
        <AddNegocioModal 
          isOpen={isAddModalOpen} 
          onClose={() => setAddModalOpen(false)} 
          etapas={etapasDoFunil} 
          onNegocioAdicionado={handleBoardDataChange} 
        />}
    </>
  );
};

export default PaginaCRM;