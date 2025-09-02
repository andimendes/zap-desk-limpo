// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
// 1. Ícone Trash2 importado para o botão de excluir
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2 } from 'lucide-react';

// Importando os nossos componentes
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import AddLeadModal from './AddLeadModal';

// ... (Função differenceInDays e Componente FunilProgressBar continuam iguais)
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

  // 2. Novos estados para controlar o modal de confirmação de exclusão e o loading
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNegocio(negocioInicial);
    setNovoTitulo(negocioInicial?.titulo || '');
  }, [negocioInicial]);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) return;
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single();
      if (negocioError) throw negocioError;
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
        const dias = differenceInDays(new Date(), new Date(negocioInicial.created_at));
        setAlertaEstagnacao(`Negócio novo, sem atividades há ${dias} dias.`);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do negócio:", error);
      alert("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [negocioInicial]);

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        carregarDadosDetalhados();
    }
  }, [isOpen, carregarDadosDetalhados]);
  
  // --- Funções de Ação ---
  const handleSaveTitulo = async () => { /* ...código existente sem alteração... */ };
  const handleMudarEtapa = async (novaEtapaId) => { /* ...código existente sem alteração... */ };
  const handleMudarResponsavelTopo = async (novoResponsavelId) => { /* ...código existente sem alteração... */ };
  const handleMarcarStatus = async (status) => { /* ...código existente sem alteração... */ };
  const handleToggleCompleta = async (id, statusAtual) => { /* ...código existente sem alteração... */ };
  const handleDeletarAtividade = async (id) => { /* ...código existente sem alteração... */ };
  const handleAcaoHistorico = (action, data) => { /* ...código existente sem alteração... */ };
  const handleCreateGoogleEvent = async (atividade) => { /* ...código existente sem alteração... */ };

  /**
   * DOCUMENTAÇÃO:
   * Nova função para excluir o negócio.
   * É chamada pelo modal de confirmação.
   */
  const handleExcluirNegocio = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('crm_negocios')
        .delete()
        .eq('id', negocio.id);
      
      if (error) {
        throw error;
      }

      alert('Negócio excluído com sucesso!');
      
      // Notifica o componente pai (Kanban) que este negócio foi alterado/removido
      // para que ele possa desaparecer da tela.
      onDataChange({ ...negocio, status: 'Excluido' }); 
      
      setIsConfirmDeleteOpen(false); // Fecha o modal de confirmação
      onClose(); // Fecha o modal principal

    } catch (error) {
      console.error("Erro ao excluir negócio:", error);
      alert("Não foi possível excluir o negócio. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-8" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {loading ? (
            <div className="flex-grow w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : (
            <>
              <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {/* ...bloco do título editável sem alteração... */}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <UsersIcon size={14} />
                      <select value={negocio.responsavel_id || ''} onChange={(e) => handleMudarResponsavelTopo(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium dark:text-gray-200">
                        <option value="">Ninguém</option>
                        {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
                      </select>
                    </div>
                    <button onClick={() => handleMarcarStatus('Ganho')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-600">Ganho</button>
                    <button onClick={() => handleMarcarStatus('Perdido')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-600">Perdido</button>
                    
                    {/* 3. Botão de Excluir adicionado */}
                    <button 
                      onClick={() => setIsConfirmDeleteOpen(true)} 
                      className="text-gray-500 hover:text-red-600 dark:hover:text-red-500 p-1"
                      title="Excluir Negócio"
                    >
                      <Trash2 size={20} />
                    </button>

                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={24} /></button>
                  </div>
                </div>
                {etapasDoFunil && etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={handleMudarEtapa} />)}
              </div>
              <div className="flex flex-grow overflow-hidden">
                {/* ...resto do componente sem alteração... */}
              </div>
            </>
          )}
        </div>
      </div>
      
      <AddLeadModal 
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onLeadAdicionado={() => {
            alert('Novo lead adicionado com sucesso!');
            setIsAddLeadModalOpen(false);
        }}
      />

      {/* 4. Modal de Confirmação de Exclusão */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar Exclusão</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem a certeza de que deseja excluir o negócio "{negocio.titulo}"? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExcluirNegocio}
                disabled={isDeleting}
                className="py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 flex items-center"
              >
                {isDeleting && <Loader2 className="animate-spin mr-2" size={16} />}
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NegocioDetalhesModal;