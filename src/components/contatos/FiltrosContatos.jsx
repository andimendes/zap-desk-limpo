// src/components/contatos/FiltrosContatos.jsx

import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';

const FiltrosContatos = ({ isOpen, onClose, listaDeEmpresas, filtrosAtuais, onAplicarFiltros }) => {
  const [filtrosLocais, setFiltrosLocais] = useState(filtrosAtuais);

  // Sincroniza o estado local se os filtros externos mudarem
  useEffect(() => {
    setFiltrosLocais(filtrosAtuais);
  }, [filtrosAtuais]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltrosLocais(prev => ({ ...prev, [name]: value }));
  };

  const handleLimpar = () => {
    const filtrosLimpos = { empresaId: 'todas', cargo: '' };
    setFiltrosLocais(filtrosLimpos);
    onAplicarFiltros(filtrosLimpos);
    onClose(); // Fecha o painel ao limpar
  };

  const handleAplicar = () => {
    onAplicarFiltros(filtrosLocais);
    onClose(); // Fecha o painel ao aplicar
  };

  return (
    <>
      {/* Fundo escuro overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Painel lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho do painel */}
          <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Filter size={20} />
              Filtrar Contatos
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X size={22} />
            </button>
          </header>

          {/* Corpo com os campos de filtro */}
          <div className="p-6 space-y-6 flex-grow">
            <div>
              <label htmlFor="empresaId" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Empresa
              </label>
              <select
                id="empresaId"
                name="empresaId"
                value={filtrosLocais.empresaId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas as Empresas</option>
                {listaDeEmpresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="cargo" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Cargo
              </label>
              <input
                id="cargo"
                name="cargo"
                type="text"
                placeholder="Ex: Diretor, Gerente..."
                value={filtrosLocais.cargo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Rodapé com os botões de ação */}
          <footer className="p-4 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <button onClick={handleLimpar} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Limpar Filtros
            </button>
            <button onClick={handleAplicar} className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold">
              Aplicar
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default FiltrosContatos;