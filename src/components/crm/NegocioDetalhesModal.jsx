// src/components/crm/NegocioDetalhesModal.jsx (VERSÃO DE DEPURAÇÃO)

import React from 'react';
import { X } from 'lucide-react';

const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose }) => {
  // Toda a lógica interna (useState, useEffect, handlers) foi removida para este teste.

  if (!isOpen) {
    return null;
  }

  // Uma verificação de segurança caso o objeto do negócio não seja passado corretamente.
  if (!negocioInicial) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold text-red-600">Erro de Depuração</h2>
                <p>O objeto 'negocio' não foi recebido pelo modal.</p>
                 <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Fechar</button>
            </div>
        </div>
    );
  }

  // Este é o nosso modal de teste. Ele não usa nenhum componente filho.
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Modo de Depuração Ativo</h1>
            <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="bg-blue-50 p-4 rounded-md">
            <p className="font-semibold">O modal abriu com sucesso!</p>
            <p>Título do Negócio: <span className="font-bold">{negocioInicial.titulo}</span></p>
        </div>
        <p className="mt-4 text-sm text-gray-600">
            Se você está vendo esta tela e não há erros no console, significa que o problema está em um dos componentes filhos do modal (como BarraLateral, FunilProgressBar, etc.) ou na lógica de busca de dados que foi temporariamente removida.
        </p>
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;