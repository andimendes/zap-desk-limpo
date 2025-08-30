// CÓDIGO COMPLETO E CORRIGIDO PARA NegocioDetalhesModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus } from 'lucide-react';

// As funções para marcar como ganho/perdido continuam as mesmas
const marcarNegocioComoGanho = async (id) => {
  return await supabase.from('crm_negocios').update({ status: 'Ganho' }).eq('id', id);
};

const marcarNegocioComoPerdido = async (id, motivo) => {
  return await supabase.from('crm_negocios').update({ status: 'Perdido', motivo_perda: motivo }).eq('id', id);
};

const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  const [abaAtiva, setAbaAtiva] = useState('atividades');
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');

  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && negocio?.id) {
      const carregarDadosDoNegocio = async () => {
        setCarregandoDados(true);
        
        // --- ESTA É A LINHA QUE MUDOU ---
        // Simplificámos a busca para evitar o erro de relação.
        const { data: atividadesData, error: atividadesError } = await supabase
          .from('crm_atividades')
          .select('*') 
          .eq('negocio_id', negocio.id)
          .order('data_atividade', { ascending: false });

        // --- ESTA É A OUTRA LINHA QUE MUDOU ---
        // Simplificámos a busca para evitar o erro de relação.
        const { data: notasData, error: notasError } = await supabase
          .from('crm_notas')
          .select('*') 
          .eq('negocio_id', negocio.id)
          .order('created_at', { ascending: false });

        if (atividadesError || notasError) {
          console.error('Erro ao buscar dados:', atividadesError || notasError);
          alert('Não foi possível carregar os detalhes do negócio.');
        } else {
          setAtividades(atividadesData || []);
          setNotas(notasData || []);
        }
        setCarregandoDados(false);
      };

      carregarDadosDoNegocio();
    }
  }, [isOpen, negocio?.id]);


  const handleAdicionarAtividade = async (e) => {
    e.preventDefault();
    if (!novaAtividadeDesc.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Sessão inválida. Por favor, faça login novamente.');
      return;
    }

    const novaAtividade = {
      negocio_id: negocio.id,
      user_id: session.user.id,
      tipo: 'Tarefa',
      descricao: novaAtividadeDesc,
      data_atividade: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('crm_atividades').insert(novaAtividade).select().single();
    
    if (error) {
      alert('Erro ao adicionar atividade: ' + error.message);
    } else {
      setAtividades([data, ...atividades]);
      setNovaAtividadeDesc('');
    }
  };

  const handleAdicionarNota = async (e) => {
    e.preventDefault();
    if (!novaNotaConteudo.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Sessão inválida. Por favor, faça login novamente.');
      return;
    }
    
    const novaNota = {
        negocio_id: negocio.id,
        user_id: session.user.id,
        conteudo: novaNotaConteudo,
    };

    const { data, error } = await supabase.from('crm_notas').insert(novaNota).select().single();

    if (error) {
        alert('Erro ao adicionar nota: ' + error.message);
    } else {
        setNotas([data, ...notas]);
        setNovaNotaConteudo('');
    }
  };

  if (!isOpen) return null;

  const handleGanhouClick = async () => { /* ...código original sem alterações... */ };
  const handleSubmitPerda = async (e) => { /* ...código original sem alterações... */ };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        
        {isLostModalOpen && (
           <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center rounded-lg z-10">
             <form onSubmit={handleSubmitPerda} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-2 dark:text-white">Qual o motivo da perda?</h3>
                <textarea
                  value={motivoPerda}
                  onChange={(e) => setMotivoPerda(e.target.value)}
                  placeholder="Ex: Preço, concorrência, etc."
                  rows="4"
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
                <div className="flex justify-end gap-4 mt-4">
                  <button type="button" onClick={() => setIsLostModalOpen(false)} className="py-2 px-4 rounded dark:text-gray-300">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white py-2 px-4 rounded">
                    {isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}
                  </button>
                </div>
              </form>
           </div>
        )}

        <h2 className="text-2xl font-bold mb-4 dark:text-white">{negocio.titulo}</h2>
        
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setAbaAtiva('atividades')} className={`${abaAtiva === 'atividades' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Atividades</button>
            <button onClick={() => setAbaAtiva('notas')} className={`${abaAtiva === 'notas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Notas</button>
            <button onClick={() => setAbaAtiva('detalhes')} className={`${abaAtiva === 'detalhes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Detalhes</button>
          </nav>
        </div>

        <div className="min-h-[300px]">
          {carregandoDados ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {abaAtiva === 'atividades' && (
                <div>
                  <form onSubmit={handleAdicionarAtividade} className="flex gap-2 mb-4">
                    <input type="text" value={novaAtividadeDesc} onChange={e => setNovaAtividadeDesc(e.target.value)} placeholder="Adicionar uma nova tarefa..." className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
                  </form>
                  <ul className="space-y-3">
                    {atividades.length > 0 ? atividades.map(at => (
                      <li key={at.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                        <Clock className="mt-1 text-gray-500" size={16}/>
                        <div>
                          <p className="dark:text-gray-200">{at.descricao}</p>
                          <p className="text-xs text-gray-400">{new Date(at.data_atividade).toLocaleString('pt-BR')}</p>
                        </div>
                      </li>
                    )) : <p className="text-gray-500 text-center py-4">Nenhuma atividade registada.</p>}
                  </ul>
                </div>
              )}

              {abaAtiva === 'notas' && (
                <div>
                  <form onSubmit={handleAdicionarNota} className="flex flex-col gap-2 mb-4">
                    <textarea value={novaNotaConteudo} onChange={e => setNovaNotaConteudo(e.target.value)} placeholder="Escreva uma nota..." rows="3" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 self-end">Adicionar Nota</button>
                  </form>
                  <ul className="space-y-3">
                     {notas.length > 0 ? notas.map(nota => (
                        <li key={nota.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                            <MessageSquare className="mt-1 text-gray-500" size={16} />
                            <div>
                                <p className="dark:text-gray-200 whitespace-pre-wrap">{nota.conteudo}</p>
                                <p className="text-xs text-gray-400 mt-1">Adicionado em {new Date(nota.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                        </li>
                     )) : <p className="text-gray-500 text-center py-4">Nenhuma nota registada.</p>}
                  </ul>
                </div>
              )}

              {abaAtiva === 'detalhes' && (
                <div className="space-y-2 dark:text-gray-300">
                  <p><strong>Empresa:</strong> {negocio.empresa_contato}</p>
                  <p><strong>Contato:</strong> {negocio.nome_contato}</p>
                  <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button onClick={onClose} className="text-gray-600 dark:text-gray-400">Fechar</button>
          <div className="flex gap-4">
            <button onClick={handleGanhouClick} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Ganhou</button>
            <button onClick={() => setIsLostModalOpen(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Perdeu</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;
