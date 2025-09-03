// src/components/crm/BuscaECria.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // Assumindo que você pode criar este hook (código abaixo)

// Crie este hook em um arquivo como src/hooks/useDebounce.js
/*
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
*/

const BuscaECria = ({ tabela, coluna, placeholder, onSelecao, valorInicial = '' }) => {
  const [termoBusca, setTermoBusca] = useState(valorInicial);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const debouncedBusca = useDebounce(termoBusca, 300);

  useEffect(() => {
    const buscarRegistros = async () => {
      if (debouncedBusca.length < 2) {
        setResultados([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from(tabela)
        .select(`id, ${coluna}`)
        .ilike(coluna, `%${debouncedBusca}%`)
        .limit(5);
      
      setLoading(false);
      if (error) {
        console.error('Erro na busca:', error);
      } else {
        setResultados(data);
      }
    };
    
    buscarRegistros();
  }, [debouncedBusca, tabela, coluna]);

  const handleSelecao = (valor) => {
    setTermoBusca(valor);
    onSelecao(valor); // Informa o componente pai sobre a seleção
    setIsDropdownOpen(false);
  };
  
  return (
    <div className="relative">
      <input 
        type="text" 
        value={termoBusca}
        onChange={(e) => {
            setTermoBusca(e.target.value);
            onSelecao(e.target.value); // Atualiza o estado no pai em tempo real
        }}
        onFocus={() => setIsDropdownOpen(true)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay para permitir o clique
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
      />
      {isDropdownOpen && (termoBusca.length > 1) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg">
          {loading && <div className="p-2 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Buscando...</div>}
          
          {!loading && resultados.length === 0 && (
            <div 
              onClick={() => handleSelecao(termoBusca)}
              className="p-3 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <PlusCircle className="h-4 w-4 text-green-500" />
              <span>Criar nova: "{termoBusca}"</span>
            </div>
          )}
          
          <ul className="max-h-48 overflow-y-auto">
            {resultados.map((item) => (
              <li 
                key={item.id}
                onClick={() => handleSelecao(item[coluna])}
                className="p-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {item[coluna]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BuscaECria;