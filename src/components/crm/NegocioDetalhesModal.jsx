import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil, ShoppingBag } from 'lucide-react';

// ... (todas as funções antigas como marcarNegocioComoGanho, handleAdicionarAtividade, etc., serão incluídas dentro do componente)


const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  // --- ESTADOS ANTIGOS ---
  const [abaAtiva, setAbaAtiva] = useState('atividades');
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]);
  // ... (outros estados antigos)
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editText, setEditText] = useState('');
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');

  // --- NOVOS ESTADOS PARA O ORÇAMENTO ---
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [orcamento, setOrcamento] = useState(null);
  const [orcamentoItens, setOrcamentoItens] = useState([]);
  const [listaDeProdutos, setListaDeProdutos] = useState([]);
  
  // Estados para o formulário de adicionar item
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);


  // --- useEffect ATUALIZADO PARA BUSCAR TUDO ---
  useEffect(() => {
    if (!isOpen || !negocio?.id) return;

    const carregarDadosDoNegocio = async () => {
      setCarregandoDados(true);
      try {
        // Busca em paralelo para mais performance
        const [
          atividadesRes, 
          notasRes, 
          orcamentoRes, 
          produtosRes
        ] = await Promise.all([
          supabase.from('crm_atividades').select('*').eq('negocio_id', negocio.id).order('data_atividade', { ascending: false }),
          supabase.from('crm_notas').select('*').eq('negocio_id', negocio.id).order('created_at', { ascending: false }),
          supabase.from('crm_orcamentos').select('*').eq('negocio_id', negocio.id).maybeSingle(), // pode não existir, por isso maybeSingle
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

        // Se encontrou um orçamento, busca os itens dele
        if (orcamentoRes.data) {
          const { data: itensData, error: itensError } = await supabase
            .from('crm_orcamento_itens')
            .select('*')
            .eq('orcamento_id', orcamentoRes.data.id);
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
  }, [isOpen, negocio?.id]);


  // --- NOVAS FUNÇÕES PARA GERIR O ORÇAMENTO ---

  const handleCriarOrcamento = async () => {
    const { data, error } = await supabase
      .from('crm_orcamentos')
      .insert({ negocio_id: negocio.id, status: 'Rascunho' })
      .select()
      .single();

    if (error) {
      alert('Erro ao criar orçamento.');
    } else {
      setOrcamento(data);
    }
  };

  const handleAdicionarItem = async (e) => {
    e.preventDefault();
    if (!produtoSelecionadoId) return;

    const produto = listaDeProdutos.find(p => p.id === produtoSelecionadoId);
    if (!produto) return;

    const newItem = {
      orcamento_id: orcamento.id,
      produto_id: produto.id,
      descricao: produto.nome,
      quantidade: quantidade,
      preco_unitario: produto.preco_padrao,
    };

    const { data: itemAdicionado, error } = await supabase.from('crm_orcamento_itens').insert(newItem).select().single();

    if (error) {
      alert('Erro ao adicionar item.');
    } else {
      setOrcamentoItens([...orcamentoItens, itemAdicionado]);
      // Resetar formulário
      setProdutoSelecionadoId('');
      setQuantidade(1);
    }
  };

  const handleRemoverItem = async (itemId) => {
    if (window.confirm('Remover este item do orçamento?')) {
      const { error } = await supabase.from('crm_orcamento_itens').delete().eq('id', itemId);
      if (error) {
        alert('Erro ao remover item.');
      } else {
        setOrcamentoItens(orcamentoItens.filter(item => item.id !== itemId));
      }
    }
  };
  
  // Calcula o valor total do orçamento
  const valorTotalOrcamento = orcamentoItens.reduce((total, item) => total + (item.quantidade * item.preco_unitario), 0);


  // --- FUNÇÕES ANTIGAS (copiadas para dentro do componente para simplicidade) ---
  const marcarNegocioComoGanho = async (id) => { /* ... */ };
  const marcarNegocioComoPerdido = async (id, motivo) => { /* ... */ };
  const handleAdicionarAtividade = async (e) => { /* ... */ };
  const handleToggleCompleta = async (id, statusAtual) => { /* ... */ };
  const handleDeletarAtividade = async (id) => { /* ... */ };
  const handleStartEditing = (atividade) => { /* ... */ };
  const handleCancelEditing = () => { /* ... */ };
  const handleSaveEdit = async (e) => { /* ... */ };
  const handleAdicionarNota = async (e) => { /* ... */ };
  const handleGanhouClick = async () => { /* ... */ };
  const handleSubmitPerda = async (e) => { /* ... */ };
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        
        {/* ... (Modal de perda sem alterações) ... */}

        <h2 className="text-2xl font-bold mb-4 dark:text-white">{negocio.titulo}</h2>
        
        {/* --- ABA DE ORÇAMENTO ADICIONADA --- */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setAbaAtiva('atividades')} className={`${abaAtiva === 'atividades' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} ...`}>Atividades</button>
            <button onClick={() => setAbaAtiva('notas')} className={`${abaAtiva === 'notas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} ...`}>Notas</button>
            <button onClick={() => setAbaAtiva('orcamento')} className={`${abaAtiva === 'orcamento' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} ...`}>Orçamento</button>
            <button onClick={() => setAbaAtiva('detalhes')} className={`${abaAtiva === 'detalhes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} ...`}>Detalhes</button>
          </nav>
        </div>

        <div className="min-h-[350px]">
          {carregandoDados ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {abaAtiva === 'atividades' && ( /* ... JSX das atividades sem alterações ... */ <div/> )}
              {abaAtiva === 'notas' && ( /* ... JSX das notas sem alterações ... */ <div/> )}
              {abaAtiva === 'detalhes' && ( /* ... JSX dos detalhes sem alterações ... */ <div/> )}

              {/* --- CONTEÚDO DA NOVA ABA DE ORÇAMENTO --- */}
              {abaAtiva === 'orcamento' && (
                <div>
                  {!orcamento ? (
                    <div className="text-center py-10">
                      <p className="mb-4">Nenhum orçamento criado para este negócio.</p>
                      <button onClick={handleCriarOrcamento} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                        Criar Orçamento
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Tabela de Itens */}
                      <div className="mb-6 rounded-lg border dark:border-gray-700">
                        <table className="min-w-full">
                           <thead className="bg-gray-50 dark:bg-gray-700">
                             <tr>
                               <th className="px-4 py-2 text-left text-xs font-medium">Item</th>
                               <th className="px-4 py-2 text-left text-xs font-medium">Qtd</th>
                               <th className="px-4 py-2 text-left text-xs font-medium">Preço Unit.</th>
                               <th className="px-4 py-2 text-left text-xs font-medium">Subtotal</th>
                               <th className="px-4 py-2 text-left text-xs font-medium"></th>
                             </tr>
                           </thead>
                           <tbody className="divide-y dark:divide-gray-700">
                             {orcamentoItens.map(item => (
                               <tr key={item.id}>
                                 <td className="px-4 py-2">{item.descricao}</td>
                                 <td className="px-4 py-2">{item.quantidade}</td>
                                 <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</td>
                                 <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</td>
                                 <td className="px-4 py-2"><button onClick={() => handleRemoverItem(item.id)}><Trash2 className="text-red-500" size={16}/></button></td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                      </div>
                       {/* Total */}
                       <div className="text-right font-bold text-xl mb-6">
                        Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalOrcamento)}
                      </div>
                      
                      {/* Formulário para Adicionar Item */}
                      <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-end gap-4">
                        <div className="flex-grow">
                          <label className="block text-sm font-medium mb-1">Produto</label>
                          <select value={produtoSelecionadoId} onChange={e => setProdutoSelecionadoId(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700">
                            <option value="">Selecione um produto...</option>
                            {listaDeProdutos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Quantidade</label>
                           <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} min="1" className="w-24 p-2 border rounded-lg dark:bg-gray-700"/>
                        </div>
                        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Adicionar</button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* ... (Rodapé sem alterações) ... */}
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;