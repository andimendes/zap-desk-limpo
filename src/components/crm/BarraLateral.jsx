// src/components/crm/BarraLateral.jsx

import React from 'react';
import { Building, User, DollarSign, Tag, Users as UsersIcon } from 'lucide-react';

const DetalheItem = ({ icon, label, value }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
      {icon}
      {label}
    </label>
    <p className="text-gray-800 dark:text-gray-200 text-base">{value || 'Não informado'}</p>
  </div>
);

const BarraLateral = ({ negocio, etapasDoFunil, listaDeUsers, onDataChange }) => {
  const etapaAtual = etapasDoFunil.find(e => e.id === negocio.etapa_id);

  const handleMudarResponsavel = async (novoResponsavelId) => {
    // Esta função foi movida do modal principal para cá
    // Idealmente, a lógica de update deveria ser passada como prop (onResponsavelChange)
    // Mas para simplificar, mantemos a chamada ao supabase aqui por enquanto.
    const { supabase } = await import('@/supabaseClient');
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ responsavel_id: novoResponsavelId || null })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Não foi possível alterar o responsável.');
    } else {
      onDataChange(data); // Atualiza o estado no componente pai
    }
  };

  return (
    <div className="w-1/3 max-w-sm bg-gray-50 dark:bg-gray-800/50 p-6 border-r dark:border-gray-700 h-full overflow-y-auto flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-words">{negocio.titulo}</h2>

      <div className="space-y-4">
        <DetalheItem 
          icon={<DollarSign size={14} />} 
          label="Valor" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
        />
        <DetalheItem 
          icon={<Tag size={14} />} 
          label="Funil / Etapa" 
          value={etapaAtual?.nome_etapa || 'Etapa não encontrada'} 
        />
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
        <DetalheItem 
          icon={<User size={14} />} 
          label="Pessoa de Contato" 
          value={negocio.nome_contato} 
        />
        <DetalheItem 
          icon={<Building size={14} />} 
          label="Empresa" 
          value={negocio.empresa_contato} 
        />
      </div>

      <hr className="dark:border-gray-700" />
      
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
          <UsersIcon size={14} />
          Responsável
        </label>
        <select 
          value={negocio.responsavel_id || ''} 
          onChange={(e) => handleMudarResponsavel(e.target.value)}
          className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">Ninguém atribuído</option>
          {listaDeUsers.map(user => (
            <option key={user.id} value={user.id}>{user.full_name}</option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default BarraLateral;