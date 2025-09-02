// src/components/crm/FiltrosPopover.jsx

import React, { useState, useEffect, useRef } from 'react';

const FiltrosPopover = ({ onClose, listaDeUsers, filtrosAtuais, onAplicarFiltros, buttonRef }) => {
  const [filtrosLocais, setFiltrosLocais] = useState(filtrosAtuais);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, buttonRef]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltrosLocais(prev => ({ ...prev, [name]: value }));
  };

  const handleLimpar = () => {
    const filtrosLimpos = { responsavelId: 'todos', dataInicio: '', dataFim: '' };
    setFiltrosLocais(filtrosLimpos);
    onAplicarFiltros(filtrosLimpos);
  };

  const handleAplicar = () => {
    onAplicarFiltros(filtrosLocais);
  };

  return (
    <div 
      ref={popoverRef}
      className="filtro-popover-container absolute top-full right-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 w-80"
    >
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t dark:border-gray-700"></div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Filtrar Negócios</h3>
        
        <div className="space-y-4">
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

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Criação</label>
             <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  name="dataInicio"
                  value={filtrosLocais.dataInicio}
                  onChange={handleChange}
                  // --- DOCUMENTAÇÃO DA CORREÇÃO FINAL ---
                  // 'flex-1' faz o input crescer para preencher o espaço.
                  // 'min-w-0' permite que o input encolha se necessário. Esta é a chave!
                  className="flex-1 min-w-0 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="text-gray-500 py-2">até</span>
                <input 
                  type="date" 
                  name="dataFim"
                  value={filtrosLocais.dataFim}
                  onChange={handleChange}
                  // Aplicamos as mesmas classes ao segundo input para um comportamento igual.
                  className="flex-1 min-w-0 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
             </div>
          </div>
        </div>

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