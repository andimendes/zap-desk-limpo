import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil } from 'lucide-react';

const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  // Estados
  const [abaAtiva, setAbaAtiva] = useState('atividades');
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]);
  const [orcamento, setOrcamento] = useState(null);
  const [orcamentoItens, setOrcamentoItens] = useState([]);
  const [listaDeProdutos, setListaDeProdutos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  
  // Estados de formulários
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editText, setEditText] = useState('');
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);

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
  }, [isOpen, negocio?.id]);

  // --- Funções de Ganhou/Perdeu ---
  const marcarNegocioComoGanho = async (id) => await supabase.from('crm_negocios').update({ status: 'Ganho' }).eq('id', id);
  const marcarNegocioComoPerdido = async (id, motivo) => await supabase.from('crm_negocios').update({ status: 'Perdido', motivo_perda: motivo }).eq('id', id);
  const handleGanhouClick = async () => { /* ...código da função... */ };
  const handleSubmitPerda = async (e) => { /* ...código da função... */ };

  // --- Funções das Atividades ---
  const handleAdicionarAtividade = async (e) => { /* ...código da função... */ };
  const handleToggleCompleta = async (id, statusAtual) => { /* ...código da função... */ };
  const handleDeletarAtividade = async (id) => { /* ...código da função... */ };
  const handleStartEditing = (atividade) => { /* ...código da função... */ };
  const handleCancelEditing = () => { /* ...código da função... */ };
  const handleSaveEdit = async (e) => { /* ...código da função... */ };

  // --- Funções das Notas ---
  const handleAdicionarNota = async (e) => { /* ...código da função... */ };
  
  // --- Funções do Orçamento ---
  const handleCriarOrcamento = async () => { /* ...código da função... */ };
  const handleAdicionarItem = async (e) => { /* ...código da função... */ };
  const handleRemoverItem = async (itemId) => { /* ...código da função... */ };
  const valorTotalOrcamento = orcamentoItens.reduce((total, item) => total + item.subtotal, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        
        {isLostModalOpen && ( /* Modal de Perda */ <div/>)}

        <h2 className="text-2xl font-bold mb-4 dark:text-white">{negocio.titulo}</h2>
        
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setAbaAtiva('atividades')} className={`${abaAtiva === 'atividades' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Atividades</button>
            <button onClick={() => setAbaAtiva('notas')} className={`${abaAtiva === 'notas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Notas</button>
            <button onClick={() => setAbaAtiva('orcamento')} className={`${abaAtiva === 'orcamento' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Orçamento</button>
            <button onClick={() => setAbaAtiva('detalhes')} className={`${abaAtiva === 'detalhes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Detalhes</button>
          </nav>
        </div>

        <div className="min-h-[350px] max-h-[60vh] overflow-y-auto pr-2">
          {carregandoDados ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {/* --- CONTEÚDO DA ABA ATIVIDADES (COMPLETO) --- */}
              {abaAtiva === 'atividades' && (
                <div>
                  <form onSubmit={handleAdicionarAtividade} className="flex gap-2 mb-4">
                    <input type="text" value={novaAtividadeDesc} onChange={e => setNovaAtividadeDesc(e.target.value)} placeholder="Adicionar uma nova tarefa..." className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button>
                  </form>
                  <ul className="space-y-2">
                    {atividades.length > 0 ? atividades.map(at => (
                      <li key={at.id} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50 group">
                        {editingActivityId === at.id ? (
                          <form onSubmit={handleSaveEdit} className="flex-grow flex gap-2 items-center">
                            <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-grow p-1 border rounded dark:bg-gray-700" autoFocus />
                            <button type="submit" className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Salvar</button>
                            <button type="button" onClick={handleCancelEditing} className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button>
                          </form>
                        ) : (
                          <>
                            <input type="checkbox" checked={at.concluida} onChange={() => handleToggleCompleta(at.id, at.concluida)} className="h-5 w-5 rounded cursor-pointer" />
                            <div className="flex-grow">
                              <p className={`${at.concluida ? 'line-through text-gray-500' : 'dark:text-gray-200'}`}>{at.descricao}</p>
                              <p className="text-xs text-gray-400">{new Date(at.data_atividade).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleStartEditing(at)} className="p-1"><Pencil size={16}/></button>
                              <button onClick={() => handleDeletarAtividade(at.id)} className="p-1"><Trash2 size={16}/></button>
                            </div>
                          </>
                        )}
                      </li>
                    )) : <p className="text-gray-500 text-center py-4">Nenhuma atividade registada.</p>}
                  </ul>
                </div>
              )}

              {/* --- CONTEÚDO DA ABA NOTAS (COMPLETO) --- */}
              {abaAtiva === 'notas' && (
                <div>
                   <form onSubmit={handleAdicionarNota} className="flex flex-col gap-2 mb-4">
                    <textarea value={novaNotaConteudo} onChange={e => setNovaNotaConteudo(e.target.value)} placeholder="Escreva uma nota..." rows="3" className="w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 self-end">Adicionar Nota</button>
                  </form>
                  <ul className="space-y-3">
                     {notas.length > 0 ? notas.map(nota => (
                        <li key={nota.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                            <MessageSquare className="mt-1" size={16} />
                            <div>
                                <p className="dark:text-gray-200 whitespace-pre-wrap">{nota.conteudo}</p>
                                <p className="text-xs text-gray-400 mt-1">Adicionado em {new Date(nota.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                        </li>
                     )) : <p className="text-gray-500 text-center py-4">Nenhuma nota registada.</p>}
                  </ul>
                </div>
              )}

              {/* --- CONTEÚDO DA ABA ORÇAMENTO (COMPLETO) --- */}
              {abaAtiva === 'orcamento' && (
                 <div>
                  {!orcamento ? (
                    <div className="text-center py-10"><p className="mb-4">Nenhum orçamento criado.</p><button onClick={handleCriarOrcamento} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Criar Orçamento</button></div>
                  ) : (
                    <div>
                      <div className="mb-6 rounded-lg border dark:border-gray-700"><table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-2 text-left text-xs font-medium">Item</th><th className="px-4 py-2 text-left text-xs font-medium">Qtd</th><th className="px-4 py-2 text-left text-xs font-medium">Preço Unit.</th><th className="px-4 py-2 text-left text-xs font-medium">Subtotal</th><th></th></tr></thead>
                        <tbody className="divide-y dark:divide-gray-700">{orcamentoItens.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{item.descricao}</td><td className="px-4 py-2">{item.quantidade}</td>
                            <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</td>
                            <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</td>
                            <td className="px-4 py-2"><button onClick={() => handleRemoverItem(item.id)}><Trash2 className="text-red-500" size={16}/></button></td>
                          </tr>))}
                        </tbody></table>
                      </div>
                      <div className="text-right font-bold text-xl mb-6">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalOrcamento)}</div>
                      <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-end gap-4">
                        <div className="flex-grow"><label className="block text-sm font-medium mb-1">Produto</label><select value={produtoSelecionadoId} onChange={e => setProdutoSelecionadoId(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option value="">Selecione...</option>{listaDeProdutos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
                        <div><label className="block text-sm font-medium mb-1">Quantidade</label><input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} min="1" className="w-24 p-2 border rounded-lg dark:bg-gray-700"/></div>
                        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg">Adicionar</button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* --- CONTEÚDO DA ABA DETALHES (COMPLETO) --- */}
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