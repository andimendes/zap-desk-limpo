// src/components/crm/BarraLateral.jsx

import React from 'react';
import { supabase } from '@/supabaseClient';
import { 
    Building, User, DollarSign, Tag, Users as UsersIcon, Pencil, Check, X, 
    Globe, MapPin, Briefcase, PlusCircle, Trash2, Loader2 
} from 'lucide-react';
import { useState, useEffect } from 'react';


// Componente reutilizável para exibir e editar detalhes
const DetalheEditavel = ({ icon, label, valor, onSave, tipoInput = 'text', onClick, isEditable = true }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [valorAtual, setValorAtual] = useState(valor);

    useEffect(() => { setValorAtual(valor); }, [valor]);

    const handleSave = () => { onSave(valorAtual); setIsEditing(false); };

    const wrapperProps = onClick 
        ? { onClick, role: "button", tabIndex: "0", onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }, className: "text-left w-full group cursor-pointer" } 
        : { className: "group" };

    if (isEditing && isEditable) {
        return (
            <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">{icon}{label}</label>
                <div className="flex items-center gap-2">
                    <input type={tipoInput} value={valorAtual || ''} onChange={(e) => setValorAtual(e.target.value)} className="w-full p-1 border rounded dark:bg-gray-700 dark:text-gray-200" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                    <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"><Check size={16} /></button>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300"><X size={16} /></button>
                </div>
            </div>
        );
    }

    return (
        <div {...wrapperProps}>
            <label className={`text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}>{icon}{label}</label>
            <div className="flex items-center justify-between">
                <p className={`text-gray-800 dark:text-gray-200 text-base break-words ${onClick ? 'hover:underline text-blue-600 dark:text-blue-400' : ''}`}>
                    {tipoInput === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0) : (valor || 'Não informado')}
                </p>
                {isEditable && (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Pencil size={14} /></button>
                )}
            </div>
        </div>
    );
};


const BarraLateral = ({ negocio, etapasDoFunil = [], listaDeUsers = [], onDataChange, onForcarRecarga, onEmpresaClick, onEditarContato, onAdicionarContato }) => {
  const [contatosDaEmpresa, setContatosDaEmpresa] = useState([]);
  const [loadingContatos, setLoadingContatos] = useState(true);
  
  if (!negocio) return null;

  useEffect(() => {
    const fetchContatosDaEmpresa = async () => {
        if (!negocio.empresa?.id) {
            setContatosDaEmpresa([]);
            setLoadingContatos(false);
            return;
        }
        setLoadingContatos(true);
        const { data, error } = await supabase
            .from('empresa_contato_junction')
            .select('crm_contatos(*)') 
            .eq('empresa_id', negocio.empresa.id);
        
        if (error) {
            console.error("Erro ao buscar contatos da empresa:", error);
            setContatosDaEmpresa([]);
        } else {
            const contatosExtraidos = data.map(item => item.crm_contatos).filter(Boolean);
            setContatosDaEmpresa(contatosExtraidos);
        }
        setLoadingContatos(false);
    };

    fetchContatosDaEmpresa();
  }, [negocio.empresa]);
  
  const etapaAtual = etapasDoFunil.find(e => e.id === negocio.etapa_id);
  const empresa = negocio.empresa; 

  const handleUpdateField = async (campo, valor) => {
    const { data, error } = await supabase.from('crm_negocios').update({ [campo]: valor }).eq('id', negocio.id).select('*, responsavel:profiles(*), empresa:crm_empresas(*), contato:crm_contatos(*)').single();
    if (error) { 
      alert(`Não foi possível atualizar o campo: ${campo}`); 
      console.error(error); 
    } else { 
      onDataChange(data); 
    }
  };
  
  const handleUpdateEmpresa = async (campo, valor) => {
    if (!empresa?.id) return;
    const { error } = await supabase.from('crm_empresas').update({ [campo]: valor }).eq('id', empresa.id);
    if (error) { 
      alert(`Não foi possível atualizar a empresa.`); 
      console.error("Erro ao atualizar empresa:", error);
    } else { 
      onForcarRecarga(); 
    }
  };

  const handleRemoverContato = async (contatoId) => {
    if (window.confirm("Tem certeza que deseja desvincular este contato da empresa? A ação não remove o contato do sistema.")) {
        const { error } = await supabase
            .from('empresa_contato_junction')
            .delete()
            .match({ empresa_id: empresa.id, contato_id: contatoId });

        if (error) {
            alert("Não foi possível desvincular o contato.");
            console.error(error);
        } else {
            onForcarRecarga();
        }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 h-full overflow-y-auto flex flex-col gap-6">
      <div className="space-y-4">
        <DetalheEditavel icon={<DollarSign size={14} />} label="Valor" valor={negocio.valor} onSave={(novoValor) => handleUpdateField('valor', novoValor)} tipoInput="number" />
        <div><label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2"><Tag size={14} />Funil / Etapa</label><p className="text-gray-800 dark:text-gray-200 text-base break-words">{etapaAtual?.nome_etapa || 'Etapa não encontrada'}</p></div>
      </div>

      <hr className="dark:border-gray-700" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Pessoas e Organizações</h3>
        </div>
        
        {empresa ? (
            <div className="space-y-4">
              <DetalheEditavel icon={<Building size={14} />} label="Empresa" valor={empresa.nome_fantasia} onSave={(val) => handleUpdateEmpresa('nome_fantasia', val)} tipoInput="text" onClick={() => onEmpresaClick(empresa)} />
              <DetalheEditavel icon={<Globe size={14} />} label="Site" valor={empresa.site} onSave={(val) => handleUpdateEmpresa('site', val)} tipoInput="url" />
              {/* --- CORREÇÃO APLICADA AQUI --- */}
              <DetalheEditavel icon={<MapPin size={14} />} label="Endereço" valor={empresa.bairro} onSave={(val) => handleUpdateEmpresa('bairro', val)} isEditable={true} />
              <DetalheEditavel icon={<Briefcase size={14} />} label="Segmento" valor={empresa.segmento} onSave={(val) => handleUpdateEmpresa('segmento', val)} tipoInput="text" />
            </div>
        ) : ( <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma empresa vinculada</p> )}
        
        <div>
            <div className="flex justify-between items-center mt-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2"><User size={14} />Contatos</label>
                <button onClick={onAdicionarContato} className="text-blue-600 hover:text-blue-800 p-1" title="Adicionar/Vincular Contato"><PlusCircle size={16} /></button>
            </div>
            
            {loadingContatos ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : contatosDaEmpresa.length > 0 ? (
                <div className="space-y-2 mt-1">
                    {contatosDaEmpresa.map(contato => (
                        <div key={contato.id} className="group flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                                <p className="text-gray-500 dark:text-gray-400">{contato.email || 'sem email'}</p>
                                <p className="text-gray-500 dark:text-gray-400">{contato.telefone || 'sem telefone'}</p>
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => onEditarContato(contato)} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 p-1" title="Editar Contato">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => handleRemoverContato(contato.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 p-1" title="Desvincular Contato">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : ( <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nenhum contato encontrado para esta empresa.</p> )}
        </div>
      </div>

      <hr className="dark:border-gray-700" />
      
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2"><UsersIcon size={14} />Responsável</label>
        <select value={negocio.responsavel_id || ''} onChange={(e) => handleUpdateField('responsavel_id', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"><option value="">Ninguém atribuído</option>{listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}</select>
      </div>
    </div>
  );
};

export default BarraLateral;