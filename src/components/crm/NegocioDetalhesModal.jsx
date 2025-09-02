// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2, UserPlus, Search } from 'lucide-react';

// Importando os nossos componentes
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import AddLeadModal from './AddLeadModal';

// --- FUNÇÕES AUXILIARES COMPLETAS ---
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
  // --- ESTADOS ---
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

  // --- FUNÇÕES DE DADOS ---
  const carregarContatosAssociados = useCallback(async (negocioId) => {
    if(!negocioId) return;
    setIsLoadingContatos(true);
    try {
      const { data, error } = await supabase
        .from('crm_negocio_contatos')
        .select('crm_contatos(*)')
        .eq('negocio_id', negocioId);
      if (error) throw error;
      const contatos = data.map(item => item.crm_contatos);
      setContatosAssociados(contatos);
    } catch (error) {
      console.error("Erro ao carregar contatos associados:", error);
    } finally {
      setIsLoadingContatos(false);
    }
  }, []);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) return;
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single();
      if (negocioError) {
        if (negocioError.code === 'PGRST116') {
          alert('Este negócio não foi encontrado. Pode ter sido excluído.');
          onClose();
          return;
        } else {
          throw negocioError;
        }
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

    } catch (error) {
      console.error("Erro ao carregar detalhes do negócio:", error);
      alert("Não foi possível carregar os dados detalhados do negócio.");
    } finally {
      setLoading(false);
    }
  }, [negocioInicial, onClose, carregarContatosAssociados]);

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        setActiveTab('atividades');
        setTermoBusca('');
        setResultadosBusca([]);
        carregarDadosDetalhados();
    }
  }, [isOpen, carregarDadosDetalhados]);
  
  // --- FUNÇÕES DE BUSCA E MANIPULAÇÃO DE CONTATOS ---
  useEffect(() => {
    const buscarContatos = async () => {
      if (termoBusca.length < 2) {
        setResultadosBusca([]);
        return;
      }
      setIsSearching(true);
      try {
        const idsAssociados = contatosAssociados.map(c => c.id);
        const query = supabase
          .from('crm_contatos')
          .select('*')
          .ilike('nome', `%${termoBusca}%`)
          .limit(5);

        if (idsAssociados.length > 0) {
          query.not('id', 'in', `(${idsAssociados.join(',')})`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        setResultadosBusca(data);

      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const debounce = setTimeout(() => { buscarContatos(); }, 300);
    return () => clearTimeout(debounce);
  }, [termoBusca, contatosAssociados]);

  const handleAssociarContato = async (contatoParaAdicionar) => {
    try {
      const { error } = await supabase.from('crm_negocio_contatos').insert({ negocio_id: negocio.id, contato_id: contatoParaAdicionar.id });
      if (error) throw error;
      setContatosAssociados([...contatosAssociados, contatoParaAdicionar]);
      setTermoBusca('');
      setResultadosBusca([]);
    } catch (error) {
      console.error("Erro ao associar contato:", error);
      alert('Não foi possível associar o contato.');
    }
  };

  const handleDesvincularContato = async (contatoIdParaRemover) => {
    if (!window.confirm("Tem certeza que deseja desvincular este contato do negócio?")) return;
    try {
      const { error } = await supabase.from('crm_negocio_contatos').delete().match({ negocio_id: negocio.id, contato_id: contatoIdParaRemover });
      if (error) throw error;
      setContatosAssociados(contatosAssociados.filter(c => c.id !== contatoIdParaRemover));
    } catch(error) {
      console.error("Erro ao desvincular contato:", error);
      alert('Não foi possível desvincular o contato.');
    }
  };

  // --- DEMAIS FUNÇÕES DE AÇÃO ---
  // (Adicione aqui as implementações das suas funções de ação conforme necessário)
  const handleSaveTitulo = async () => { console.log("Salvar título:", novoTitulo) };
  const handleMudarEtapa = async (novaEtapaId) => { console.log("Mudar para etapa:", novaEtapaId) };
  const handleMudarResponsavelTopo = async (novoResponsavelId) => { console.log("Mudar responsável para:", novoResponsavelId) };
  const handleMarcarStatus = async (status) => { console.log("Marcar status como:", status) };
  const handleToggleCompleta = async (id, statusAtual) => { console.log("Mudar status da atividade:", id, !statusAtual) };
  const handleDeletarAtividade = async (id) => { console.log("Deletar atividade:", id) };
  const handleAcaoHistorico = (action, data) => { console.log("Ação no histórico:", action, data) };
  const handleCreateGoogleEvent = async (atividade) => { console.log("Criar evento no Google para:", atividade) };
  const handleExcluirNegocio = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('crm_negocios').delete().eq('id', negocio.id);
      if (error) throw error;
      alert('Negócio excluído com sucesso!');
      onDataChange({ ...negocio, status: 'Excluido' }); 
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir negócio:", error);
      alert("Não foi possível excluir o negócio. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

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
                {/* ... (código do cabeçalho do modal) ... */}
              </div>
              
              <div className="flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                    {/* ... (código da navegação das abas) ... */}
                  </ul>
                </div>

                <div className="flex-grow overflow-y-auto">
                  {activeTab === 'atividades' && (
                    <div className="p-6 flex flex-col gap-6">{/* ... conteúdo da aba atividades ... */}</div>
                  )}

                  {activeTab === 'contatos' && (
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contatos Associados</h3>
                      {isLoadingContatos ? (
                        <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-blue-500" /></div>
                      ) : (
                        <div className="space-y-3 mb-6">
                          {contatosAssociados.length > 0 ? (
                            contatosAssociados.map(contato => (
                              <div key={contato.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email || 'Sem e-mail'}</p>
                                </div>
                                <button onClick={() => handleDesvincularContato(contato.id)} className="text-gray-400 hover:text-red-500 p-1" title="Desvincular contato"><Trash2 size={16} /></button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum contato associado a este negócio.</p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adicionar contato existente</label>
                        <div className="relative">
                          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Digite para buscar um contato..." className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"/>
                          {isSearching && <Loader2 size={18} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                        </div>
                        {resultadosBusca.length > 0 && (
                          <ul className="border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                            {resultadosBusca.map(contato => (
                              <li key={contato.id} className="flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email || 'Sem e-mail'}</p>
                                </div>
                                <button onClick={() => handleAssociarContato(contato)} className="text-blue-600 hover:text-blue-800 p-1" title="Adicionar contato"><UserPlus size={18} /></button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'arquivos' && ( <div className="p-6">{/* ... conteúdo da aba arquivos ... */}</div> )}
                  {activeTab === 'detalhes' && ( <BarraLateral negocio={negocio} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} onDataChange={onDataChange} onAddLeadClick={() => setIsAddLeadModalOpen(true)} /> )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} onLeadAdicionado={() => { alert('Novo lead adicionado com sucesso!'); setIsAddLeadModalOpen(false); }} />
      {isConfirmDeleteOpen && ( <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center">{/* ... código do modal de confirmação ... */}</div> )}
    </>
  );
};

export default NegocioDetalhesModal;