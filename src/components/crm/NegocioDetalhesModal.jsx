// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, Pencil, Check, X, Undo2, Trash2 } from 'lucide-react';
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import ContatoFormModal from './ContatoFormModal';
import BuscaECriaContatoModal from './BuscaECriaContatoModal';

// ... (as funções auxiliares 'differenceInDays', 'FunilProgressBar', 'ConfirmationModal' continuam iguais)
const differenceInDays = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return 0;
    const diff = new Date(dateLeft).getTime() - new Date(dateRight).getTime();
    if (isNaN(diff)) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
};
const FunilProgressBar = ({ etapas = [], etapaAtualId, onEtapaClick }) => {
    const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId);
    return (
      <div className="flex w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 h-8 mt-2">
        {etapas.map((eta, index) => {
          const isPassed = index < etapaAtualIndex;
          const isCurrent = index === etapaAtualIndex;
          let bgColor = isPassed ? 'bg-green-500 dark:bg-green-600' : isCurrent ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600';
          let textColor = (isPassed || isCurrent) ? 'text-white' : 'text-gray-700 dark:text-gray-300';
          if (isCurrent) textColor += ' font-bold';
          return (<button key={eta.id} onClick={() => onEtapaClick(eta.id)} className={`flex-1 flex items-center justify-center h-full px-2 text-sm text-center relative transition-colors duration-200 ${bgColor} ${textColor} ${!isPassed ? 'z-10' : 'z-0'} ${isCurrent ? 'shadow-lg' : ''}`}><span className="truncate">{eta.nome_etapa}</span></button>);
        })}
      </div>
    );
};
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center disabled:bg-red-400"
          >
            {isDeleting && <Loader2 className="animate-spin mr-2" size={16} />}
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};


const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil = [], listaDeUsers = [], onEmpresaClick }) => {
  const [negocio, setNegocio] = useState(negocioInicial);
  const [proximaAtividade, setProximaAtividade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [alertaEstagnacao, setAlertaEstagnacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTituloEditing, setIsTituloEditing] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [activeTab, setActiveTab] = useState('atividades');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditContatoOpen, setIsEditContatoOpen] = useState(false);
  const [isAddContatoOpen, setIsAddContatoOpen] = useState(false);
  const [contatoEmEdicao, setContatoEmEdicao] = useState(null);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      // --- CORREÇÃO AQUI: Trocado 'contatos(*)' por 'crm_contatos(*)' ---
      const { data: updatedNegocio, error: negocioError } = await supabase
        .from('crm_negocios')
        .select('*, responsavel:profiles(full_name), empresa:crm_empresas(*), contato:crm_contatos(*)')
        .eq('id', negocioInicial.id)
        .single();

      if (negocioError) throw negocioError;
      setNegocio(updatedNegocio);
      // --- CORREÇÃO AQUI: Trocado 'titulo' por 'nome_negocio' ---
      setNovoTitulo(updatedNegocio.nome_negocio); 
      
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
        carregarDadosDetalhados();
    }
  }, [isOpen, negocioInicial, carregarDadosDetalhados]);
  
    // ... (o resto das funções 'handle' continuam iguais, mas com as correções de nomes de colunas abaixo)
    const handleEditarContato = (contato) => {
        setContatoEmEdicao(contato);
        setIsEditContatoOpen(true);
    };
    const handleAdicionarContato = () => {
        setIsAddContatoOpen(true);
    };
    const handleSwitchToCreateContato = () => {
        setIsAddContatoOpen(false);
        setContatoEmEdicao(null); 
        setIsEditContatoOpen(true);
    };
    const handleCloseContactModals = () => {
        setIsEditContatoOpen(false);
        setIsAddContatoOpen(false);
        setContatoEmEdicao(null);
        carregarDadosDetalhados(); 
    };
    const handleMarcarStatus = async (status) => {
        setIsStatusUpdating(true);
        try {
          const { data: negocioAtualizado, error: negocioError } = await supabase.from('crm_negocios').update({ status }).eq('id', negocio.id).select().single();
          if (negocioError) throw negocioError;
          if (negocio.empresa_id) {
            if (status === 'Ganho' && negocio.empresa.status !== 'Cliente Ativo') {
              await supabase.from('crm_empresas').update({ status: 'Cliente Ativo' }).eq('id', negocio.empresa_id);
            } else if (status === 'Perdido' && negocio.empresa.status === 'Cliente Ativo') {
              await supabase.from('crm_empresas').update({ status: 'Inativo' }).eq('id', negocio.empresa_id);
            }
          }
          alert(`Negócio marcado como ${status} com sucesso!`);
          onDataChange(negocioAtualizado);
          onClose();
        } catch (error) {
          console.error('Falha na operação de mudança de status:', error);
          alert(`Erro ao atualizar o negócio: ${error.message}`);
        } finally {
          setIsStatusUpdating(false);
        }
    };
    const handleReverterNegocio = async () => {
        if (!etapasDoFunil || etapasDoFunil.length === 0) {
          alert("Não foi possível encontrar as etapas do funil para reverter o negócio.");
          return;
        }
        const primeiraEtapaId = etapasDoFunil[0].id;
        setIsStatusUpdating(true);
        try {
          const { data: negocioAtualizado, error } = await supabase.from('crm_negocios').update({ status: 'Ativo', etapa_id: primeiraEtapaId }).eq('id', negocio.id).select().single();
          if (error) throw error;
          alert("Negócio revertido para 'Em Andamento'!");
          onDataChange(negocioAtualizado);
          onClose();
        } catch (error) {
          alert("Erro ao reverter o negócio.");
          console.error("Erro ao reverter negócio:", error);
        } finally {
          setIsStatusUpdating(false);
        }
    };
    const handleDeletarNegocio = async () => {
        setIsDeleting(true);
        try {
          const { error } = await supabase.from('crm_negocios').delete().eq('id', negocio.id);
          if (error) throw error;
          alert("Negócio deletado com sucesso!");
          onDataChange({ id: negocio.id, status: 'Deletado' });
          onClose();
        } catch (error) {
          alert("Erro ao deletar o negócio.");
          console.error("Erro ao deletar negócio:", error);
        } finally {
          setIsDeleting(false);
          setIsConfirmDeleteOpen(false);
        }
    };
    const handleChangeEtapa = async (novaEtapaId) => {
        if (novaEtapaId === negocio.etapa_id) return;
        try {
          const { data: negocioAtualizado, error } = await supabase.from('crm_negocios').update({ etapa_id: novaEtapaId, etapa_modificada_em: new Date().toISOString() }).eq('id', negocio.id).select('*, responsavel:profiles(full_name), empresa:crm_empresas(*), contato:crm_contatos(*)').single();
          if (error) throw error;
          setNegocio(negocioAtualizado);
          onDataChange(negocioAtualizado);
        } catch (error) {
          alert("Erro ao atualizar a etapa do negócio.");
          console.error("Erro ao mudar de etapa:", error);
        }
    };
    const handleSaveTitulo = async () => {
        const tituloTrimmed = novoTitulo.trim();
        if (!tituloTrimmed || tituloTrimmed === negocio.nome_negocio) {
          setIsTituloEditing(false);
          setNovoTitulo(negocio.nome_negocio);
          return;
        }
        try {
          const { data, error } = await supabase.from('crm_negocios').update({ nome_negocio: tituloTrimmed }).eq('id', negocio.id).select().single();
          if (error) throw error;
          onDataChange(data);
setIsTituloEditing(false);
        } catch (error) {
          console.error("Erro ao guardar título:", error);
          alert("Não foi possível salvar o novo título.");
        }
    };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {loading ? ( <div className="flex-grow w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div> ) : negocio && ( <>
                <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {isTituloEditing ? (
                         <div className="flex items-center gap-2">
                          <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitulo(); }} className="text-2xl font-bold dark:bg-gray-700 p-1 border rounded"/>
                          <button onClick={handleSaveTitulo} className="p-1 rounded hover:bg-gray-200"><Check size={18}/></button>
                          <button onClick={() => setIsTituloEditing(false)} className="p-1 rounded hover:bg-gray-200"><X size={18}/></button>
                        </div>
                      ) : (
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          {/* --- CORREÇÃO AQUI: Trocado 'titulo' por 'nome_negocio' --- */}
                          {negocio.nome_negocio}
                          <button onClick={() => setIsTituloEditing(true)} className="text-gray-400 hover:text-gray-700"><Pencil size={16}/></button>
                        </h2>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {negocio.status === 'Ativo' ? (
                        <>
                          <button onClick={() => handleMarcarStatus('Ganho')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-600 flex items-center disabled:bg-green-400" disabled={isStatusUpdating}>
                            {isStatusUpdating && <Loader2 className="animate-spin mr-2" size={16}/>} Ganho
                          </button>
                          <button onClick={() => handleMarcarStatus('Perdido')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-600 flex items-center disabled:bg-red-400" disabled={isStatusUpdating}>
                            {isStatusUpdating && <Loader2 className="animate-spin mr-2" size={16}/>} Perdido
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={handleReverterNegocio} className="bg-yellow-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-yellow-600 flex items-center disabled:bg-yellow-400" disabled={isStatusUpdating}>
                            {isStatusUpdating && <Loader2 className="animate-spin mr-2" size={16}/>} <Undo2 size={16} className="mr-1"/> Reverter para Ativo
                          </button>
                          <button onClick={() => setIsConfirmDeleteOpen(true)} className="bg-gray-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-gray-600 flex items-center" disabled={isStatusUpdating}>
                            <Trash2 size={16} className="mr-1"/> Deletar
                          </button>
                        </>
                      )}
                      <button onClick={onClose} disabled={isStatusUpdating}><X size={24} /></button>
                    </div>
                  </div>
                  {negocio.status === 'Ativo' && etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={handleChangeEtapa} />)}
                </div>
                
                <div className="flex flex-grow overflow-hidden">
                  <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
                    <BarraLateral negocio={negocio} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} onDataChange={onDataChange} onForcarRecarga={carregarDadosDetalhados} onEmpresaClick={onEmpresaClick} onEditarContato={handleEditarContato} onAdicionarContato={handleAdicionarContato} />
                  </div>
                  <div className="w-2/3 flex flex-col overflow-hidden">
                     <div className="border-b dark:border-gray-700">
                      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                        <li className="mr-2"><button onClick={() => setActiveTab('atividades')} className={`inline-block p-4 rounded-t-lg border-b-2 ${ activeTab === 'atividades' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300' }`}>Atividades</button></li>
                        <li className="mr-2"><button onClick={() => setActiveTab('arquivos')} className={`inline-block p-4 rounded-t-lg border-b-2 ${ activeTab === 'arquivos' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300' }`}>Arquivos</button></li>
                      </ul>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6">
                      {activeTab === 'atividades' && ( <>
                          {alertaEstagnacao && (<div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-100 p-2 rounded-md"><AlertTriangle size={16} />{alertaEstagnacao}</div>)}
                          <ActivityComposer negocioId={negocio.id} onActionSuccess={carregarDadosDetalhados} />
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Foco</h3>
                            <AtividadeFoco atividade={proximaAtividade} onConcluir={carregarDadosDetalhados} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Histórico</h3>
                            <ul>{historico.map((item, index) => (<ItemLinhaDoTempo key={index} item={item} onAction={carregarDadosDetalhados} />))}</ul>
                          </div>
                      </> )}
                       {activeTab === 'arquivos' && ( <div>Arquivos aqui...</div> )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
      </div>
      
      {isEditContatoOpen && ( <ContatoFormModal isOpen={isEditContatoOpen} onClose={handleCloseContactModals} contato={contatoEmEdicao} empresaIdInicial={negocio.empresa?.id} onSave={handleCloseContactModals} /> )}
      {isAddContatoOpen && ( <BuscaECriaContatoModal isOpen={isAddContatoOpen} onClose={handleCloseContactModals} empresaId={negocio.empresa?.id} negocioId={negocio.id} onCriarNovo={handleSwitchToCreateContato} onSave={handleCloseContactModals} /> )}
      
      <ConfirmationModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={handleDeletarNegocio} isDeleting={isDeleting} title="Confirmar Exclusão do Negócio" >
        {/* --- CORREÇÃO AQUI: Trocado 'titulo' por 'nome_negocio' --- */}
        <p>Tem a certeza de que deseja deletar permanentemente o negócio <span className="font-bold">"{negocio?.nome_negocio}"</span>?</p>
        <p className="font-bold mt-2 text-red-500">Esta ação não pode ser desfeita.</p>
      </ConfirmationModal>
    </>
  );
};

export default NegocioDetalhesModal;