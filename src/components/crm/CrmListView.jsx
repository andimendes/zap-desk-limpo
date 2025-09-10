// src/components/crm/CrmListView.jsx

import React, { useState, useMemo } from 'react';
import { differenceInDays } from 'date-fns'; // Importar a função para calcular a diferença de dias
import { ArrowDown, ArrowUp } from 'lucide-react';

// --- ALTERAÇÃO 1 ---
// Adicionamos a prop 'filtroStatus' para sabermos em que vista estamos ('Ativo', 'Ganho', 'Perdido')
const CrmListView = ({ negocios, etapas, onNegocioClick, onEnviarContrato, filtroStatus }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

  // --- ALTERAÇÃO 2 ---
  // Função para calcular a idade do negócio em dias.
  const calcularIdadeNegocio = (dataCriacao) => {
    return differenceInDays(new Date(), new Date(dataCriacao));
  };

  const sortedNegocios = useMemo(() => {
    let sortableItems = [...negocios];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // --- ADIÇÃO --- Lógica para ordenar por tempo de negócio
        if (sortConfig.key === 'idade_negocio') {
            const idadeA = calcularIdadeNegocio(a.created_at);
            const idadeB = calcularIdadeNegocio(b.created_at);
            if (idadeA < idadeB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (idadeA > idadeB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
        // Lógica de ordenação existente
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

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getNomeEtapa = (etapaId) => {
    const etapa = etapas.find(e => e.id === etapaId);
    return etapa ? etapa.nome_etapa : 'Etapa não encontrada';
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 ml-1 inline-block" /> : <ArrowDown className="h-4 w-4 ml-1 inline-block" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <table className="min-w-full divide-y dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('nome_negocio')} className="flex items-center">
                Negócio {getSortIcon('nome_negocio')}
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
            {/* --- ALTERAÇÃO 3: COLUNA CONDICIONAL --- */}
            {filtroStatus === 'Ativo' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button onClick={() => requestSort('idade_negocio')} className="flex items-center">
                  Tempo do Negócio {getSortIcon('idade_negocio')}
                </button>
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button onClick={() => requestSort('responsavel_id')} className="flex items-center">
                Responsável {getSortIcon('responsavel_id')}
              </button>
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
          {sortedNegocios.length > 0 ? (
            sortedNegocios.map(negocio => (
              <tr key={negocio.id} onClick={() => onNegocioClick(negocio)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{negocio.nome_negocio}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{negocio.empresa?.nome_fantasia || 'Sem empresa'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {negocio.status === 'Ganho' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ganho</span>
                  ) : negocio.status === 'Perdido' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Perdido</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{getNomeEtapa(negocio.etapa_id)}</span>
                  )}
                </td>
                {/* --- ALTERAÇÃO 4: CÉLULA CONDICIONAL --- */}
                {filtroStatus === 'Ativo' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {calcularIdadeNegocio(negocio.created_at)} dias
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {negocio.responsavel?.full_name || 'Sem responsável'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {negocio.status === 'Ganho' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEnviarContrato) onEnviarContrato(negocio);
                      }}
                      className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-xs px-3 py-1.5 text-center"
                    >
                      Enviar para Contrato
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={filtroStatus === 'Ativo' ? 6 : 5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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