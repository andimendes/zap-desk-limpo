// src/components/crm/NegocioDetalhesModal.jsx (VERSÃO DE DEPURAÇÃO - FINAL)

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
    const handleSave = async () => { setIsSaving(true); await onSave(item, editedContent); setIsSaving(false); };
    return ( <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg p-4 my-4"> <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Editando {item.tipo}</h3> <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500" rows="4" /> <div className="flex justify-end gap-2 mt-2"> <button onClick={onCancel} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300"> Cancelar </button> <button onClick={handleSave} disabled={isSaving || !editedContent.trim()} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 flex items-center"> {isSaving && <Loader2 className="animate-spin mr-2" size={16} />} Salvar Alterações </button> </div> </div> );
};
const differenceInDays = (dateLeft, dateRight) => { const diff = dateLeft.getTime() - dateRight.getTime(); return Math.round(diff / (1000 * 60 * 60 * 24)); };
const FunilProgressBar = ({ etapas = [], etapaAtualId, onEtapaClick }) => { const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId); return ( <div className="flex w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 h-8 mt-2"> {etapas.map((etapa, index) => { const isPassed = index < etapaAtualIndex; const isCurrent = index === etapaAtualIndex; let bgColor = isPassed ? 'bg-green-500 dark:bg-green-600' : isCurrent ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'; let textColor = (isPassed || isCurrent) ? 'text-white' : 'text-gray-700 dark:text-gray-300'; if (isCurrent) textColor += ' font-bold'; return (<button key={etapa.id} onClick={() => onEtapaClick(etapa.id)} className={`flex-1 flex items-center justify-center h-full px-2 text-sm text-center relative transition-colors duration-200 ${bgColor} ${textColor} ${!isPassed ? 'z-10' : 'z-0'} ${isCurrent ? 'shadow-lg' : ''}`}><span className="truncate">{etapa.nome_etapa}</span></button>); })} </div> ); };
  
const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
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
  const carregarArquivos = useCallback(async (negocioId) => { if (!negocioId) return; setIsLoadingArquivos(true); try { const { data, error } = await supabase.from('crm_arquivos').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }); if (error) throw error; setArquivos(data || []); } catch (error) { console.error("Erro ao carregar arquivos:", error); } finally { setIsLoadingArquivos(false); } }, []);
  const carregarContatosAssociados = useCallback(async (negocioId) => { if(!negocioId) return; setIsLoadingContatos(true); try { const { data, error } = await supabase.from('crm_negocio_contatos').select('crm_contatos(*)').eq('negocio_id', negocioId); if (error) throw error; const contatos = (data || []).map(item => item.crm_contatos).filter(Boolean); setContatosAssociados(contatos || []); } catch (error) { console.error("Erro ao carregar contatos associados:", error); } finally { setIsLoadingContatos(false); } }, []);
  const carregarDadosDetalhados = useCallback(async () => { if (!negocioInicial?.id) { setLoading(false); return; } setLoading(true); try { const { data: updatedNegocio, error: negocioError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single(); if (negocioError) { if (negocioError.code === 'PGRST116') { alert('Este negócio não foi encontrado.'); onClose(); return; } else { throw negocioError; } } setNegocio(updatedNegocio); setNovoTitulo(updatedNegocio.titulo); const [focoRes, atividadesRes, notasRes] = await Promise.all([ supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).eq('concluida', false).gte('data_atividade', new Date().toISOString()).order('data_atividade', { ascending: true }).limit(1).maybeSingle(), supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false }), supabase.from('crm_notas').select('*').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false }) ]); if (focoRes.error || atividadesRes.error || notasRes.error) throw new Error('Erro ao buscar dados relacionados.'); setProximaAtividade(focoRes.data); const atividadesHistorico = (atividadesRes.data || []).filter(at => at.id !== focoRes.data?.id); const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item })); const notasFormatadas = (notasRes.data || []).map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item })); const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data); setHistorico(historicoUnificado); if (historicoUnificado.length > 0) { const dias = differenceInDays(new Date(), historicoUnificado[0].data); setAlertaEstagnacao(dias > 7 ? `Negócio parado há ${dias} dias.` : null); } else { const dias = differenceInDays(new Date(), new Date(updatedNegocio.created_at)); setAlertaEstagnacao(`Negócio novo, sem atividades há ${dias} dias.`); } await carregarContatosAssociados(negocioInicial.id); await carregarArquivos(negocioInicial.id); } catch (error) { console.error("Erro ao carregar detalhes do negócio:", error); alert("Não foi possível carregar os dados detalhados do negócio."); } finally { setLoading(false); } }, [negocioInicial, onClose, carregarContatosAssociados, carregarArquivos]);
  useEffect(() => { if (isOpen) { setActiveTab('atividades'); setTermoBusca(''); setResultadosBusca([]); setEditingItem(null); carregarDadosDetalhados(); } }, [isOpen, negocioInicial, carregarDadosDetalhados]);
  useEffect(() => { const buscarContatos = async () => { if (termoBusca.length < 2) { setResultadosBusca([]); return; } setIsSearching(true); try { const idsAssociados = contatosAssociados.map(c => c.id); const query = supabase.from('crm_contatos').select('*').ilike('nome', `%${termoBusca}%`).limit(5); if (idsAssociados.length > 0) { query.not('id', 'in', `(${idsAssociados.join(',')})`); } const { data, error } = await query; if (error) throw error; setResultadosBusca(data || []); } catch (error) { console.error("Erro ao buscar contatos:", error); } finally { setIsSearching(false); } }; const debounce = setTimeout(() => { buscarContatos(); }, 300); return () => clearTimeout(debounce); }, [termoBusca, contatosAssociados]);
  const handleFileUpload = async (event) => { /* ...código... */ }; const handleFileDownload = async (filePath) => { /* ...código... */ }; const handleFileDelete = async (arquivo) => { /* ...código... */ }; const handleAssociarContato = async (contatoParaAdicionar) => { /* ...código... */ }; const handleDesvincularContato = async (contatoIdParaRemover) => { /* ...código... */ }; const handleSaveTitulo = async () => { /* ...código... */ }; const handleToggleCompleta = async (id, statusAtual) => { /* ...código... */ }; const handleAcaoHistorico = async (action, item) => { if (action === 'delete') { if (!window.confirm(`Tem certeza que deseja excluir esta ${item.tipo}?`)) return; const tabela = item.tipo === 'nota' ? 'crm_notas' : 'crm_atividades'; try { const { error } = await supabase.from(tabela).delete().eq('id', item.original.id); if (error) throw error; setHistorico(historico.filter(h => h.original.id !== item.original.id)); } catch (error) { console.error(`Erro ao excluir ${item.tipo}:`, error); alert(`Não foi possível excluir a ${item.tipo}.`); } } else if (action === 'edit') { setEditingItem(item); } }; const handleSaveEdit = async (item, newContent) => { /* ...código... */ }; const handleMudarEtapa = async (novaEtapaId) => { /* ...código... */ }; const handleMudarResponsavelTopo = async (novoResponsavelId) => { /* ...código... */ }; const handleMarcarStatus = async (status) => { /* ...código... */ }; const handleCreateGoogleEvent = async (atividade) => { /* ...código... */ }; const handleExcluirNegocio = async () => { /* ...código... */ };

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
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-words flex items-center gap-2">{negocio.titulo}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleMarcarStatus('Ganho')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-600">Ganho</button>
                    <button onClick={() => handleMarcarStatus('Perdido')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-600">Perdido</button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={24} /></button>
                  </div>
                </div>
                <FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={handleMudarEtapa} />
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
                        <ActivityComposer negocioId={negocio.id} onActionSuccess={carregarDadosDetalhados} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Foco</h3>
                          <AtividadeFoco atividade={proximaAtividade} onConcluir={handleToggleCompleta} />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2">
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Histórico</h3>
                          <ul className="-ml-2">
                            {/* --- SUSPEITO 2 --- */}
                            {/* {historico.map((item, index) => (<ItemLinhaDoTempo key={`${item.tipo}-${item.original.id}-${index}`} item={item} onAction={handleAcaoHistorico} />))} */}
                            {historico.length === 0 && <p className="text-sm text-gray-500">Nenhuma atividade ou nota no histórico.</p>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NegocioDetalhesModal;