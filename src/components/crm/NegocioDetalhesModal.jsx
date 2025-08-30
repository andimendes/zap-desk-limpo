import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';

// ... (funções marcarNegocioComoGanho e marcarNegocioComoPerdido não mudam)
const marcarNegocioComoGanho = async (id) => {
  return await supabase.from('crm_negocios').update({ status: 'Ganho' }).eq('id', id);
};
const marcarNegocioComoPerdido = async (id, motivo) => {
  return await supabase.from('crm_negocios').update({ status: 'Perdido', motivo_perda: motivo }).eq('id', id);
};


const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  // ... (os useState existentes não mudam)
  const [abaAtiva, setAbaAtiva] = useState('atividades');
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O useEffect para carregar os dados não muda
  useEffect(() => {
    if (isOpen && negocio?.id) {
      const carregarDadosDoNegocio = async () => {
        setCarregandoDados(true);
        
        const { data: atividadesData, error: atividadesError } = await supabase
          .from('crm_atividades')
          .select('*') 
          .eq('negocio_id', negocio.id)
          .order('data_atividade', { ascending: false });

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

  // A função de adicionar atividade não muda
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
      concluida: false // Garantir que começa como não concluída
    };

    const { data, error } = await supabase.from('crm_atividades').insert(novaAtividade).select().single();
    
    if (error) {
      alert('Erro ao adicionar atividade: ' + error.message);
    } else {
      setAtividades([data, ...atividades]);
      setNovaAtividadeDesc('');
    }
  };
  
  // --- NOSSAS NOVAS FUNÇÕES ---

  /**
   * Altera o status de 'concluida' de uma atividade.
   * @param {string} id - O ID da atividade a ser alterada.
   * @param {boolean} statusAtual - O status de conclusão atual da atividade.
   */
  const handleToggleCompleta = async (id, statusAtual) => {
    // 1. Atualiza a base de dados
    const { error } = await supabase
      .from('crm_atividades')
      .update({ concluida: !statusAtual })
      .eq('id', id);

    if (error) {
      alert('Não foi possível atualizar a tarefa.');
    } else {
      // 2. Atualiza o estado local para a UI reagir instantaneamente
      setAtividades(atividades.map(at => 
        at.id === id ? { ...at, concluida: !statusAtual } : at
      ));
    }
  };

  /**
   * Apaga uma atividade da base de dados.
   * @param {string} id - O ID da atividade a ser apagada.
   */
  const handleDeletarAtividade = async (id) => {
    // 1. Pede confirmação ao utilizador por segurança
    if (window.confirm('Tem a certeza de que quer apagar esta tarefa?')) {
      // 2. Apaga da base de dados
      const { error } = await supabase
        .from('crm_atividades')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Não foi possível apagar a tarefa.');
      } else {
        // 3. Atualiza o estado local removendo o item da lista
        setAtividades(atividades.filter(at => at.id !== id));
      }
    }
  };


  // ... (Restante do código, como handleAdicionarNota e as funções de ganhou/perdeu não mudam)
  const handleAdicionarNota = async (e) => { /* ...código original sem alterações... */ };
  const handleGanhouClick = async () => { /* ...código original sem alterações... */ };
  const handleSubmitPerda = async (e) => { /* ...código original sem alterações... */ };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        
        {isLostModalOpen && ( /* ...código original sem alterações... */ <div/> )}

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
                  
                  {/* --- A NOSSA LISTA DE ATIVIDADES ATUALIZADA --- */}
                  <ul className="space-y-2">
                    {atividades.length > 0 ? atividades.map(at => (
                      <li key={at.id} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50 group">
                        {/* Checkbox para concluir a tarefa */}
                        <input 
                          type="checkbox"
                          checked={at.concluida}
                          onChange={() => handleToggleCompleta(at.id, at.concluida)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-grow">
                          {/* Descrição com estilo condicional (riscado se concluída) */}
                          <p className={` ${at.concluida ? 'line-through text-gray-500' : 'dark:text-gray-200'}`}>
                            {at.descricao}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(at.data_atividade).toLocaleString('pt-BR')}</p>
                        </div>
                        {/* Botão de apagar que aparece ao passar o rato */}
                        <button 
                          onClick={() => handleDeletarAtividade(at.id)} 
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </li>
                    )) : <p className="text-gray-500 text-center py-4">Nenhuma atividade registada.</p>}
                  </ul>
                </div>
              )}

              {abaAtiva === 'notas' && ( /* ...código original sem alterações... */ <div/> )}
              {abaAtiva === 'detalhes' && ( /* ...código original sem alterações... */ <div/> )}
            </>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            {/* ...código original sem alterações... */}
        </div>
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;