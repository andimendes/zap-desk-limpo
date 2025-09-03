// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2, UserPlus, Search, Upload, Download, Paperclip } from 'lucide-react';

import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import AddLeadModal from './AddLeadModal';

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
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

const differenceInDays = (dateLeft, dateRight) => {
    const diff = dateLeft.getTime() - dateRight.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
};

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
  
const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
  // --- ALTERAÇÃO PARA DEBUG ---
  console.log("DEBUG: Props recebidas em NegocioDetalhesModal", { negocioInicial, etapasDoFunil, listaDeUsers });

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
  const [contatosAssociados, setContatosAssociados] = useState([]);
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [arquivos, setArquivos] = useState([]);
  const [isLoadingArquivos, setIsLoadingArquivos] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const carregarArquivos = useCallback(async (negocioId) => {
    if (!negocioId) return;
    setIsLoadingArquivos(true);
    try {
      const { data, error } = await supabase.from('crm_arquivos').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false });
      if (error) throw error;
      setArquivos(data || []);
    } catch (error) { console.error("Erro ao carregar arquivos:", error); } 
    finally { setIsLoadingArquivos(false); }
  }, []);

  const carregarContatosAssociados = useCallback(async (negocioId) => {
    if(!negocioId) return;
    setIsLoadingContatos(true);
    try {
      const { data, error } = await supabase.from('crm_negocio_contatos').select('crm_contatos(*)').eq('negocio_id', negocioId);
      if (error) throw error;
      const contatos = (data || []).map(item => item.crm_contatos).filter(Boolean);
      setContatosAssociados(contatos || []);
    } catch (error) { console.error("Erro ao carregar contatos associados:", error); } 
    finally { setIsLoadingContatos(false); }
  }, []);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single();
      if (negocioError) {
        if (negocioError.code === 'PGRST116') { alert('Este negócio não foi encontrado.'); onClose(); return; } 
        else { throw negocioError; }
      }
      setNegocio(updatedNegocio);
      setNovoTitulo(updatedNegocio.titulo);
      
      const [focoRes, atividadesRes, notasRes] = await Promise.all([
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).eq('concluida', false).gte('data_atividade', new Date().toISOString()).order('data_atividade', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false }),
        supabase.from('crm_notas').select('*').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false })
      ]);
      if (focoRes.error || atividadesRes.error || notasRes.error) throw new Error('Erro ao buscar dados relacionados.');
      setProximaAtividade(focoRes.data);
      const atividadesHistorico = (atividadesRes.data || []).filter(at => at.id !== focoRes.data?.id);
      const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item }));
      const notasFormatadas = (notasRes.data || []).map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item }));
      const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data);
      setHistorico(historicoUnificado);
      
      if (historicoUnificado.length > 0) {
        const dias = differenceInDays(new Date(), historicoUnificado[0].data);
        setAlertaEstagnacao(dias > 7 ? `Negócio parado há ${dias} dias.` : null);
      } else {
        const dias = differenceInDays(new Date(), new Date(updatedNegocio.created_at));
        setAlertaEstagnacao(`Negócio novo, sem atividades há ${dias} dias.`);
      }

      await carregarContatosAssociados(negocioInicial.id);
      await carregarArquivos(negocioInicial.id);
    } catch (error) {
      console.error("Erro ao carregar detalhes do negócio:", error);
      alert("Não foi possível carregar os dados detalhados do negócio.");
    } finally {
      setLoading(false);
    }
  }, [negocioInicial, onClose, carregarContatosAssociados, carregarArquivos]);

  useEffect(() => {
    if (isOpen) {
        setActiveTab('atividades');
        setTermoBusca('');
        setResultadosBusca([]);
        setEditingItem(null);
        carregarDadosDetalhados();
    }
  }, [isOpen, negocioInicial]);
  
  useEffect(() => {
    const buscarContatos = async () => {
      if (termoBusca.length < 2) { setResultadosBusca([]); return; }
      setIsSearching(true);
      try {
        const idsAssociados = contatosAssociados.map(c => c.id);
        const query = supabase.from('crm_contatos').select('*').ilike('nome', `%${termoBusca}%`).limit(5);
        if (idsAssociados.length > 0) { query.not('id', 'in', `(${idsAssociados.join(',')})`); }
        const { data, error } = await query;
        if (error) throw error;
        setResultadosBusca(data);
      } catch (error) { console.error("Erro ao buscar contatos:", error); } finally { setIsSearching(false); }
    };
    const debounce = setTimeout(() => { buscarContatos(); }, 300);
    return () => clearTimeout(debounce);
  }, [termoBusca, contatosAssociados]);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");
      const filePath = `${negocio.id}/${crypto.randomUUID()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('crm-arquivos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from('crm_arquivos').insert({ negocio_id: negocio.id, user_id: user.id, nome_arquivo: file.name, path_storage: uploadData.path, tamanho_arquivo: file.size, tipo_mime: file.type });
      if (insertError) throw insertError;
      await carregarArquivos(negocio.id);
    } catch (error) { console.error("Erro no upload:", error); alert("Falha no upload do arquivo."); } 
    finally { setIsUploading(false); event.target.value = ''; }
  };

  const handleFileDownload = async (filePath) => {
    try {
        const { data, error } = await supabase.storage.from('crm-arquivos').getPublicUrl(filePath);
        if (error) throw error;
        window.open(data.publicUrl, '_blank');
    } catch (error) { console.error("Erro no download:", error); alert("Não foi possível obter o link do arquivo."); }
  };

  const handleFileDelete = async (arquivo) => {
    if (!window.confirm(`Excluir "${arquivo.nome_arquivo}"?`)) return;
    try {
        const { error: storageError } = await supabase.storage.from('crm-arquivos').remove([arquivo.path_storage]);
        if (storageError) throw storageError;
        const { error: dbError } = await supabase.from('crm_arquivos').delete().eq('id', arquivo.id);
        if (dbError) throw dbError;
        setArquivos(arquivos.filter(a => a.id !== arquivo.id));
    } catch (error) { console.error("Erro ao excluir:", error); alert("Não foi possível excluir o arquivo."); }
  };
  
  const handleAssociarContato = async (contatoParaAdicionar) => {
    try {
      const { error } = await supabase.from('crm_negocio_contatos').insert({ negocio_id: negocio.id, contato_id: contatoParaAdicionar.id });
      if (error) throw error;
      setContatosAssociados([...contatosAssociados, contatoParaAdicionar]);
      setTermoBusca('');
      setResultadosBusca([]);
    } catch (error) { console.error("Erro ao associar contato:", error); alert('Não foi possível associar o contato.'); }
  };

  const handleDesvincularContato = async (contatoIdParaRemover) => {
    if (!window.confirm("Desvincular este contato?")) return;
    try {
      const { error } = await supabase.from('crm_negocio_contatos').delete().match({ negocio_id: negocio.id, contato_id: contatoIdParaRemover });
      if (error) throw error;
      setContatosAssociados(contatosAssociados.filter(c => c.id !== contatoIdParaRemover));
    } catch(error) { console.error("Erro ao desvincular contato:", error); alert('Não foi possível desvincular o contato.'); }
  };

  const handleSaveTitulo = async () => {
    if (!novoTitulo.trim() || novoTitulo === negocio.titulo) { setIsTituloEditing(false); return; }
    try {
      const { data, error } = await supabase.from('crm_negocios').update({ titulo: novoTitulo.trim() }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single();
      if (error) throw error;
      setNegocio(data);
      onDataChange(data);
      setIsTituloEditing(false);
    } catch (error) { console.error("Erro ao salvar título:", error); alert("Não foi possível atualizar o título."); }
  };
  
  const handleToggleCompleta = async (id, statusAtual) => {
    try {
      await supabase.from('crm_atividades').update({ concluida: !statusAtual }).eq('id', id);
      await carregarDadosDetalhados();
    } catch (error) { console.error("Erro ao concluir atividade:", error); alert("Não foi possível marcar a atividade."); }
  };
  
  const handleAcaoHistorico = async (action, item) => {
    if (action === 'delete') {
      if (!window.confirm(`Tem certeza que deseja excluir esta ${item.tipo}?`)) return;
      const tabela = item.tipo === 'nota' ? 'crm_notas' : 'crm_atividades';
      try {
        const { error } = await supabase.from(tabela).delete().eq('id', item.original.id);
        if (error) throw error;
        setHistorico(historico.filter(h => h.original.id !== item.original.id));
      } catch (error) { console.error(`Erro ao excluir ${item.tipo}:`, error); alert(`Não foi possível excluir a ${item.tipo}.`); }
    } else if (action === 'edit') {
        setEditingItem(item);
    }
  };

  const handleSaveEdit = async (item, newContent) => {
    const tabela = item.tipo === 'nota' ? 'crm_notas' : 'crm_atividades';
    const coluna = item.tipo === 'nota' ? 'conteudo' : 'descricao';
    try {
        const { error } = await supabase.from(tabela).update({ [coluna]: newContent }).eq('id', item.original.id);
        if (error) throw error;
        setEditingItem(null);
        await carregarDadosDetalhados();
    } catch(error) {
        console.error(`Erro ao editar ${item.tipo}:`, error);
        alert(`Não foi possível salvar as alterações da ${item.tipo}.`);
    }
  };
  
  const handleMudarEtapa = async (novaEtapaId) => {
    try {
      const { data, error } = await supabase.from('crm_negocios').update({ etapa_id: novaEtapaId }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single();
      if(error) throw error;
      setNegocio(data);
      onDataChange(data);
    } catch (error) { console.error("Erro ao mudar etapa:", error); alert("Não foi possível alterar a etapa."); }
  };
  
  const handleMudarResponsavelTopo = async (novoResponsavelId) => {
    try {
      const { data, error } = await supabase.from('crm_negocios').update({ responsavel_id: novoResponsavelId || null }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single();
      if(error) throw error;
      setNegocio(data);
      onDataChange(data);
    } catch (error) { console.error("Erro ao mudar responsável:", error); alert("Não foi possível alterar o responsável."); }
  };
  
  const handleMarcarStatus = async (status) => {
    const { data, error } = await supabase.from('crm_negocios').update({ status }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single();
    if(error) { alert(`Não foi possível marcar como ${status}.`); } 
    else {
      alert(`Negócio marcado como ${status}!`);
      onDataChange(data);
      onClose();
    }
  };

  const handleCreateGoogleEvent = async (atividade) => { console.log("Ação: Criar evento no Google para:", atividade); };
  
  const handleExcluirNegocio = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('crm_negocios').delete().eq('id', negocio.id);
      if (error) throw error;
      alert('Negócio excluído com sucesso!');
      onDataChange({ id: negocio.id, status: 'Excluido' }); 
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (error) { console.error("Erro ao excluir negócio:", error); alert("Não foi possível excluir o negócio."); } 
    finally { setIsDeleting(false); }
  };

  if (!isOpen) return null;

  const tabs = [ { id: 'atividades', label: 'Atividades' }, { id: 'arquivos', label: 'Arquivos' } ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-8" onClick={onClose}>
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
                        <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitulo(); }} className="text-2xl font-bold dark:bg-gray-700 dark:text-gray-100 p-1 border rounded"/>
                        <button onClick={handleSaveTitulo} className="text-green-600 hover:text-green-800"><Check size={18}/></button>
                        <button onClick={() => setIsTituloEditing(false)} className="text-red-600 hover:text-red-800"><X size={18}/></button>
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-words flex items-center gap-2">
                        {negocio.titulo}
                        <button onClick={() => setIsTituloEditing(true)} className="text-gray-500 hover:text-blue-600"><Pencil size={16}/></button>
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleMarcarStatus('Ganho')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-600">Ganho</button>
                    <button onClick={() => handleMarcarStatus('Perdido')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-600">Perdido</button>
                    <button onClick={() => setIsConfirmDeleteOpen(true)} className="text-gray-500 hover:text-red-600 dark:hover:text-red-500 p-1" title="Excluir Negócio"><Trash2 size={20} /></button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={24} /></button>
                  </div>
                </div>
                {etapasDoFunil && etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={handleMudarEtapa} />)}
              </div>
              
              <div className="flex flex-grow overflow-hidden">
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                  <BarraLateral negocio={negocio} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} onDataChange={onDataChange} />
                </div>
                <div className="w-2/3 flex flex-col overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                      {tabs.map(tab => (<li key={tab.id} className="mr-2"><button onClick={() => setActiveTab(tab.id)} className={`inline-block p-4 rounded-t-lg border-b-2 transition-colors duration-200 ${ activeTab === tab.id ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300' }`}>{tab.label}</button></li>))}
                    </ul>
                  </div>
                  <div className="flex-grow overflow-y-auto">
                    {activeTab === 'atividades' && (
                      <div className="p-6 flex flex-col gap-6">
                        {alertaEstagnacao && (<div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-md"><AlertTriangle size={16} />{alertaEstagnacao}</div>)}
                        
                        {editingItem ? (
                            <EditComposer item={editingItem} onSave={handleSaveEdit} onCancel={() => setEditingItem(null)} />
                        ) : (
                            <ActivityComposer negocioId={negocio.id} onActionSuccess={carregarDadosDetalhados} />
                        )}

                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Foco</h3>
                          <div className="flex items-start gap-2">
                            <AtividadeFoco atividade={proximaAtividade} onConcluir={handleToggleCompleta} />
                            {proximaAtividade && <button onClick={() => handleCreateGoogleEvent(proximaAtividade)} className="p-2 text-gray-500 hover:text-blue-600" title="Adicionar ao Google Calendar"><CalendarPlus size={20}/></button>}
                          </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto pr-2">
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Histórico</h3>
                          <ul className="-ml-2">
                            {historico.map((item, index) => (<ItemLinhaDoTempo key={`${item.tipo}-${item.original.id}-${index}`} item={item} onAction={handleAcaoHistorico} />))}
                            {historico.length === 0 && <p className="text-sm text-gray-500">Nenhuma atividade ou nota no histórico.</p>}
                          </ul>
                        </div>
                      </div>
                    )}
                    {activeTab === 'arquivos' && (
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Arquivos</h3>
                          <label className={`bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer ${isUploading ? 'bg-blue-300 cursor-not-allowed' : ''}`}>
                              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                              <span>{isUploading ? 'Enviando...' : 'Enviar'}</span>
                              <input type="file" disabled={isUploading} onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>
                        {isLoadingArquivos ? (<div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-blue-500" /></div>) : (
                          <div className="space-y-3">
                            {arquivos.length > 0 ? ( arquivos.map(arquivo => ( <div key={arquivo.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md transition-all hover:shadow-md"><div className="flex items-center gap-3"><Paperclip className="text-gray-500" /><div className="truncate"><p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{arquivo.nome_arquivo}</p><p className="text-sm text-gray-600 dark:text-gray-400">{`${(arquivo.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB`}</p></div></div><div className="flex items-center gap-2"><button onClick={() => handleFileDownload(arquivo.path_storage)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Baixar"><Download size={18} /></button><button onClick={() => handleFileDelete(arquivo)} className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Excluir"><Trash2 size={18} /></button></div></div>))) : (<div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-gray-500">Nenhum arquivo enviado.</p><p className="text-sm text-gray-400">Use o botão acima.</p></div>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AddLeadModal isOpen={false} onClose={()=>{}} onLeadAdicionado={()=>{}} />
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar Exclusão</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Tem certeza que deseja excluir o negócio "{negocio?.titulo}"?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsConfirmDeleteOpen(false)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
              <button onClick={handleExcluirNegocio} disabled={isDeleting} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 flex items-center">{isDeleting && <Loader2 className="animate-spin mr-2" size={16} />} Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NegocioDetalhesModal;