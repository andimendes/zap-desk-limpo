// src/components/crm/FiltrosPopover.jsx

import React, { useState, useEffect } from 'react';

/**
 * DOCUMENTAÇÃO: FiltrosPopover
 * Este componente é o painel flutuante que contém as opções de filtro.
 * Ele recebe o estado atual dos filtros e uma função para aplicá-los.
 * Internamente, ele usa um estado local para que o usuário possa fazer
 * várias alterações antes de clicar em "Aplicar".
 */
const FiltrosPopover = ({ onClose, listaDeUsers, filtrosAtuais, onAplicarFiltros }) => {
  // Estado local para guardar as mudanças antes de aplicar
  const [filtrosLocais, setFiltrosLocais] = useState(filtrosAtuais);

  // Efeito para fechar o popover se o usuário clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Lógica para verificar se o clique foi fora do popover
      if (!event.target.closest('.filtro-popover-container')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltrosLocais(prev => ({ ...prev, [name]: value }));
  };

  const handleLimpar = () => {
    const filtrosLimpos = { responsavelId: 'todos', dataInicio: '', dataFim: '' };
    setFiltrosLocais(filtrosLimpos);
    onAplicarFiltros(filtrosLimpos); // Aplica a limpeza imediatamente
  };

  const handleAplicar = () => {
    onAplicarFiltros(filtrosLocais);
  };

  return (
    // O container principal tem posicionamento absoluto para flutuar na tela
    <div 
      className="filtro-popover-container absolute top-28 right-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 w-80"
    >
      {/* Adicionamos uma pequena seta no topo para indicar de onde ele veio */}
      <div className="absolute -top-2 right-28 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t dark:border-gray-700"></div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Filtrar Negócios</h3>
        
        <div className="space-y-4">
          {/* Seletor de Responsável */}
          <div>
            <label htmlFor="responsavelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
            <select
              id="responsavelId"
              name="responsavelId"
              value={filtrosLocais.responsavelId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos os Responsáveis</option>
              {listaDeUsers.map(user => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Data */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Criação</label>
             <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  name="dataInicio"
                  value={filtrosLocais.dataInicio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="text-gray-500">até</span>
                <input 
                  type="date" 
                  name="dataFim"
                  value={filtrosLocais.dataFim}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
             </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700">
          <button 
            onClick={handleLimpar}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Limpar Filtros
          </button>
          <button
            onClick={handleAplicar}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosPopover;