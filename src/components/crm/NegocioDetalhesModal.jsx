// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon } from 'lucide-react';

// Importando os nossos componentes
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';

// Função auxiliar para calcular a diferença de dias
const differenceInDays = (dateLeft, dateRight) => {
  const diff = dateLeft.getTime() - dateRight.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

// Componente para a barra de progresso do funil (agora no modal)
const FunilProgressBar = ({ etapas, etapaAtualId, onEtapaClick }) => {
    const etapaAtualIndex = etapas.findIndex(e => e.id === etapaAtualId);
  
    return (
      <div className="flex w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 h-8 mt-2">
        {etapas.map((etapa, index) => {
          const isPassed = index < etapaAtualIndex;
          const isCurrent = index === etapaAtualIndex;
          
          let bgColor = 'bg-gray-300 dark:bg-gray-600'; // Futura
          let textColor = 'text-gray-700 dark:text-gray-300';
          if (isPassed) {
            bgColor = 'bg-green-500 dark:bg-green-600'; // Passada
            textColor = 'text-white';
          } else if (isCurrent) {
            bgColor = 'bg-blue-500 dark:bg-blue-600'; // Atual
            textColor = 'text-white font-bold';
          }
  
          return (
            <button
              key={etapa.id}
              onClick={() => onEtapaClick(etapa.id)}
              className={`flex-1 flex items-center justify-center h-full px-2 text-sm text-center relative transition-colors duration-200 
                ${bgColor} ${textColor}
                ${!isPassed ? 'z-10' : 'z-0'} 
                ${isCurrent ? 'shadow-lg' : ''}
                `}
            >
              <span className="truncate">{etapa.nome_etapa}</span>
            </button>
          );
        })}
      </div>
    );
};
  

const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
  // Estados para os dados
  const [negocio, setNegocio] = useState(negocioInicial);
  const [proximaAtividade, setProximaAtividade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [alertaEstagnacao, setAlertaEstagnacao] = useState(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [isTituloEditing, setIsTituloEditing] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');

  // Sincroniza o negócio inicial com o estado local e o título editável
  useEffect(() => {
    setNegocio(negocioInicial);
    setNovoTitulo(negocioInicial?.titulo || '');
  }, [negocioInicial]);


  // Função para carregar todos os dados do modal.
  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) return;
    
    try {
      const { data: updatedNegocio, error: negocioError } = await supabase
        .from('crm_negocios')
        .select('*, responsavel:profiles(full_name)')
        .eq('id', negocioInicial.id)
        .single();

      if (negocioError) throw negocioError;
      setNegocio(updatedNegocio);
      setNovoTitulo(updatedNegocio.titulo);
      
      // onDataChange(updatedNegocio); // <-- ESTA É A LINHA QUE ESTAVA A CAUSAR O LOOP E FOI REMOVIDA

      const [focoRes, atividadesRes, notasRes] = await Promise.all([
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).eq('concluida', false).gte('data_atividade', new Date().toISOString()).order('data_atividade', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false }),
        supabase.from('crm_notas').select('*').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false })
      ]);

      if (focoRes.error) throw focoRes.error;
      if (atividadesRes.error) throw atividadesRes.error;
      if (notasRes.error) throw notasRes.error;

      const atividadeFoco = focoRes.data;
      setProximaAtividade(atividadeFoco);

      const atividadesHistorico = atividadesRes.data.filter(at => at.id !== atividadeFoco?.id);
      const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item }));
      const notasFormatadas = notasRes.data.map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item }));
      
      const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data);
      setHistorico(historicoUnificado);
      
      if (historicoUnificado.length > 0) {
        const diasDesdeUltimaAtividade = differenceInDays(new Date(), historicoUnificado[0].data);
        if (diasDesdeUltimaAtividade > 7) {
          setAlertaEstagnacao(`Negócio parado há ${diasDesdeUltimaAtividade} dias.`);
        } else {
          setAlertaEstagnacao(null);
        }
      } else {
        const diasDesdeCriacao = differenceInDays(new Date(), new Date(negocioInicial.created_at));
        setAlertaEstagnacao(`Negócio novo, sem atividades há ${diasDesdeCriacao} dias.`);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do negócio:", error);
      alert("Não foi possível carregar todos os dados do negócio.");
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
  const handleSaveTitulo = async () => {
    if (!novoTitulo.trim()) {
      alert('O título não pode ser vazio.');
      return;
    }
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ titulo: novoTitulo })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Erro ao atualizar o título: ' + error.message);
    } else {
      setNegocio(data);
      onDataChange(data);
      setIsTituloEditing(false);
    }
  };

  const handleMudarEtapa = async (novaEtapaId) => {
    if (negocio.etapa_id === novaEtapaId) return;

    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ etapa_id: novaEtapaId })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Não foi possível alterar a etapa.');
    } else {
      setNegocio(data);
      onDataChange(data);
    }
  };

  const handleMudarResponsavelTopo = async (novoResponsavelId) => {
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ responsavel_id: novoResponsavelId || null })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();

    if (error) {
      alert('Não foi possível alterar o responsável.');
    } else {
      setNegocio(data);
      onDataChange(data);
    }
  };

  const handleMarcarStatus = async (status) => {
    if (!window.confirm(`Tem certeza que deseja marcar este negócio como "${status}"?`)) {
      return;
    }
    const { error } = await supabase.from('crm_negocios').update({ status: status }).eq('id', negocio.id);

    if (error) {
      alert('Erro ao atualizar o status: ' + error.message);
    } else {
      onClose();
      onDataChange({ ...negocio, status: status }); // Informa o pai que o status mudou
    }
  };
  
  const handleToggleCompleta = async (id, statusAtual) => {
    const { error } = await supabase.from('crm_atividades').update({ concluida: !statusAtual }).eq('id', id);
    if (error) alert('Erro ao atualizar.');
    else carregarDadosDetalhados();
  };

  const handleDeletarAtividade = async (id) => {
    if(window.confirm('Apagar esta tarefa?')){
        const { error } = await supabase.from('crm_atividades').delete().eq('id', id);
        if (error) alert('Erro ao apagar.');
        else carregarDadosDetalhados();
    }
  }
  
  const handleAcaoHistorico = (action, data) => {
    if(action === 'delete') handleDeletarAtividade(data);
    if(action === 'edit') alert('Funcionalidade de editar a ser implementada.');
  }
  
  const handleCreateGoogleEvent = async (atividade) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) {
      alert("Conecte a sua conta Google nas configurações.");
      return;
    }
    const eventData = {
      'summary': atividade.descricao,
      'description': `Atividade do CRM Zap Desk: ${negocio.titulo}.`,
      'start': { 'dateTime': new Date(atividade.data_atividade).toISOString() },
      'end': { 'dateTime': new Date(new Date(atividade.data_atividade).getTime() + 60 * 60 * 1000).toISOString() },
    };
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.provider_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (response.ok) {
      const event = await response.json();
      alert(`Evento criado com sucesso! Link: ${event.htmlLink}`);
    } else {
      alert(`Falha ao criar o evento.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-8" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex-grow w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : (
          <>
            <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {isTituloEditing ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitulo(); }} className="text-2xl font-bold dark:bg-gray-700 dark:text-gray-100 p-1 border rounded"/>
                      <button onClick={handleSaveTitulo} className="text-green-600 hover:text-green-800"><Check size={18}/></button>
                      <button onClick={() => { setIsTituloEditing(false); }} className="text-red-600 hover:text-red-800"><X size={18}/></button>
                    </div>
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-words flex items-center gap-2">
                      {negocio.titulo}
                      <button onClick={() => setIsTituloEditing(true)} className="text-gray-500 hover:text-blue-600"><Pencil size={16}/></button>
                    </h2>
                  )}
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
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={24} /></button>
                </div>
              </div>
              
              {etapasDoFunil && etapasDoFunil.length > 0 && (<FunilProgressBar etapas={etapasDoFunil} etapaAtualId={negocio.etapa_id} onEtapaClick={handleMudarEtapa} />)}
            </div>

            <div className="flex flex-grow overflow-hidden">
                <BarraLateral negocio={negocio} etapasDoFunil={etapasDoFunil} listaDeUsers={listaDeUsers} onDataChange={onDataChange}/>

                <main className="w-2/3 p-6 flex flex-col gap-6 overflow-y-auto">
                  {alertaEstagnacao && (<div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-md"><AlertTriangle size={16} />{alertaEstagnacao}</div>)}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Foco</h3>
                    <div className="flex items-start gap-2">
                        <AtividadeFoco atividade={proximaAtividade} onConcluir={handleToggleCompleta} />
                        {proximaAtividade && <button onClick={() => handleCreateGoogleEvent(proximaAtividade)} className="p-2 text-gray-500 hover:text-blue-600" title="Adicionar ao Google Calendar"><CalendarPlus size={20}/></button>}
                    </div>
                  </div>

                  <ActivityComposer negocioId={negocio.id} onActionSuccess={carregarDadosDetalhados} />

                  <div className="flex-grow overflow-y-auto pr-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Histórico</h3>
                    <ul className="-ml-2">
                      {historico.map((item, index) => (<ItemLinhaDoTempo key={`${item.tipo}-${item.original.id}-${index}`} item={item} onAction={handleAcaoHistorico} />))}
                      {historico.length === 0 && <p className="text-sm text-gray-500">Nenhuma atividade ou nota no histórico.</p>}
                    </ul>
                  </div>

                </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;