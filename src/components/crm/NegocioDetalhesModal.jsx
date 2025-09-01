// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Plus, AlertTriangle, CalendarPlus } from 'lucide-react';

// Importando os nossos novos componentes
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';

// Função auxiliar para calcular a diferença de dias
const differenceInDays = (dateLeft, dateRight) => {
  const diff = dateLeft.getTime() - dateRight.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
  // Estados para os dados
  const [negocio, setNegocio] = useState(negocioInicial);
  const [proximaAtividade, setProximaAtividade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [alertaEstagnacao, setAlertaEstagnacao] = useState(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaAtividadeData, setNovaAtividadeData] = useState(new Date().toISOString().slice(0, 16));


  // Função para carregar todos os dados do modal. Usamos useCallback para evitar recriações desnecessárias.
  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) return;
    setLoading(true);

    try {
      // Usamos Promise.all para executar as buscas em paralelo, é mais rápido!
      const [focoRes, atividadesRes, notasRes] = await Promise.all([
        // 1. Busca a próxima atividade em foco
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).eq('concluida', false).gte('data_atividade', new Date().toISOString()).order('data_atividade', { ascending: true }).limit(1).maybeSingle(),
        // 2. Busca todas as outras atividades
        supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false }),
        // 3. Busca todas as notas
        supabase.from('crm_notas').select('*').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false })
      ]);

      // Tratamento de erros (opcional mas recomendado)
      if (focoRes.error) throw focoRes.error;
      if (atividadesRes.error) throw atividadesRes.error;
      if (notasRes.error) throw notasRes.error;

      const atividadeFoco = focoRes.data;
      setProximaAtividade(atividadeFoco);

      // Filtra as atividades para o histórico (excluindo a que está em foco)
      const atividadesHistorico = atividadesRes.data.filter(at => at.id !== atividadeFoco?.id);

      // Formata os dados para um padrão único para a linha do tempo
      const atividadesFormatadas = atividadesHistorico.map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item }));
      const notasFormatadas = notasRes.data.map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item }));
      
      const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data);
      setHistorico(historicoUnificado);
      
      // Lógica para o Alerta de Estagnação
      if (historicoUnificado.length > 0) {
        const diasDesdeUltimaAtividade = differenceInDays(new Date(), historicoUnificado[0].data);
        if (diasDesdeUltimaAtividade > 7) { // Alerta se parado há mais de 7 dias
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

  // useEffect para chamar a função de carregar dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      carregarDadosDetalhados();
    }
  }, [isOpen, carregarDadosDetalhados]);
  
  // Atualiza o negócio localmente quando o de fora muda
  useEffect(() => {
    setNegocio(negocioInicial);
  }, [negocioInicial]);


  // --- Funções de Ação ---

  const handleAdicionarAtividade = async (e) => {
    e.preventDefault();
    if (!novaAtividadeDesc.trim() || !novaAtividadeData) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    const novaAtividade = { negocio_id: negocio.id, user_id: session.user.id, tipo: 'Tarefa', descricao: novaAtividadeDesc, data_atividade: new Date(novaAtividadeData).toISOString(), concluida: false };
    
    const { error } = await supabase.from('crm_atividades').insert(novaAtividade);
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      setNovaAtividadeDesc('');
      setNovaAtividadeData(new Date().toISOString().slice(0, 16));
      carregarDadosDetalhados(); // Recarrega tudo para manter a UI sincronizada
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
    // etc...
  }
  
  // A nossa função do Google Calendar permanece, agora como um botão na área de Foco
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="w-full flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : (
          <>
            <BarraLateral 
              negocio={negocio}
              etapasDoFunil={etapasDoFunil}
              listaDeUsers={listaDeUsers}
              onDataChange={onDataChange}
            />

            <main className="w-2/3 flex flex-col">
              <div className="p-6 border-b dark:border-gray-700">
                {alertaEstagnacao && (
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-md mb-4">
                    <AlertTriangle size={16} />
                    {alertaEstagnacao}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Foco</h3>
                <div className="flex items-start gap-2">
                    <AtividadeFoco atividade={proximaAtividade} onConcluir={handleToggleCompleta} />
                    {proximaAtividade && 
                        <button onClick={() => handleCreateGoogleEvent(proximaAtividade)} className="p-2 text-gray-500 hover:text-blue-600" title="Adicionar ao Google Calendar">
                            <CalendarPlus size={20}/>
                        </button>
                    }
                </div>
              </div>

              <div className="flex-grow p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Histórico</h3>
                <ul className="-ml-6">
                  {historico.map((item, index) => (
                    <ItemLinhaDoTempo key={`${item.tipo}-${item.original.id}-${index}`} item={item} onAction={handleAcaoHistorico} />
                  ))}
                  {historico.length === 0 && <p className="text-sm text-gray-500">Nenhuma atividade ou nota no histórico.</p>}
                </ul>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
                 <form onSubmit={handleAdicionarAtividade} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={novaAtividadeDesc} 
                      onChange={e => setNovaAtividadeDesc(e.target.value)} 
                      placeholder="Adicionar uma nova atividade..." 
                      className="flex-grow p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input 
                      type="datetime-local"
                      value={novaAtividadeData}
                      onChange={e => setNovaAtividadeData(e.target.value)}
                      className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20} /></button>
                 </form>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;