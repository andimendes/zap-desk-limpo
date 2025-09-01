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
    const carregarDadosDoNegocio = async () => {
        setCarregandoDados(true);
        try {
            const [atividadesRes, notasRes, orcamentoRes, produtosRes] = await Promise.all([
            supabase.from('crm_atividades').select('*').eq('negocio_id', negocio.id).order('data_atividade', { ascending: false }),
            supabase.from('crm_notas').select('*').eq('negocio_id', negocio.id).order('created_at', { ascending: false }),
            supabase.from('crm_orcamentos').select('*').eq('negocio_id', negocio.id).maybeSingle(),
            supabase.from('produtos_servicos').select('*').eq('ativo', true).order('nome')
            ]);
            if (atividadesRes.error) throw atividadesRes.error;
            if (notasRes.error) throw notasRes.error;
            if (orcamentoRes.error) throw orcamentoRes.error;
            if (produtosRes.error) throw produtosRes.error;
            setAtividades(atividadesRes.data || []);
            setNotas(notasRes.data || []);
            setOrcamento(orcamentoRes.data);
            setListaDeProdutos(produtosRes.data || []);
            if (orcamentoRes.data) {
            const { data: itensData, error: itensError } = await supabase.from('crm_orcamento_itens').select('*').eq('orcamento_id', orcamentoRes.data.id);
            if (itensError) throw itensError;
            setOrcamentoItens(itensData || []);
            } else {
            setOrcamentoItens([]);
            }
        } catch (error) {
            console.error('Ocorreu um erro ao buscar os dados do negócio:', error);
            alert('Não foi possível carregar os detalhes do negócio.');
        } finally {
            setCarregandoDados(false);
        }
    };
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

  // ... (outras funções handle...)

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        {/* ... (todo o JSX que já tínhamos) ... */}
         <div className="min-h-[350px] max-h-[60vh] overflow-y-auto pr-2">
          {carregandoDados ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> : (
            <>
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
              {/* ... (as outras abas) ... */}
            </>
          )}
        </div>
        {/* ... */}
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;