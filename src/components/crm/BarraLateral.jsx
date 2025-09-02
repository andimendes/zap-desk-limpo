// src/components/crm/BarraLateral.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, User, DollarSign, Tag, Users as UsersIcon, Pencil, X, Check, PlusCircle } from 'lucide-react';

const DetalheItem = ({ icon, label, value }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
      {icon}
      {label}
    </label>
    <p className="text-gray-800 dark:text-gray-200 text-base break-words">{value || 'Não informado'}</p>
  </div>
);

// Adicionamos a nova prop onAddLeadClick
const BarraLateral = ({ negocio, etapasDoFunil, listaDeUsers, onDataChange, onAddLeadClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (negocio) {
      setFormData({
        nome_contato: negocio.nome_contato || '',
        empresa_contato: negocio.empresa_contato || '',
        contato_email: negocio.contato_email || '',
        contato_telefone: negocio.contato_telefone || '',
      });
    }
  }, [negocio]);

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

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleCancel = () => {
    setFormData({
      nome_contato: negocio.nome_contato || '',
      empresa_contato: negocio.empresa_contato || '',
      contato_email: negocio.contato_email || '',
      contato_telefone: negocio.contato_telefone || '',
    });
    setIsEditing(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from('crm_negocios')
      .update(formData)
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Erro ao salvar as alterações: ' + error.message);
    } else {
      onDataChange(data);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-1/3 max-w-sm bg-gray-50 dark:bg-gray-800/50 p-6 border-r dark:border-gray-700 h-full overflow-y-auto flex flex-col gap-6">
      
      <div className="space-y-4">
        <DetalheItem icon={<DollarSign size={14} />} label="Valor" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}/>
        <DetalheItem icon={<Tag size={14} />} label="Funil / Etapa" value={etapaAtual?.nome_etapa || 'Etapa não encontrada'} />
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
          {!isEditing && <button onClick={handleEditToggle} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={16} /></button>}
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div><label className="text-xs font-medium">Pessoa de Contato</label><input type="text" name="nome_contato" value={formData.nome_contato} onChange={handleFormChange} className="w-full p-1 border rounded dark:bg-gray-700" /></div>
            <div><label className="text-xs font-medium">Empresa</label><input type="text" name="empresa_contato" value={formData.empresa_contato} onChange={handleFormChange} className="w-full p-1 border rounded dark:bg-gray-700" /></div>
            <div><label className="text-xs font-medium">E-mail</label><input type="email" name="contato_email" value={formData.contato_email} onChange={handleFormChange} className="w-full p-1 border rounded dark:bg-gray-700" /></div>
            <div><label className="text-xs font-medium">Telefone</label><input type="tel" name="contato_telefone" value={formData.contato_telefone} onChange={handleFormChange} className="w-full p-1 border rounded dark:bg-gray-700" /></div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={handleCancel} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300"><X size={16} /></button><button onClick={handleSave} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"><Check size={16} /></button></div>
          </div>
        ) : (
          <>
            <DetalheItem icon={<User size={14} />} label="Pessoa de Contato" value={negocio.nome_contato} />
            <DetalheItem icon={<Building size={14} />} label="Empresa" value={negocio.empresa_contato} />
            <DetalheItem icon={null} label="E-mail" value={negocio.contato_email} />
            <DetalheItem icon={null} label="Telefone" value={negocio.contato_telefone} />
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

      {/* --- BOTÃO NOVO ADICIONADO AQUI --- */}
      <div className="mt-auto pt-4 border-t dark:border-gray-600">
        <button 
          onClick={onAddLeadClick}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900"
        >
          <PlusCircle size={16} />
          Adicionar Lead Rápido
        </button>
      </div>
      
    </div>
  );
};

export default BarraLateral;