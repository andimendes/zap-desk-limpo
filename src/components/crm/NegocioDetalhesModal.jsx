import React, { useState } from 'react';
// CORREÇÃO: Ajustado o caminho de importação para ser relativo
import { supabase } from '../../supabaseClient'; 
import { marcarNegocioComoGanho, marcarNegocioComoPerdido } from '../../supabaseClient';

// Este modal exibe os detalhes de um negócio e permite as ações de Ganhar/Perder.
const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Lógica para marcar como ganho
  const handleGanhouClick = async () => {
    if (window.confirm(`Tem a certeza que quer marcar o negócio "${negocio.titulo}" como GANHO?`)) {
      const { error } = await marcarNegocioComoGanho(negocio.id);
      if (error) {
        alert('Erro ao marcar negócio como ganho: ' + error.message);
      } else {
        alert('Negócio marcado como ganho!');
        onNegocioUpdate(negocio.id);
      }
    }
  };

  // Lógica para marcar como perdido (abre um segundo mini-modal)
  const handleSubmitPerda = async (e) => {
    e.preventDefault();
    if (!motivoPerda) {
      alert('Por favor, preencha o motivo da perda.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await marcarNegocioComoPerdido(negocio.id, motivoPerda);
    
    if (error) {
      alert('Erro ao marcar negócio como perdido: ' + error.message);
    } else {
      alert('Negócio marcado como perdido.');
      onNegocioUpdate(negocio.id);
    }
    
    setIsSubmitting(false);
    setIsLostModalOpen(false);
    setMotivoPerda('');
  };

  // Renderização do Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        
        {/* Modal de Motivo da Perda (sobrepõe o de detalhes) */}
        {isLostModalOpen && (
           <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center rounded-lg">
             <form onSubmit={handleSubmitPerda} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-2">Qual o motivo da perda?</h3>
                <textarea
                  value={motivoPerda}
                  onChange={(e) => setMotivoPerda(e.target.value)}
                  placeholder="Ex: Preço, concorrência, etc."
                  rows="4"
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                  required
                />
                <div className="flex justify-end gap-4 mt-4">
                  <button type="button" onClick={() => setIsLostModalOpen(false)} className="py-2 px-4 rounded">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white py-2 px-4 rounded">
                    {isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}
                  </button>
                </div>
              </form>
           </div>
        )}

        {/* Conteúdo Principal do Modal de Detalhes */}
        <h2 className="text-2xl font-bold mb-4">{negocio.titulo}</h2>
        <p><strong>Empresa:</strong> {negocio.empresa_contato}</p>
        <p><strong>Contato:</strong> {negocio.nome_contato}</p>
        <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
        {/* Adicione outros campos do negócio aqui */}

        {/* Botões de Ação */}
        <div className="mt-6 flex justify-between items-center">
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