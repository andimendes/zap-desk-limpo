import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil, Users } from 'lucide-react';

// --- NOVO COMPONENTE INTERNO PARA O BADGE DE STATUS ---
const StatusBadge = ({ status }) => {
  const statusStyles = {
    'Rascunho': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Enviado': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Aprovado': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Rejeitado': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-200'}`}>
      {status}
    </span>
  );
};


const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate, onDataChange }) => {
  // ... (Todos os `useState` permanecem os mesmos)
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

  // O useEffect permanece o mesmo
  useEffect(() => { /* ...código da função sem alterações... */ }, [isOpen, negocio]);

  // --- NOVA FUNÇÃO PARA MUDAR O STATUS DO ORÇAMENTO ---
  const handleMudarStatusOrcamento = async (novoStatus) => {
    if (!orcamento) return;

    // 1. Atualiza o status do orçamento
    const { data: orcamentoAtualizado, error: orcamentoError } = await supabase
      .from('crm_orcamentos')
      .update({ status: novoStatus })
      .eq('id', orcamento.id)
      .select()
      .single();

    if (orcamentoError) {
      alert('Erro ao atualizar o status do orçamento.');
      return;
    }

    setOrcamento(orcamentoAtualizado); // Atualiza o estado local do orçamento

    // 2. Automação Inteligente: Se aprovado, atualiza o valor do negócio!
    if (novoStatus === 'Aprovado') {
      const { data: negocioAtualizado, error: negocioError } = await supabase
        .from('crm_negocios')
        .update({ valor: valorTotalOrcamento })
        .eq('id', negocio.id)
        .select('*, responsavel:profiles(full_name)')
        .single();
      
      if (negocioError) {
        alert('Status do orçamento atualizado, mas houve um erro ao atualizar o valor do negócio.');
      } else {
        onDataChange(negocioAtualizado); // Envia o negócio com o novo valor para o CrmBoard
        alert('Orçamento aprovado e valor do negócio atualizado com sucesso!');
      }
    }
  };

  // ... (Todas as outras funções 'handle' permanecem as mesmas)
  const valorTotalOrcamento = orcamentoItens.reduce((total, item) => total + (item.subtotal || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
        
        {/* ... (Modal de perda sem alterações) ... */}

        <h2 className="text-2xl font-bold mb-4 dark:text-white">{negocio.titulo}</h2>
        
        {/* ... (Navegação das abas sem alterações) ... */}
        
        <div className="min-h-[350px] max-h-[60vh] overflow-y-auto pr-2">
          {carregandoDados ? ( <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> ) : (
            <>
              {abaAtiva === 'atividades' && ( <div>{/* ... JSX da aba ... */}</div> )}
              {abaAtiva === 'notas' && ( <div>{/* ... JSX da aba ... */}</div> )}
              {abaAtiva === 'detalhes' && ( <div>{/* ... JSX da aba ... */}</div> )}

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
                      {/* --- NOVA SECÇÃO DE STATUS E AÇÕES --- */}
                      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                           <span className="font-semibold">Status:</span>
                           <StatusBadge status={orcamento.status} />
                        </div>
                        <div className="flex gap-2">
                           {orcamento.status === 'Rascunho' && (
                             <button onClick={() => handleMudarStatusOrcamento('Enviado')} className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Marcar como Enviado</button>
                           )}
                           {orcamento.status === 'Enviado' && (
                            <>
                              <button onClick={() => handleMudarStatusOrcamento('Aprovado')} className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Marcar como Aprovado</button>
                              <button onClick={() => handleMudarStatusOrcamento('Rejeitado')} className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Marcar como Rejeitado</button>
                            </>
                           )}
                        </div>
                      </div>

                      {/* ... (Restante do JSX do orçamento: tabela, total, formulário) ... */}
                      <div className="mb-6 rounded-lg border dark:border-gray-700"><table className="min-w-full">{/* ... */}</table></div>
                      <div className="text-right font-bold text-xl mb-6">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalOrcamento)}</div>
                      <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-end gap-4">{/* ... */}</form>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* ... (Rodapé do modal sem alterações) ... */}
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;