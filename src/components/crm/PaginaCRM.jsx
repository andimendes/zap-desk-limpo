// src/components/crm/PaginaCRM.jsx

import React, { useState } from 'react';

// 1. Importando os componentes que já temos
import CrmBoard from './CrmBoard';
import CrmDashboard from './CrmDashboard';

// Importando ícones que usaremos no cabeçalho em breve
import { Plus, Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

/**
 * DOCUMENTAÇÃO: PaginaCRM
 * Este é o nosso novo componente principal que organiza toda a tela do CRM.
 * Ele cria um layout unificado com três seções:
 * 1. Cabeçalho de Ações: Onde ficarão os botões, filtros e pesquisa.
 * 2. Dashboard: Onde os cartões de KPI (estatísticas) são exibidos.
 * 3. Área de Trabalho: Onde o funil (Kanban ou Lista) será mostrado.
 */
const PaginaCRM = () => {
  // Este estado vai controlar se estamos vendo o Kanban ou a Lista.
  // Por enquanto, ele está fixo em 'kanban', mas vamos usar o botão para alterá-lo no próximo passo.
  const [viewMode, setViewMode] = useState('kanban');

  return (
    // Div principal que ocupa toda a tela e tem um fundo cinza claro
    <div className="bg-gray-50 dark:bg-gray-900/80 min-h-screen w-full p-4 sm:p-6 lg:p-8">
      
      {/* =============================================== */}
      {/* 1. CABEÇALHO DE AÇÕES GLOBAIS                  */}
      {/* =============================================== */}
      {/* Por enquanto, é um placeholder. No próximo passo, vamos adicionar os botões de verdade aqui. */}
      <header className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* Lado Esquerdo: Título */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Funil de Vendas</h1>
          
          {/* Lado Direito: Botões de Ação */}
          <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar negócios..." 
                  className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                  <button className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow"><LayoutGrid size={20} /></button>
                  <button className="p-1.5 text-gray-500 dark:text-gray-400"><List size={20} /></button>
              </div>

              <button className="flex items-center gap-2 py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                  <SlidersHorizontal size={16} />
                  Filtros
              </button>

              <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Plus size={20} />
                Novo Negócio
              </button>
          </div>
        </div>
      </header>

      {/* =============================================== */}
      {/* 2. DASHBOARD DE KPIS DINÂMICOS                 */}
      {/* =============================================== */}
      {/* Esta seção agora contém o nosso componente de dashboard. */}
      <section className="mb-6">
        <CrmDashboard />
      </section>

      {/* =============================================== */}
      {/* 3. ÁREA DE TRABALHO PRINCIPAL (FUNIL)          */}
      {/* =============================================== */}
      {/* Aqui é onde o Kanban (CrmBoard) ou a futura Lista serão renderizados. */}
      <main>
        {viewMode === 'kanban' ? (
          <CrmBoard />
        ) : (
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Placeholder para a futura visualização em lista */}
            <h2 className="font-bold">Visualização em Lista (será construída no Passo 4)</h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaginaCRM;