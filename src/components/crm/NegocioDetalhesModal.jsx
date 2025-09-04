// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2, UserPlus, Search, Upload, Download, Paperclip, PlusCircle } from 'lucide-react';

import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import EditContactModal from './EditContactModal'; 

// Componente para editar uma nota ou atividade
const EditComposer = ({ item, onSave, onCancel }) => {
    const [editedContent, setEditedContent] = useState(item.conteudo);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(item, editedContent);
        setIsSaving(false);
    };
    
    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg p-4 my-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Editando {item.tipo}</h3>
            <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500"
                rows="4"
            />
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancel} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
                    Cancelar
                </button>
                <button onClick={handleSave} disabled={isSaving || !editedContent.trim()} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 flex items-center">
                    {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                    Guardar Alterações
                </button>
            </div>
        </div>
    );
};

// Função para calcular a diferença de dias
const differenceInDays = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return 0;
    const diff = new Date(dateLeft).getTime() - new Date(dateRight).getTime();
    if (isNaN(diff)) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
};

// Barra de progresso do funil
const FunilProgressBar = ({ etapas = [], etapaAtualId, onEtapaClick }) => {
    const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId);
    return (
      <div className="flex w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 h-8 mt-2">
        {etapas.map((etapa, index) => {
          const isPassed = index < etapaAtualIndex;
          const isCurrent = index === etapaAtualIndex;
          let bgColor = isPassed ? 'bg-green-500 dark:bg-green-600' : isCurrent ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600';
          let textColor = (isPassed || isCurrent) ? 'text-white' : 'text-gray-700 dark:text-gray-300';
          if (isCurrent) textColor += ' font-bold';
          return (<button key={etapa.id} onClick={() => onEtapaClick(etapa.id)} className={`flex-1 flex items-center justify-center h-full px-2 text-sm text-center relative transition-colors duration-200 ${bgColor} ${textColor} ${!isPassed ? 'z-10' : 'z-0'} ${isCurrent ? 'shadow-lg' : ''}`}><span className="truncate">{etapa.nome_etapa}</span></button>);
        })}
      </div>
    );
};

// COMPONENTE PRINCIPAL DO MODAL
const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil = [], listaDeUsers = [], onEmpresaClick }) => {
  const [negocio, setNegocio] = useState(negocioInicial);
  const [proximaAtividade, setProximaAtividade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [alertaEstagnacao, setAlertaEstagnacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTituloEditing, setIsTituloEditing] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('atividades');
  const [arquivos, setArquivos] = useState([]);
  const [isLoadingArquivos, setIsLoadingArquivos] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase
        .from('crm_negocios')
        .select('*, responsavel:profiles(full_name), empresa:crm_empresas(*)')
        .eq('id', negocioInicial.id)
        .single();

      if (negocioError) throw negocioError;
      setNegocio(updatedNegocio);
      setNovoTitulo(updatedNegocio.titulo);
      
      const [focoRes, atividadesRes, notasRes] = await Promise.all([
        supabase.from('crm_atividades').select('*, profiles(full_name, avatar_url)').eq('negocio_id', negocioInicial.id).eq('concluida', false).gte('data_atividade', new Date().toISOString()).order('data_atividade', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('crm_atividades').select('*, profiles(full_name, avatar_url)').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false }),
        supabase.from('crm_notas').select('*, profiles(full_name, avatar_url)').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false })
      ]);
      
      setProximaAtividade(focoRes.data);
      const atividadesHistorico = (atividadesRes.data || []).filter(at => at.id !== focoRes.data?.id);
      
      const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, autor: item.profiles, original: item }));
      const notasFormatadas = (notasRes.data || []).map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, autor: item.profiles, original: item }));
      
      const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data);
      setHistorico(historicoUnificado);
      
      if (historicoUnificado.length > 0) {
        const dias = differenceInDays(new Date(), historicoUnificado[0].data);
        setAlertaEstagnacao(dias > 7 ? `Negócio parado há ${dias} dias.` : null);
      } else {
        const dias = differenceInDays(new Date(), new Date(updatedNegocio.created_at));
        setAlertaEstagnacao(`Negócio novo, sem atividades há ${dias} dias.`);
      }

    } catch (error) {
      console.error("Erro ao carregar detalhes do negócio:", error);
    } finally {
      setLoading(false);
    }
  }, [negocioInicial]);

  useEffect(() => {
    if (isOpen) {
        setNegocio(negocioInicial);
        setActiveTab('atividades');
        setEditingItem(null);
        carregarDadosDetalhados();
    }
  }, [isOpen, negocioInicial, carregarDadosDetalhados]);
  
  const handleMarcarStatus = async (status) => {
    const { data: negocioAtualizado, error } = await supabase
      .from('crm_negocios')
      .update({ status })
      .eq('id', negocio.id)
      .select()
      .single();
    
    if(error) {
      alert(`Não foi possível marcar como ${status}.`);
      return;
    }

    if (status === 'Ganho' && negocio.empresa_id) {
      const { error: empresaError } = await supabase
        .from('crm_empresas')
        .update({ tipo: 'Cliente', status: 'Ativo' })
        .eq('id', negocio.empresa_id);

      if (empresaError) {
        alert("O negócio foi marcado como Ganho, mas houve um erro ao atualizar a empresa.");
        console.error("Erro ao promover empresa:", empresaError);
      }
    }
    
    alert(`Negócio marcado como ${status}!`);
    onDataChange(negocioAtualizado);
    onClose();
  };
  
  const handleSaveTitulo = async () => {
    if (!novoTitulo.trim() || novoTitulo === negocio.titulo) { setIsTituloEditing(false); return; }
    try {
      const { data, error } = await supabase.from('crm_negocios').update({ titulo: novoTitulo.trim() }).eq('id', negocio.id).select().single();
      if (error) throw error;
      onDataChange(data);
      setIsTituloEditing(false);
    } catch (error) { console.error("Erro ao guardar título:", error); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {loading ? (
            <div className="flex-grow w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : negocio && (
            <>
              <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isTituloEditing ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitulo(); }} className="text-2xl font-bold dark:bg-gray-700 p-1 border rounded"/>
                        <button onClick={handleSaveTitulo}><Check size={18}/></button>
                        <button onClick={() => setIsTituloEditing(false)}><X size={18}/></button>
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {negocio.titulo}
                        <button onClick={() => setIsTituloEditing(true)}><Pencil size={16}/></button>
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleMarcarStatus('Ganho')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-600">Ganho</button>
                    <button onClick={() => handleMarcarStatus('Perdido')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-600">Perdido</button>
                    <button onClick={onClose}><X size={24} /></button>
                  </div>
                </div>
                {etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={() => {}} />)}
              </div>
              
              <div className="flex flex-grow overflow-hidden">
                <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
                  <BarraLateral 
                    negocio={negocio} 
                    etapasDoFunil={etapasDoFunil} 
                    listaDeUsers={listaDeUsers} 
                    onDataChange={onDataChange}
                    onForcarRecarga={carregarDadosDetalhados}
                    onEmpresaClick={onEmpresaClick}
                  />
                </div>
                <div className="w-2/3 flex flex-col overflow-hidden">
                   <div className="border-b dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                      <li className="mr-2"><button onClick={() => setActiveTab('atividades')} className={`inline-block p-4 rounded-t-lg border-b-2 ${ activeTab === 'atividades' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300' }`}>Atividades</button></li>
                      <li className="mr-2"><button onClick={() => setActiveTab('arquivos')} className={`inline-block p-4 rounded-t-lg border-b-2 ${ activeTab === 'arquivos' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300' }`}>Arquivos</button></li>
                    </ul>
                  </div>
                  <div className="flex-grow overflow-y-auto p-6">
                    {activeTab === 'atividades' && (
                        <>
                            {alertaEstagnacao && (<div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-100 p-2 rounded-md"><AlertTriangle size={16} />{alertaEstagnacao}</div>)}
                            <ActivityComposer negocioId={negocio.id} onActionSuccess={carregarDadosDetalhados} />
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Foco</h3>
                              <AtividadeFoco atividade={proximaAtividade} onConcluir={() => {}} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Histórico</h3>
                              <ul>{historico.map((item, index) => (<ItemLinhaDoTempo key={index} item={item} onAction={() => {}} />))}</ul>
                            </div>
                        </>
                    )}
                     {activeTab === 'arquivos' && (
                        <div>Arquivos aqui...</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
};

export default NegocioDetalhesModal;