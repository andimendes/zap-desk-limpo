// src/components/crm/NegocioDetalhesModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, CalendarPlus, Pencil, Check, X, Users as UsersIcon, Trash2, UserPlus, Search } from 'lucide-react';

// ... (Componentes importados e funções de ajuda como differenceInDays e FunilProgressBar continuam os mesmos)
import BarraLateral from './BarraLateral';
import AtividadeFoco from './AtividadeFoco';
import ItemLinhaDoTempo from './ItemLinhaDoTempo';
import ActivityComposer from './ActivityComposer';
import AddLeadModal from './AddLeadModal';

const differenceInDays = (dateLeft, dateRight) => { /* ...código existente... */ };
const FunilProgressBar = ({ etapas, etapaAtualId, onEtapaClick }) => { /* ...código existente... */ };

const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
  // --- ESTADOS EXISTENTES ---
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

  // --- NOVOS ESTADOS PARA A ABA DE CONTATOS ---
  const [contatosAssociados, setContatosAssociados] = useState([]);
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---
  const carregarContatosAssociados = useCallback(async (negocioId) => {
    setIsLoadingContatos(true);
    try {
      const { data, error } = await supabase
        .from('crm_negocio_contatos')
        .select('crm_contatos(*)')
        .eq('negocio_id', negocioId);
      
      if (error) throw error;

      // O resultado vem aninhado, então extraímos os dados dos contatos
      const contatos = data.map(item => item.crm_contatos);
      setContatosAssociados(contatos);

    } catch (error) {
      console.error("Erro ao carregar contatos associados:", error);
      alert('Não foi possível carregar os contatos.');
    } finally {
      setIsLoadingContatos(false);
    }
  }, []);

  const carregarDadosDetalhados = useCallback(async () => {
    // ... (toda a lógica existente de carregar negócio, atividades, notas, etc, continua aqui)
    if (!negocioInicial?.id) return;
    try {
      // ... (código existente para buscar negocio, atividades, notas)
      // Carrega os contatos associados em paralelo
      await carregarContatosAssociados(negocioInicial.id);
    } catch (error) {
      // ... (tratamento de erro existente)
    } finally {
      // ... (setLoading(false) existente)
    }
  }, [negocioInicial, onClose, carregarContatosAssociados]);


  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        // Reseta os estados da busca
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
        // Pega os IDs dos contatos já associados para excluí-los da busca
        const idsAssociados = contatosAssociados.map(c => c.id);
        
        const { data, error } = await supabase
          .from('crm_contatos')
          .select('*')
          .ilike('nome', `%${termoBusca}%`) // Busca por nome (case-insensitive)
          .not('id', 'in', `(${idsAssociados.join(',')})`) // Exclui os já associados
          .limit(5); // Limita a 5 resultados para performance

        if (error) throw error;
        setResultadosBusca(data);

      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      buscarContatos();
    }, 300); // Espera 300ms após o usuário parar de digitar

    return () => clearTimeout(debounce); // Limpa o timeout
  }, [termoBusca, contatosAssociados]);


  const handleAssociarContato = async (contatoParaAdicionar) => {
    try {
      const { error } = await supabase
        .from('crm_negocio_contatos')
        .insert({
          negocio_id: negocio.id,
          contato_id: contatoParaAdicionar.id,
        });
      
      if (error) throw error;

      // Atualiza a lista de contatos na tela e limpa a busca
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
      const { error } = await supabase
        .from('crm_negocio_contatos')
        .delete()
        .match({ negocio_id: negocio.id, contato_id: contatoIdParaRemover });

      if (error) throw error;

      // Atualiza a lista na tela removendo o contato
      setContatosAssociados(contatosAssociados.filter(c => c.id !== contatoIdParaRemover));

    } catch(error) {
      console.error("Erro ao desvincular contato:", error);
      alert('Não foi possível desvincular o contato.');
    }
  };


  // --- RESTANTE DAS FUNÇÕES (handleSaveTitulo, handleMudarEtapa, etc... continuam iguais) ---
  const handleSaveTitulo = async () => { /* ...código existente... */ };
  const handleMudarEtapa = async (novaEtapaId) => { /* ...código existente... */ };
  const handleMudarResponsavelTopo = async (novoResponsavelId) => { /* ...código existente... */ };
  const handleMarcarStatus = async (status) => { /* ...código existente... */ };
  const handleToggleCompleta = async (id, statusAtual) => { /* ...código existente... */ };
  const handleDeletarAtividade = async (id) => { /* ...código existente... */ };
  const handleAcaoHistorico = (action, data) => { /* ...código existente... */ };
  const handleCreateGoogleEvent = async (atividade) => { /* ...código existente... */ };
  const handleExcluirNegocio = async () => { /* ...código existente... */ };
  
  if (!isOpen) return null;
  const tabs = [ /* ...código existente... */ ];

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <>
      {/* ... (código do modal, cabeçalho, etc. continua o mesmo) ... */}

      {/* --- CONTEÚDO DAS ABAS --- */}
      <div className="flex-grow overflow-y-auto">
        {/* ... (código das abas 'atividades', 'arquivos', 'detalhes' continua o mesmo) ... */}
        
        {activeTab === 'contatos' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contatos Associados</h3>

            {/* LISTA DE CONTATOS ASSOCIADOS */}
            {isLoadingContatos ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {contatosAssociados.length > 0 ? (
                  contatosAssociados.map(contato => (
                    <div key={contato.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email || 'Sem e-mail'}</p>
                      </div>
                      <button onClick={() => handleDesvincularContato(contato.id)} className="text-gray-400 hover:text-red-500 p-1" title="Desvincular contato">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum contato associado a este negócio.</p>
                )}
              </div>
            )}
            
            {/* CAMPO DE BUSCA E ADIÇÃO DE CONTATOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adicionar contato existente</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Digite para buscar um contato..."
                  className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                {isSearching && <Loader2 size={18} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
              </div>

              {/* RESULTADOS DA BUSCA */}
              {resultadosBusca.length > 0 && (
                <ul className="border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                  {resultadosBusca.map(contato => (
                    <li key={contato.id} className="flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{contato.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email || 'Sem e-mail'}</p>
                      </div>
                      <button onClick={() => handleAssociarContato(contato)} className="text-blue-600 hover:text-blue-800 p-1" title="Adicionar contato">
                        <UserPlus size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ... (restante do JSX do modal e modais auxiliares) ... */}
    </>
  );
};

export default NegocioDetalhesModal;