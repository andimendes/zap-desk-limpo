import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Clock, MessageSquare, Plus, Trash2, Pencil } from 'lucide-react';

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

  // --- NOVOS ESTADOS PARA GERIR A EDIÇÃO ---
  const [editingActivityId, setEditingActivityId] = useState(null); // Guarda o ID da tarefa a ser editada
  const [editText, setEditText] = useState(''); // Guarda o texto da tarefa durante a edição

  // O useEffect para carregar os dados não muda
  useEffect(() => { /* ...código original sem alterações... */ }, [isOpen, negocio?.id]);

  // A função de adicionar atividade não muda
  const handleAdicionarAtividade = async (e) => { /* ...código original sem alterações... */ };
  
  // As funções de concluir e apagar não mudam
  const handleToggleCompleta = async (id, statusAtual) => { /* ...código original sem alterações... */ };
  const handleDeletarAtividade = async (id) => { /* ...código original sem alterações... */ };

  // --- NOSSAS NOVAS FUNÇÕES PARA EDIÇÃO ---

  /**
   * Inicia o modo de edição para uma atividade.
   * @param {object} atividade - O objeto completo da atividade a ser editada.
   */
  const handleStartEditing = (atividade) => {
    setEditingActivityId(atividade.id);
    setEditText(atividade.descricao);
  };

  /**
   * Cancela o modo de edição.
   */
  const handleCancelEditing = () => {
    setEditingActivityId(null);
    setEditText('');
  };

  /**
   * Salva as alterações da atividade que está a ser editada.
   * @param {Event} e - O evento do formulário.
   */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || !editingActivityId) return;

    // 1. Atualiza a base de dados
    const { data, error } = await supabase
      .from('crm_atividades')
      .update({ descricao: editText.trim() })
      .eq('id', editingActivityId)
      .select()
      .single();

    if (error) {
      alert('Não foi possível salvar as alterações.');
    } else {
      // 2. Atualiza o estado local
      setAtividades(atividades.map(at => at.id === editingActivityId ? data : at));
      // 3. Sai do modo de edição
      handleCancelEditing();
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
            {/* ...código das abas sem alterações... */}
        </div>

        <div className="min-h-[300px]">
          {carregandoDados ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {abaAtiva === 'atividades' && (
                <div>
                  <form onSubmit={handleAdicionarAtividade} className="flex gap-2 mb-4">
                    {/* ...código do formulário de adicionar sem alterações... */}
                  </form>
                  
                  <ul className="space-y-2">
                    {atividades.length > 0 ? atividades.map(at => (
                      <li key={at.id} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900/50 group">
                        
                        {/* --- LÓGICA DE RENDERIZAÇÃO CONDICIONAL --- */}
                        {editingActivityId === at.id ? (
                          // MODO DE EDIÇÃO
                          <form onSubmit={handleSaveEdit} className="flex-grow flex gap-2 items-center">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-grow p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              autoFocus
                            />
                            <button type="submit" className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Salvar</button>
                            <button type="button" onClick={handleCancelEditing} className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button>
                          </form>
                        ) : (
                          // MODO DE VISUALIZAÇÃO (NORMAL)
                          <>
                            <input 
                              type="checkbox"
                              checked={at.concluida}
                              onChange={() => handleToggleCompleta(at.id, at.concluida)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-grow">
                              <p className={` ${at.concluida ? 'line-through text-gray-500' : 'dark:text-gray-200'}`}>
                                {at.descricao}
                              </p>
                              <p className="text-xs text-gray-400">{new Date(at.data_atividade).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleStartEditing(at)} className="text-gray-400 hover:text-blue-500 p-1">
                                <Pencil size={16}/>
                              </button>
                              <button onClick={() => handleDeletarAtividade(at.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </>
                        )}
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