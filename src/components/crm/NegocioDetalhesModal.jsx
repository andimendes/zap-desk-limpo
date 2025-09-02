// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2, UserPlus, Search, Upload, Download, Paperclip } from 'lucide-react';

import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import AddLeadModal from './AddLeadModal';

const differenceInDays = (dateLeft, dateRight) => {
    const diff = dateLeft.getTime() - dateRight.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
};

const FunilProgressBar = ({ etapas, etapaAtualId, onEtapaClick }) => {
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
  const [negocio, setNegocio] = useState(negocioInicial);
  const [proximaAtividade, setProximaAtividade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [alertaEstagnacao, setAlertaEstagnacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTituloEditing, setIsTituloEditing] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
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

  const carregarArquivos = useCallback(async (negocioId) => {
    if (!negocioId) return;
    setIsLoadingArquivos(true);
    try {
      const { data, error } = await supabase.from('crm_arquivos').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false });
      if (error) throw error;
      setArquivos(data);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
    } finally {
      setIsLoadingArquivos(false);
    }
  }, []);

  const carregarContatosAssociados = useCallback(async (negocioId) => {
    if(!negocioId) return;
    setIsLoadingContatos(true);
    try {
      const { data, error } = await supabase.from('crm_negocio_contatos').select('crm_contatos(*)').eq('negocio_id', negocioId);
      if (error) throw error;
      const contatos = data.map(item => item.crm_contatos).filter(Boolean);
      setContatosAssociados(contatos);
    } catch (error) {
      console.error("Erro ao carregar contatos associados:", error);
    } finally {
      setIsLoadingContatos(false);
    }
  }, []);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) return;
    setLoading(true);
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single();
      if (negocioError) {
        if (negocioError.code === 'PGRST116') {
          alert('Este negócio não foi encontrado.'); onClose(); return;
        } else { throw negocioError; }
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
      const atividadesHistorico = atividadesRes.data.filter(at => at.id !== focoRes.data?.id);
      const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item }));
      const notasFormatadas = notasRes.data.map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item }));
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
        carregarDadosDetalhados();
    }
  }, [isOpen, negocioInicial]); // Simplificado para re-rodar se o negocioInicial mudar
  
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

  const handleAssociarContato = async (contatoParaAdicionar) => { /* ...código da função... */ };
  const handleDesvincularContato = async (contatoIdParaRemover) => { /* ...código da função... */ };
  const handleFileUpload = async (event) => { /* ...código da função... */ };
  const handleFileDownload = async (filePath) => { /* ...código da função... */ };
  const handleFileDelete = async (arquivo) => { /* ...código da função... */ };
  const handleSaveTitulo = async () => { console.log("Salvar título:", novoTitulo); };
  const handleMudarEtapa = async (novaEtapaId) => { console.log("Mudar para etapa:", novaEtapaId); };
  const handleMudarResponsavelTopo = async (novoResponsavelId) => { console.log("Mudar responsável para:", novoResponsavelId); };
  const handleMarcarStatus = async (status) => { console.log("Marcar status como:", status); };
  const handleToggleCompleta = async (id, statusAtual) => { console.log("Mudar status da atividade:", id, !statusAtual); };
  const handleDeletarAtividade = async (id) => { console.log("Deletar atividade:", id); };
  const handleAcaoHistorico = (action, data) => { console.log("Ação no histórico:", action, data); };
  const handleCreateGoogleEvent = async (atividade) => { console.log("Criar evento no Google para:", atividade); };
  const handleExcluirNegocio = async () => { /* ...código da função... */ };

  if (!isOpen) return null;

  const tabs = [
    { id: 'atividades', label: 'Atividades' },
    { id: 'contatos', label: 'Contatos' },
    { id: 'arquivos', label: 'Arquivos' },
    { id: 'detalhes', label: 'Detalhes' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-8" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {loading ? (
            <div className="flex-grow w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : negocio && (
            <>
              <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
                 {/* ... JSX do Cabeçalho ... */}
              </div>
              <div className="flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                    {tabs.map(tab => (
                      <li key={tab.id} className="mr-2">
                        <button onClick={() => setActiveTab(tab.id)} className={`inline-block p-4 rounded-t-lg border-b-2 transition-colors duration-200 ${ activeTab === tab.id ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300' }`}>
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-grow overflow-y-auto">
                  {activeTab === 'atividades' && ( <div className="p-6 flex flex-col gap-6">{/* ... JSX da aba Atividades ... */}</div> )}
                  {activeTab === 'contatos' && ( <div className="p-6">{/* ... JSX da aba Contatos ... */}</div> )}
                  {activeTab === 'arquivos' && ( <div className="p-6">{/* ... JSX da aba Arquivos ... */}</div> )}
                  {activeTab === 'detalhes' && ( <BarraLateral negocio={negocio} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} onDataChange={onDataChange} onAddLeadClick={() => setIsAddLeadModalOpen(true)} /> )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} onLeadAdicionado={() => { alert('Novo lead adicionado com sucesso!'); setIsAddLeadModalOpen(false); }} />
      {isConfirmDeleteOpen && ( <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center">{/* ... JSX do modal de confirmação ... */}</div> )}
    </>
  );
};

export default NegocioDetalhesModal;