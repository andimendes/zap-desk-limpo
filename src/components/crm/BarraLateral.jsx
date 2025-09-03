// src/components/crm/BarraLateral.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, User, DollarSign, Tag, Users as UsersIcon } from 'lucide-react';

// Componente para exibir um item de detalhe (sem edição)
const DetalheItem = ({ icon, label, value, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
      {icon}
      {label}
    </label>
    {value && <p className="text-gray-800 dark:text-gray-200 text-base break-words">{value}</p>}
    {children}
  </div>
);

const BarraLateral = ({ negocio, etapasDoFunil, listaDeUsers, onDataChange }) => {
  // NOVOS ESTADOS para guardar os dados relacionados
  const [empresa, setEmpresa] = useState(null);
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!negocio?.id) return;

    const fetchRelatedData = async () => {
      setLoading(true);
      
      // 1. Buscar a empresa associada
      if (negocio.empresa_id) {
        const { data: empresaData, error: empresaError } = await supabase
          .from('crm_empresas')
          .select('nome_fantasia')
          .eq('id', negocio.empresa_id)
          .single();
        if (!empresaError) setEmpresa(empresaData);
      } else {
        setEmpresa(null);
      }

      // 2. Buscar os contatos associados
      const { data: contatosData, error: contatosError } = await supabase
        .from('crm_negocio_contatos')
        .select('crm_contatos(id, nome, email, telefone)')
        .eq('negocio_id', negocio.id);
      
      if (!contatosError) {
        // Extrai o objeto do contato de cada item da lista
        setContatos(contatosData.map(item => item.crm_contatos).filter(Boolean));
      }
      
      setLoading(false);
    };

    fetchRelatedData();
  }, [negocio]);

  if (!negocio) {
      return null;
  }
  
  const etapaAtual = etapasDoFunil.find(e => e.id === negocio.etapa_id);

  // ... função handleMudarResponsavel inalterada ...

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 h-full overflow-y-auto flex flex-col gap-6">
      <div className="space-y-4">
        {/* ... Detalhes de Valor e Etapa inalterados ... */}
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
        {loading ? <p>Carregando...</p> : (
            <>
              {/* Exibe a empresa vinculada */}
              <DetalheItem icon={<Building size={14} />} label="Empresa" value={empresa?.nome_fantasia || 'Nenhuma empresa vinculada'} />
              
              {/* Exibe a lista de contatos vinculados */}
              <DetalheItem icon={<User size={14} />} label="Contatos">
                {contatos.length > 0 ? (
                    <div className="space-y-2 mt-1">
                        {contatos.map(contato => (
                            <div key={contato.id} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                                {contato.email && <p className="text-gray-500 dark:text-gray-400">{contato.email}</p>}
                                {contato.telefone && <p className="text-gray-500 dark:text-gray-400">{contato.telefone}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum contato vinculado</p>
                )}
              </DetalheItem>
            </>
        )}
      </div>

      <hr className="dark:border-gray-700" />
      
      <div>
        {/* ... Seletor de Responsável inalterado ... */}
      </div>
    </div>
  );
};

export default BarraLateral;