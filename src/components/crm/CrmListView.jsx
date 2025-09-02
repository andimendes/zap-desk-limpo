// src/components/crm/CrmListView.jsx

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// 1. Importamos os ícones de seta para indicar a ordenação
import { ArrowDown, ArrowUp } from 'lucide-react';

const CrmListView = ({ negocios, etapas, onNegocioClick }) => {
  // 2. Adicionamos um estado para controlar a configuração da ordenação.
  // Por padrão, ordenamos por data de criação, do mais novo para o mais antigo.
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

  // 3. Usamos 'useMemo' para ordenar a lista de forma eficiente.
  // Este código só será executado se a lista de 'negocios' ou a 'sortConfig' mudarem.
  const sortedNegocios = useMemo(() => {
    let sortableItems = [...negocios];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [negocios, sortConfig]);

  // 4. Função que é chamada quando um cabeçalho é clicado.
  const requestSort = (key) => {
    let direction = 'ascending';
    // Se clicarmos na mesma coluna que já está ordenada, invertemos a direção.
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Função auxiliar para o nome da etapa (sem alterações)
  const getNomeEtapa = (etapaId) => {
    const etapa = etapas.find(e => e.id === etapaId);
    return etapa ? etapa.nome_etapa : 'Etapa não encontrada';
  };
  
  // Função para renderizar o ícone de ordenação
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="h-4 w-4 ml-1 inline-block" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1 inline-block" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <table className="min-w-full divide-y dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {/* --- MUDANÇA 5: CABEÇALHOS AGORA SÃO BOTÕES CLICÁVEIS --- */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('titulo')} className="flex items-center">
                Negócio {getSortIcon('titulo')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('valor')} className="flex items-center">
                Valor {getSortIcon('valor')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('etapa_id')} className="flex items-center">
                Etapa do Funil {getSortIcon('etapa_id')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('responsavel_id')} className="flex items-center">
                Responsável {getSortIcon('responsavel_id')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('created_at')} className="flex items-center">
                Data de Criação {getSortIcon('created_at')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
          {sortedNegocios.length > 0 ? (
            // Agora usamos a nossa lista ordenada 'sortedNegocios' para renderizar as linhas
            sortedNegocios.map(negocio => (
              <tr key={negocio.id} onClick={() => onNegocioClick(negocio)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{negocio.titulo}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{negocio.empresa_contato}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getNomeEtapa(negocio.etapa_id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {negocio.responsavel?.full_name || 'Sem responsável'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(negocio.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhum negócio encontrado com os filtros atuais.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CrmListView;