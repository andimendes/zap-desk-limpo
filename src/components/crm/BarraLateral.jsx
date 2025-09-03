// src/components/crm/BarraLateral.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, User, DollarSign, Tag, Users as UsersIcon, Pencil, Check, X, PlusCircle, Trash2 } from 'lucide-react';

// Componente para um item de detalhe que pode ser editado
const DetalheEditavel = ({ icon, label, valor, onSave, tipoInput = 'number' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [valorAtual, setValorAtual] = useState(valor);

    useEffect(() => {
        setValorAtual(valor);
    }, [valor]);

    const handleSave = () => {
        onSave(valorAtual);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">{icon}{label}</label>
                <div className="flex items-center gap-2">
                    <input
                        type={tipoInput}
                        value={valorAtual}
                        onChange={(e) => setValorAtual(e.target.value)}
                        className="w-full p-1 border rounded dark:bg-gray-700 dark:text-gray-200"
                        autoFocus
                    />
                    <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"><Check size={16} /></button>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300"><X size={16} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="group">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">{icon}{label}</label>
            <div className="flex items-center gap-2">
                <p className="text-gray-800 dark:text-gray-200 text-base break-words">
                    {tipoInput === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0) : (valor || 'Não informado')}
                </p>
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={14} /></button>
            </div>
        </div>
    );
};


const BarraLateral = ({ negocio, etapasDoFunil = [], listaDeUsers = [], onDataChange }) => {
  const [empresa, setEmpresa] = useState(null);
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatedData = async () => {
    if (!negocio?.id) return;
    setLoading(true);
    // Busca Empresa
    if (negocio.empresa_id) {
      const { data: empresaData } = await supabase.from('crm_empresas').select('id, nome_fantasia').eq('id', negocio.empresa_id).single();
      setEmpresa(empresaData);
    } else {
      setEmpresa(null);
    }
    // Busca Contatos
    const { data: contatosData } = await supabase.from('crm_negocio_contatos').select('crm_contatos(id, nome, email, telefone)').eq('negocio_id', negocio.id);
    if (contatosData) {
      setContatos(contatosData.map(item => item.crm_contatos).filter(Boolean));
    } else {
      setContatos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelatedData();
  }, [negocio]);

  if (!negocio) return null;
  
  const etapaAtual = etapasDoFunil.find(e => e.id === negocio.etapa_id);

  const handleUpdateField = async (campo, valor) => {
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ [campo]: valor })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name), empresa:crm_empresas(nome_fantasia)')
      .single();
    
    if (error) {
      alert(`Não foi possível atualizar o campo: ${campo}`);
      console.error(error);
    } else {
      onDataChange(data);
    }
  };
  
  const handleUpdateEmpresa = async (novoNome) => {
    if (!empresa?.id) return;
    const { error } = await supabase.from('crm_empresas').update({ nome_fantasia: novoNome }).eq('id', empresa.id);
    if (error) {
        alert('Não foi possível atualizar o nome da empresa.');
    } else {
        fetchRelatedData(); // Re-busca os dados para atualizar a UI
    }
  };
  
  // Funções para adicionar e remover contatos
  const handleAdicionarContato = () => { alert("Funcionalidade para adicionar/vincular contato será implementada aqui."); };
  const handleRemoverContato = async (contatoId) => {
    if (window.confirm("Tem certeza que deseja desvincular este contato do negócio?")) {
        const { error } = await supabase.from('crm_negocio_contatos').delete().match({ negocio_id: negocio.id, contato_id: contatoId });
        if (error) {
            alert("Não foi possível desvincular o contato.");
        } else {
            fetchRelatedData();
        }
    }
  };


  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 h-full overflow-y-auto flex flex-col gap-6">
      <div className="space-y-4">
        <DetalheEditavel icon={<DollarSign size={14} />} label="Valor" valor={negocio.valor} onSave={(novoValor) => handleUpdateField('valor', novoValor)} />
        <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2"><Tag size={14} />Funil / Etapa</label>
            <p className="text-gray-800 dark:text-gray-200 text-base break-words">{etapaAtual?.nome_etapa || 'Etapa não encontrada'}</p>
        </div>
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
            <button onClick={handleAdicionarContato} className="text-blue-600 hover:text-blue-800 p-1" title="Adicionar Contato"><PlusCircle size={16} /></button>
        </div>
        {loading ? <p>Carregando...</p> : (
            <>
              {empresa ? (
                  <DetalheEditavel icon={<Building size={14} />} label="Empresa" valor={empresa.nome_fantasia} onSave={handleUpdateEmpresa} tipoInput="text" />
              ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma empresa vinculada</p>
              )}
              
              <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2"><User size={14} />Contatos</label>
                  {contatos.length > 0 ? (
                      <div className="space-y-2 mt-1">
                          {contatos.map(contato => (
                              <div key={contato.id} className="group flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                                  <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                                    {contato.email && <p className="text-gray-500 dark:text-gray-400">{contato.email}</p>}
                                    {contato.telefone && <p className="text-gray-500 dark:text-gray-400">{contato.telefone}</p>}
                                  </div>
                                  <button onClick={() => handleRemoverContato(contato.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 p-1" title="Desvincular Contato"><Trash2 size={14} /></button>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nenhum contato vinculado</p>
                  )}
              </div>
            </>
        )}
      </div>

      <hr className="dark:border-gray-700" />
      
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2"><UsersIcon size={14} />Responsável</label>
        <select value={negocio.responsavel_id || ''} onChange={(e) => handleUpdateField('responsavel_id', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
          <option value="">Ninguém atribuído</option>
          {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
        </select>
      </div>
    </div>
  );
};

export default BarraLateral;