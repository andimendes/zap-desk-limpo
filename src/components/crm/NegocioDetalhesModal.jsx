import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { marcarNegocioComoGanho, marcarNegocioComoPerdido } from '../../supabaseClient';

const NegocioDetalhesModal = ({ negocio, onClose, onNegocioUpdate }) => {
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (toda a lógica interna do modal, handleGanhouClick, handleSubmitPerda, etc.)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        {/* Conteúdo do modal e botões de Ganhou/Perdeu */}
        <h2 className="text-2xl font-bold mb-4">{negocio.titulo}</h2>
        {/* ... restante do JSX do modal ... */}
        <div className="mt-6 flex justify-between items-center">
          <button onClick={onClose}>Fechar</button>
          <div className="flex gap-4">
            <button /* onClick={handleGanhouClick} */>Ganhou</button>
            <button /* onClick={() => setIsLostModalOpen(true)} */>Perdeu</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;