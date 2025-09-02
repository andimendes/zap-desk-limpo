// src/components/crm/AddLeadModal.jsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AddLeadModal = ({ isOpen, onClose, onLeadAdicionado }) => {
  const { session } = useAuth();
  
  // O formulário agora é para os dados do Contato + fonte do Lead
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fonte, setFonte] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome) {
      setError('O nome do contato é obrigatório.');
      return;
    }
    if (!session?.user?.id) {
      setError('Sessão de utilizador inválida.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Passo 1: Criar o Contato na tabela crm_contatos
      // (No futuro, podemos adicionar aqui a lógica para associar a uma empresa existente)
      const { data: novoContato, error: contatoError } = await supabase
        .from('crm_contatos')
        .insert({ nome, email, telefone })
        .select()
        .single();
      
      if (contatoError) throw contatoError;

      // Passo 2: Criar o Lead na tabela crm_leads, associando-o ao novo contato
      const { data: novoLead, error: leadError } = await supabase
        .from('crm_leads')
        .insert({
          user_id: session.user.id,
          contato_id: novoContato.id, // <-- A LIGAÇÃO PRINCIPAL
          fonte: fonte,
          // O status já tem o default 'Novo'
        })
        .select('*, crm_contatos(*)') // Já busca o lead com os dados do contato
        .single();

      if (leadError) throw leadError;

      onLeadAdicionado(novoLead);
      handleClose();

    } catch (error) {
      console.error('Erro no fluxo de adicionar lead:', error);
      setError('Não foi possível adicionar o lead. Verifique a consola para mais detalhes.');
      // Adicionar lógica para apagar o contato se a criação do lead falhar (opcional)
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNome('');
    setEmpresa('');
    setEmail('');
    setTelefone('');
    setFonte('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Adicionar Novo Lead</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome do Contato*</label>
              <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label htmlFor="empresa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
              <input id="empresa" type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div>
              <label htmlFor="telefone" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label>
              <input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div>
            <label htmlFor="fonte" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Fonte do Lead</label>
            <input id="fonte" type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Indicação, Site, Evento" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-200" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
              {loading ? 'A Adicionar...' : 'Adicionar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;