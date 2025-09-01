import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil, Users, CalendarPlus } from 'lucide-react'; // Ícone adicionado aqui

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'Rascunho': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Enviado': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Aprovado': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Rejeitado': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return (<span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-200'}`}>{status}</span>);
};

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
      console.log('--- Iniciando busca de dados para o negócio:', negocio.titulo);
      setCarregandoDados(true);
      try {
        console.log('1. Antes do Promise.all');
        const [atividadesRes, notasRes, orcamentoRes, produtosRes, usersRes] = await Promise.all([
          supabase.from('crm_atividades').select('*').eq('negocio_id', negocio.id).order('data_atividade', { ascending: false }),
          supabase.from('crm_notas').select('*').eq('negocio_id', negocio.id).order('created_at', { ascending: false }),
          supabase.from('crm_orcamentos').select('*').eq('negocio_id', negocio.id).maybeSingle(),
          supabase.from('produtos_servicos').select('*').eq('ativo', true).order('nome'),
          supabase.from('profiles').select('id, full_name').order('full_name')
        ]);
        console.log('2. Depois do Promise.all');
        if (atividadesRes.error) throw { message: 'Erro ao buscar atividades', details: atividadesRes.error };
        if (notasRes.error) throw { message: 'Erro ao buscar notas', details: notasRes.error };
        if (orcamentoRes.error) throw { message: 'Erro ao buscar orçamento', details: orcamentoRes.error };
        if (produtosRes.error) throw { message: 'Erro ao buscar produtos', details: produtosRes.error };
        if (usersRes.error) throw { message: 'Erro ao buscar utilizadores', details: usersRes.error };
        console.log('3. Dados brutos recebidos com sucesso.');
        setAtividades(atividadesRes.data || []);
        setNotas(notasRes.data || []);
        setOrcamento(orcamentoRes.data);
        setListaDeProdutos(produtosRes.data || []);
        setListaDeUsers(usersRes.data || []);
        setResponsavelId(negocio?.responsavel_id || '');
        if (orcamentoRes.data) {
          const { data: itensData, error: itensError } = await supabase.from('crm_orcamento_itens').select('*, subtotal').eq('orcamento_id', orcamentoRes.data.id);
          if (itensError) throw { message: 'Erro ao buscar itens do orçamento', details: itensError };
          setOrcamentoItens(itensData || []);
        } else { setOrcamentoItens([]); }
        console.log('4. Processamento concluído.');
      } catch (error) {
        console.error('--- ERRO CAPTURADO ---:', error.message, error.details || error);
        alert('Não foi possível carregar os detalhes do negócio. Verifique o console.');
      } finally {
        console.log('5. Bloco "finally" executado. A remover o loading.');
        setCarregandoDados(false);
      }
    };
    carregarDadosDoNegocio();
  }, [isOpen, negocio]);
  
  // --- NOVA FUNÇÃO PARA O GOOGLE CALENDAR ---
  const handleCreateGoogleEvent = async (atividade) => {
    // Passo 1: Obter a sessão e o token de acesso.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) {
      alert("Não foi possível encontrar a autenticação do Google. Por favor, conecte a sua conta nas configurações.");
      return;
    }
    const providerToken = session.provider_token;
  
    // Passo 2: Preparar os dados do evento.
    const startTime = new Date(atividade.data_atividade);
    startTime.setHours(12, 0, 0, 0); // Define a hora de início para 12:00 (meio-dia)
  
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Adiciona 1 hora de duração
  
    const eventData = {
      'summary': atividade.descricao, // O título do evento será a descrição da tarefa
      'description': `Atividade do CRM Zap Desk referente ao negócio: ${negocio.titulo}.`,
      'start': {
        'dateTime': startTime.toISOString(),
        'timeZone': 'America/Sao_Paulo', // Ajuste para o seu fuso horário ou torne-o dinâmico
      },
      'end': {
        'dateTime': endTime.toISOString(),
        'timeZone': 'America/Sao_Paulo',
      },
    };
  
    // Passo 3: Fazer a chamada à API do Google Calendar.
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
  
      // Passo 4: Tratar a resposta e dar feedback.
      if (response.ok) {
        const event = await response.json();
        alert(`Evento criado com sucesso! Pode vê-lo aqui: ${event.htmlLink}`);
      } else {
        const error = await response.json();
        console.error('Erro ao criar evento:', error);
        alert(`Falha ao criar o evento: ${error.error.message}`);
      }
    } catch (error) {
      console.error('Ocorreu um erro de rede:', error);
      alert('Ocorreu um erro de rede ao tentar criar o evento.');
    }
  };

  const valorTotalOrcamento = orcamentoItens.reduce((total, item) => total + (item.subtotal || 0), 0);
  const handleMudarStatusOrcamento = async (novoStatus) => { if (!orcamento) return; const { data: orcamentoAtualizado, error: orcamentoError } = await supabase.from('crm_orcamentos').update({ status: novoStatus }).eq('id', orcamento.id).select().single(); if (orcamentoError) { alert('Erro ao atualizar o status.'); return; } setOrcamento(orcamentoAtualizado); if (novoStatus === 'Aprovado') { const { data: negocioAtualizado, error: negocioError } = await supabase.from('crm_negocios').update({ valor: valorTotalOrcamento }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single(); if (negocioError) { alert('Status atualizado, mas houve erro ao atualizar o valor do negócio.'); } else { onDataChange(negocioAtualizado); alert('Orçamento aprovado e valor do negócio atualizado!'); } } };
  const handleMudarResponsavel = async (novoResponsavelId) => { setResponsavelId(novoResponsavelId); const { data, error } = await supabase.from('crm_negocios').update({ responsavel_id: novoResponsavelId || null }).eq('id', negocio.id).select('*, responsavel:profiles(full_name)').single(); if (error) { alert('Não foi possível alterar o responsável.'); setResponsavelId(negocio?.responsavel_id || ''); } else { onDataChange(data); } };
  const marcarNegocioComoGanho = async (id) => await supabase.from('crm_negocios').update({ status: 'Ganho' }).eq('id', id);
  const marcarNegocioComoPerdido = async (id, motivo) => await supabase.from('crm_negocios').update({ status: 'Perdido', motivo_perda: motivo }).eq('id', id);
  const handleGanhouClick = async () => { if (window.confirm(`Tem a certeza que quer marcar o negócio "${negocio.titulo}" como GANHO?`)) { const { error } = await marcarNegocioComoGanho(negocio.id); if (error) { alert('Erro: ' + error.message); } else { alert('Negócio marcado como ganho!'); onNegocioUpdate(negocio.id); } } };
  const handleSubmitPerda = async (e) => { e.preventDefault(); if (!motivoPerda) { alert('Por favor, preencha o motivo da perda.'); return; } setIsSubmitting(true); const { error } = await marcarNegocioComoPerdido(negocio.id, motivoPerda); if (error) { alert('Erro: ' + error.message); } else { alert('Negócio marcado como perdido.'); onNegocioUpdate(negocio.id); } setIsSubmitting(false); setIsLostModalOpen(false); setMotivoPerda(''); };
  const handleAdicionarAtividade = async (e) => { e.preventDefault(); if (!novaAtividadeDesc.trim()) return; const { data: { session } } = await supabase.auth.getSession(); if (!session?.user) { alert('Sessão inválida.'); return; } const novaAtividade = { negocio_id: negocio.id, user_id: session.user.id, tipo: 'Tarefa', descricao: novaAtividadeDesc, data_atividade: new Date().toISOString(), concluida: false }; const { data, error } = await supabase.from('crm_atividades').insert(novaAtividade).select().single(); if (error) { alert('Erro: ' + error.message); } else { setAtividades([data, ...atividades]); setNovaAtividadeDesc(''); } };
  const handleToggleCompleta = async (id, statusAtual) => { const { error } = await supabase.from('crm_atividades').update({ concluida: !statusAtual }).eq('id', id); if (error) { alert('Erro ao atualizar.'); } else { setAtividades(atividades.map(at => at.id === id ? { ...at, concluida: !statusAtual } : at)); } };
  const handleDeletarAtividade = async (id) => { if (window.confirm('Apagar esta tarefa?')) { const { error } = await supabase.from('crm_atividades').delete().eq('id', id); if (error) { alert('Erro ao apagar.'); } else { setAtividades(atividades.filter(at => at.id !== id)); } } };
  const handleStartEditing = (atividade) => { setEditingActivityId(atividade.id); setEditText(atividade.descricao); };
  const handleCancelEditing = () => { setEditingActivityId(null); setEditText(''); };
  const handleSaveEdit = async (e) => { e.preventDefault(); if (!editText.trim() || !editingActivityId) return; const { data, error } = await supabase.from('crm_atividades').update({ descricao: editText.trim() }).eq('id', editingActivityId).select().single(); if (error) { alert('Erro ao salvar.'); } else { setAtividades(atividades.map(at => at.id === editingActivityId ? data : at)); handleCancelEditing(); } };
  const handleAdicionarNota = async (e) => { e.preventDefault(); if (!novaNotaConteudo.trim()) return; const { data: { session } } = await supabase.auth.getSession(); if (!session?.user) { alert('Sessão inválida.'); return; } const novaNota = { negocio_id: negocio.id, user_id: session.user.id, conteudo: novaNotaConteudo }; const { data, error } = await supabase.from('crm_notas').insert(novaNota).select().single(); if (error) { alert('Erro ao adicionar nota.'); } else { setNotas([data, ...notas]); setNovaNotaConteudo(''); } };
  const handleCriarOrcamento = async () => { const { data, error } = await supabase.from('crm_orcamentos').insert({ negocio_id: negocio.id, status: 'Rascunho' }).select().single(); if (error) { alert('Erro ao criar orçamento.'); } else { setOrcamento(data); } };
  const handleAdicionarItem = async (e) => { e.preventDefault(); if (!produtoSelecionadoId) return; const produto = listaDeProdutos.find(p => p.id === produtoSelecionadoId); if (!produto) return; const newItem = { orcamento_id: orcamento.id, produto_id: produto.id, descricao: produto.nome, quantidade: quantidade, preco_unitario: produto.preco_padrao }; const { data: itemAdicionado, error } = await supabase.from('crm_orcamento_itens').insert(newItem).select('*, subtotal').single(); if (error) { alert('Erro ao adicionar item.'); } else { setOrcamentoItens([...orcamentoItens, itemAdicionado]); setProdutoSelecionadoId(''); setQuantidade(1); } };
  const handleRemoverItem = async (itemId) => { if (window.confirm('Remover este item?')) { const { error } = await supabase.from('crm_orcamento_itens').delete().eq('id', itemId); if (error) { alert('Erro ao remover item.'); } else { setOrcamentoItens(orcamentoItens.filter(item => item.id !== itemId)); } } };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        {isLostModalOpen && ( <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center rounded-lg z-10"> <form onSubmit={handleSubmitPerda} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl"> <h3 className="font-bold text-lg mb-2 dark:text-white">Qual o motivo da perda?</h3> <textarea value={motivoPerda} onChange={(e) => setMotivoPerda(e.target.value)} placeholder="Ex: Preço, etc." rows="4" className="w-full p-2 border rounded dark:bg-gray-800" required/> <div className="flex justify-end gap-4 mt-4"> <button type="button" onClick={() => setIsLostModalOpen(false)} className="py-2 px-4 rounded">Cancelar</button> <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white py-2 px-4 rounded">{isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}</button> </div> </form> </div> )}
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
          {carregandoDados ? (<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>) : (
            <>
              {abaAtiva === 'atividades' && ( <div> <form onSubmit={handleAdicionarAtividade} className="flex gap-2 mb-4"><input type="text" value={novaAtividadeDesc} onChange={e => setNovaAtividadeDesc(e.target.value)} placeholder="Adicionar uma nova tarefa..." className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" /><button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20} /></button></form> <ul className="space-y-2"> {atividades.map(at => (<li key={at.id} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50 group">{editingActivityId === at.id ? (<form onSubmit={handleSaveEdit} className="flex-grow flex gap-2 items-center"><input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-grow p-1 border rounded dark:bg-gray-700" autoFocus /><button type="submit" className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Salvar</button><button type="button" onClick={handleCancelEditing} className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button></form>) : (<><input type="checkbox" checked={at.concluida} onChange={() => handleToggleCompleta(at.id, at.concluida)} className="h-5 w-5 rounded cursor-pointer" /><div className="flex-grow"><p className={`${at.concluida ? 'line-through text-gray-500' : 'dark:text-gray-200'}`}>{at.descricao}</p><p className="text-xs text-gray-400">{new Date(at.data_atividade).toLocaleString('pt-BR')}</p></div><div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {/* --- BOTÃO ADICIONADO AQUI --- */}
                <button onClick={() => handleCreateGoogleEvent(at)} className="p-1 text-gray-500 hover:text-blue-600" title="Adicionar ao Google Calendar">
                  <CalendarPlus size={16}/>
                </button>
                <button onClick={() => handleStartEditing(at)} className="p-1 text-gray-500 hover:text-green-600"><Pencil size={16}/></button>
                <button onClick={() => handleDeletarAtividade(at.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16}/></button>
              </div></>)}</li>))} </ul> </div> )}
              {abaAtiva === 'notas' && ( <div> <form onSubmit={handleAdicionarNota} className="flex flex-col gap-2 mb-4"><textarea value={novaNotaConteudo} onChange={e => setNovaNotaConteudo(e.target.value)} placeholder="Escreva uma nota..." rows="3" className="w-full p-2 border rounded dark:bg-gray-700"></textarea><button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 self-end">Adicionar Nota</button></form> <ul className="space-y-3"> {notas.map(nota => (<li key={nota.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50"><MessageSquare className="mt-1" size={16} /><div><p className="dark:text-gray-200 whitespace-pre-wrap">{nota.conteudo}</p><p className="text-xs text-gray-400 mt-1">Adicionado em {new Date(nota.created_at).toLocaleString('pt-BR')}</p></div></li>))} </ul> </div> )}
              {abaAtiva === 'orcamento' && ( <div> {!orcamento ? (<div className="text-center py-10"><p className="mb-4">Nenhum orçamento criado.</p><button onClick={handleCriarOrcamento} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Criar Orçamento</button></div>) : ( <div> <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"> <div className="flex items-center gap-3"> <span className="font-semibold">Status:</span> <StatusBadge status={orcamento.status} /> </div> <div className="flex gap-2"> {orcamento.status === 'Rascunho' && ( <button onClick={() => handleMudarStatusOrcamento('Enviado')} className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Marcar como Enviado</button> )} {orcamento.status === 'Enviado' && ( <> <button onClick={() => handleMudarStatusOrcamento('Aprovado')} className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Aprovado</button> <button onClick={() => handleMudarStatusOrcamento('Rejeitado')} className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Rejeitado</button> </> )} </div> </div> <div className="mb-6 rounded-lg border dark:border-gray-700"><table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-2 text-left text-xs font-medium">Item</th><th className="px-4 py-2 text-left text-xs font-medium">Qtd</th><th className="px-4 py-2 text-left text-xs font-medium">Preço Unit.</th><th className="px-4 py-2 text-left text-xs font-medium">Subtotal</th><th></th></tr></thead><tbody className="divide-y dark:divide-gray-700">{orcamentoItens.map(item => (<tr key={item.id}><td className="px-4 py-2">{item.descricao}</td><td className="px-4 py-2">{item.quantidade}</td><td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</td><td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</td><td className="px-4 py-2"><button onClick={() => handleRemoverItem(item.id)}><Trash2 className="text-red-500" size={16}/></button></td></tr>))}</tbody></table></div> <div className="text-right font-bold text-xl mb-6">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalOrcamento)}</div> <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-end gap-4"> <div className="flex-grow"><label className="block text-sm font-medium mb-1">Produto</label><select value={produtoSelecionadoId} onChange={e => setProdutoSelecionadoId(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option value="">Selecione...</option>{listaDeProdutos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div> <div><label className="block text-sm font-medium mb-1">Quantidade</label><input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} min="1" className="w-24 p-2 border rounded-lg dark:bg-gray-700"/></div> <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg">Adicionar</button> </form> </div> )} </div> )}
              {abaAtiva === 'detalhes' && ( <div className="space-y-4 dark:text-gray-300"> <p><strong>Empresa:</strong> {negocio.empresa_contato}</p> <p><strong>Contato:</strong> {negocio.nome_contato}</p> <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p> <div> <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Users size={14}/>Responsável</label> <select value={responsavelId} onChange={(e) => handleMudarResponsavel(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"> <option value="">Ninguém atribuído</option> {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))} </select> </div> </div> )}
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