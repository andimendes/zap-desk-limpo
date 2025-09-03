// src/components/crm/BarraLateral.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, User, DollarSign, Tag, Users as UsersIcon, Pencil, X, Check } from 'lucide-react';

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

// --- AJUSTE APLICADO AQUI ---
const BarraLateral = ({ negocio, etapasDoFunil = [], listaDeUsers = [], onDataChange }) => {
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

  const handleMudarResponsavel = async (novoResponsavelId) => {
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ responsavel_id: novoResponsavelId || null })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Não foi possível alterar o responsável.');
    } else {
      onDataChange(data);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 h-full overflow-y-auto flex flex-col gap-6">
      <div className="space-y-4">
        <DetalheItem icon={<DollarSign size={14} />} label="Valor" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}/>
        <DetalheItem icon={<Tag size={14} />} label="Funil / Etapa" value={etapaAtual?.nome_etapa || 'Etapa não encontrada'} />
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
        {loading ? <p>Carregando...</p> : (
            <>
              <DetalheItem icon={<Building size={14} />} label="Empresa" value={empresa?.nome_fantasia || 'Nenhuma empresa vinculada'} />
              
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
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2"><UsersIcon size={14} />Responsável</label>
        <select value={negocio.responsavel_id || ''} onChange={(e) => handleMudarResponsavel(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
          <option value="">Ninguém atribuído</option>
          {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
        </select>
      </div>
    </div>
  );
};

export default BarraLateral;