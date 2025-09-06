// src/components/crm/BuscaECriaContatoModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Search, Plus, X, Loader2, UserPlus } from 'lucide-react';

const BuscaECriaContatoModal = ({ isOpen, onClose, empresaId, onCriarNovo }) => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (termoPesquisa.length < 2) {
      setResultados([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data: vinculadosData, error: vinculadosError } = await supabase
            .from('empresa_contato_junction')
            .select('contato_id')
            .eq('empresa_id', empresaId);
        
        if (vinculadosError) throw vinculadosError;
        const idsVinculados = vinculadosData.map(v => v.contato_id);

        let query = supabase
            .from('crm_contatos')
            .select('*')
            .ilike('nome', `%${termoPesquisa}%`);
        
        if (idsVinculados.length > 0) {
            query = query.not('id', 'in', `(${idsVinculados.join(',')})`);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;
        setResultados(data);

      } catch (err) {
        console.error("Erro na busca de contatos:", err);
        setError("Não foi possível realizar a busca.");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [termoPesquisa, empresaId]);

  const handleVincularContato = async (contatoId) => {
    const { error } = await supabase
        .from('empresa_contato_junction')
        .insert({ empresa_id: empresaId, contato_id: contatoId });
    
    if (error) {
        alert("Falha ao vincular o contato.");
        console.error(error);
    } else {
        alert("Contato vinculado com sucesso!");
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">Vincular Contato Existente</h2>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button>
        </header>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Digite o nome do contato..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="p-4 max-h-60 overflow-y-auto">
          {loading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!loading && resultados.length > 0 && (
            <ul className="space-y-2">
              {resultados.map(contato => (
                <li key={contato.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div>
                    <p className="font-semibold">{contato.nome}</p>
                    <p className="text-sm text-gray-500">{contato.email}</p>
                  </div>
                  <button onClick={() => handleVincularContato(contato.id)} className="text-sm bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 flex items-center gap-1">
                    <UserPlus size={14} /> Vincular
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && termoPesquisa.length >= 2 && resultados.length === 0 && (
            <p className="text-center text-gray-500">Nenhum contato encontrado com este nome.</p>
          )}
        </div>
        <footer className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
            <button onClick={onCriarNovo} className="py-2 px-4 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center gap-2">
                <Plus size={16} /> Criar Novo Contato
            </button>
            <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
                Fechar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default BuscaECriaContatoModal;