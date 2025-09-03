// src/components/crm/EmpresaDetalhesModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, X, Building, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EmpresaDetalhesModal = ({ isOpen, onClose, empresa }) => {
  const [detalhes, setDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalhesEmpresa = async () => {
      if (!empresa?.id) return;

      setLoading(true);
      try {
        // --- CONSULTA CORRIGIDA ---
        // Agora, buscamos os negócios E, DENTRO de cada negócio, os seus contatos associados.
        const { data, error } = await supabase
          .from('crm_empresas')
          .select(`
            id,
            nome_fantasia,
            crm_negocios (
              id, 
              titulo, 
              valor, 
              etapa_id, 
              responsavel:profiles(full_name),
              crm_negocio_contatos (
                crm_contatos (id, nome, email, telefone)
              )
            )
          `)
          .eq('id', empresa.id)
          .single();

        if (error) throw error;
        
        // Processamos os dados para criar uma lista única de contatos, sem duplicatas.
        const todosContatosAninhados = data.crm_negocios.flatMap(negocio => 
            negocio.crm_negocio_contatos.map(assoc => assoc.crm_contatos)
        );
        const contatosUnicos = [...new Map(todosContatosAninhados.map(item => [item.id, item])).values()];

        setDetalhes({
          ...data,
          crm_contatos: contatosUnicos, // Usamos a nossa nova lista de contatos únicos
        });

      } catch (err) {
        console.error("Erro ao buscar detalhes da empresa:", err);
        alert("Não foi possível carregar os detalhes da empresa.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetalhesEmpresa();
    }
  }, [isOpen, empresa]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{empresa.nome_fantasia}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </header>

        {loading ? (
          <div className="flex-grow flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : detalhes ? (
          <main className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna de Contatos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                <Users size={20} />
                Contatos ({detalhes.crm_contatos.length})
              </h3>
              <div className="space-y-3">
                {detalhes.crm_contatos.length > 0 ? (
                  detalhes.crm_contatos.map(contato => (
                    <div key={contato.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                      {contato.email && <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email}</p>}
                      {contato.telefone && <p className="text-sm text-gray-600 dark:text-gray-400">{contato.telefone}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhum contato associado.</p>
                )}
              </div>
            </section>

            {/* Coluna de Negócios */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                <Briefcase size={20} />
                Negócios ({detalhes.crm_negocios.length})
              </h3>
              <div className="space-y-3">
                {detalhes.crm_negocios.length > 0 ? (
                  detalhes.crm_negocios.map(negocio => (
                    <div key={negocio.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{negocio.titulo}</p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center mt-1">
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</span>
                        <span>{negocio.responsavel?.full_name || 'Sem responsável'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhum negócio associado.</p>
                )}
              </div>
            </section>
          </main>
        ) : (
          <div className="flex-grow flex justify-center items-center text-red-500">
            Não foi possível carregar os dados.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresaDetalhesModal;