import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';

const marcarNegocioComoGanho = async (id) => {
  return await supabase.from('crm_negocios').update({ status: 'Ganho' }).eq('id', id);
};

const marcarNegocioComoPerdido = async (id, motivo) => {
  return await supabase.from('crm_negocios').update({ status: 'Perdido', motivo_perda: motivo }).eq('id', id);
};

const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate }) => {
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGanhouClick = async () => {
    if (window.confirm(`Tem a certeza que quer marcar o negócio "${negocio.titulo}" como GANHO?`)) {
      const { error } = await marcarNegocioComoGanho(negocio.id);
      if (error) {
        alert('Erro: ' + error.message);
      } else {
        alert('Negócio marcado como ganho!');
        onNegocioUpdate(negocio.id);
      }
    }
  };

  const handleSubmitPerda = async (e) => {
    e.preventDefault();
    if (!motivoPerda) {
      alert('Por favor, preencha o motivo da perda.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await marcarNegocioComoPerdido(negocio.id, motivoPerda);
    
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Negócio marcado como perdido.');
      onNegocioUpdate(negocio.id);
    }
    
    setIsSubmitting(false);
    setIsLostModalOpen(false);
    setMotivoPerda('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        
        {isLostModalOpen && (
           <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center rounded-lg">
             <form onSubmit={handleSubmitPerda} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-2 dark:text-white">Qual o motivo da perda?</h3>
                <textarea
                  value={motivoPerda}
                  onChange={(e) => setMotivoPerda(e.target.value)}
                  placeholder="Ex: Preço, concorrência, etc."
                  rows="4"
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
                <div className="flex justify-end gap-4 mt-4">
                  <button type="button" onClick={() => setIsLostModalOpen(false)} className="py-2 px-4 rounded dark:text-gray-300">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white py-2 px-4 rounded">
                    {isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}
                  </button>
                </div>
              </form>
           </div>
        )}

        <h2 className="text-2xl font-bold mb-4 dark:text-white">{negocio.titulo}</h2>
        <p className="dark:text-gray-300"><strong>Empresa:</strong> {negocio.empresa_contato}</p>
        <p className="dark:text-gray-300"><strong>Contato:</strong> {negocio.nome_contato}</p>
        <p className="dark:text-gray-300"><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
        
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