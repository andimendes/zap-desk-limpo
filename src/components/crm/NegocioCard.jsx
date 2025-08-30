import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
// CORREÇÃO: O caminho foi ajustado para ser relativo, o que é mais seguro.
import { marcarNegocioComoGanho, marcarNegocioComoPerdido } from '../../supabaseClient';

// --- Componente Principal ---
function NegocioCard({ negocio, index, onNegocioUpdate }) {
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para lidar com o clique em "Ganhou"
  const handleGanhouClick = async () => {
    if (window.confirm(`Tem a certeza que quer marcar o negócio "${negocio.titulo}" como GANHO?`)) {
      const { error } = await marcarNegocioComoGanho(negocio.id);
      if (error) {
        console.error('Erro ao marcar negócio como ganho:', error);
        alert('Erro ao marcar negócio como ganho: ' + error.message);
      } else {
        alert('Negócio marcado como ganho com sucesso!');
        onNegocioUpdate(negocio.id);
      }
    }
  };

  // Função para submeter o motivo da perda
  const handleSubmitPerda = async (e) => {
    e.preventDefault();
    if (!motivoPerda.trim()) {
      alert('Por favor, preencha o motivo da perda.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await marcarNegocioComoPerdido(negocio.id, motivoPerda);

    if (error) {
      console.error('Erro ao marcar negócio como perdido:', error);
      alert('Erro ao marcar negócio como perdido: ' + error.message);
    } else {
      alert('Negócio marcado como perdido.');
      onNegocioUpdate(negocio.id);
    }

    setIsSubmitting(false);
    setIsLostModalOpen(false);
    setMotivoPerda('');
  };

  return (
    <>
      <Draggable draggableId={String(negocio.id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-md border-l-4 border-blue-500 ${
              snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
            }`}
          >
            <h4 className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{negocio.empresa_contato}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">{negocio.nome_contato}</p>
            <div className="mt-3 text-right">
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}
              </span>
            </div>
            
            {/* --- Botões de Ação --- */}
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleGanhouClick} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-lg transition-colors">Ganhou</button>
              <button onClick={() => setIsLostModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-lg transition-colors">Perdeu</button>
            </div>
          </div>
        )}
      </Draggable>

      {/* --- Modal para Motivo da Perda --- */}
      {isLostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Perdeu o Negócio "{negocio.titulo}"?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Descreva o motivo da perda. Esta informação é importante para futuras estratégias.</p>
            <form onSubmit={handleSubmitPerda} className="mt-4">
              <textarea
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                placeholder="Ex: Preço muito alto, concorrência ofereceu mais vantagens, etc."
                rows="4"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsLostModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400">
                  {isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default NegocioCard;