// src/components/crm/CrmListView.jsx

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * DOCUMENTAÇÃO: CrmListView
 * Este componente recebe uma lista de negócios e a exibe em formato de tabela.
 * Cada linha da tabela é clicável, acionando uma função para mostrar os detalhes do negócio.
 */
const CrmListView = ({ negocios, etapas, onNegocioClick }) => {

  // Função auxiliar para encontrar o nome da etapa a partir do seu ID
  const getNomeEtapa = (etapaId) => {
    const etapa = etapas.find(e => e.id === etapaId);
    return etapa ? etapa.nome_etapa : 'Etapa não encontrada';
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <table className="min-w-full divide-y dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Negócio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Etapa do Funil</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsável</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data de Criação</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
          {negocios.length > 0 ? (
            negocios.map(negocio => (
              <tr 
                key={negocio.id} 
                onClick={() => onNegocioClick(negocio)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
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