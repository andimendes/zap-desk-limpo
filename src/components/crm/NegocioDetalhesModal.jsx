import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil, Users } from 'lucide-react';

const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate, onDataChange }) => {
  const [abaAtiva, setAbaAtiva] = useState('atividades');
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]);
  const [orcamento, setOrcamento] = useState(null);
  const [orcamentoItens, setOrcamentoItens] = useState([]);
  const [listaDeProdutos, setListaDeProdutos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editText, setEditText] = useState('');
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [responsavelId, setResponsavelId] = useState('');

  useEffect(() => {
    if (!isOpen || !negocio?.id) return;
    const carregarDadosDoNegocio = async () => { /* ...código de busca de dados sem alterações... */ };
    carregarDadosDoNegocio();

    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name');
      if (!error) setListaDeUsers(data);
    };
    fetchUsers();
    setResponsavelId(negocio?.responsavel_id || '');
  }, [isOpen, negocio]);
  
  const handleMudarResponsavel = async (novoResponsavelId) => {
    setResponsavelId(novoResponsavelId);
    const { data, error } = await supabase
      .from('crm_negocios')
      .update({ responsavel_id: novoResponsavelId || null })
      .eq('id', negocio.id)
      .select('*, responsavel:profiles(full_name)')
      .single();
    if (error) {
      alert('Não foi possível alterar o responsável.');
      setResponsavelId(negocio?.responsavel_id || '');
    } else {
      onDataChange(data);
    }
  };

  // ... (todas as outras funções handle... não mudam)

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        {/* ... */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
             {/* ... abas ... */}
          </nav>
        </div>
        <div className="min-h-[350px] max-h-[60vh] overflow-y-auto pr-2">
          {carregandoDados ? <Loader2 className="animate-spin" /> : (
            <>
              {abaAtiva === 'atividades' && (<div>{/* ... JSX da aba ... */}</div>)}
              {abaAtiva === 'notas' && (<div>{/* ... JSX da aba ... */}</div>)}
              {abaAtiva === 'orcamento' && (<div>{/* ... JSX da aba ... */}</div>)}
              {abaAtiva === 'detalhes' && (
                <div className="space-y-4 dark:text-gray-300">
                  <p><strong>Empresa:</strong> {negocio.empresa_contato}</p>
                  <p><strong>Contato:</strong> {negocio.nome_contato}</p>
                  <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Users size={14}/>Responsável</label>
                    <select 
                      value={responsavelId} 
                      onChange={(e) => handleMudarResponsavel(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Ninguém atribuído</option>
                      {listaDeUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {/* ... botões do rodapé ... */}
        </div>
      </div>
    </div>
  );
};