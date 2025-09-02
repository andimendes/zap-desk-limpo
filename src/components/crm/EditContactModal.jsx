// src/components/crm/EditContactModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

const EditContactModal = ({ isOpen, onClose, onContatoAtualizado, lead }) => {
  // O estado do formulário guardará os dados do contato e do lead
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    fonte: '',
    status: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preenche o formulário com os dados existentes quando o modal abre
  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.crm_contatos?.nome || '',
        email: lead.crm_contatos?.email || '',
        telefone: lead.crm_contatos?.telefone || '',
        fonte: lead.fonte || '',
        status: lead.status || 'Novo',
      });
    }
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome do contato é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Passo 1: Atualizar a tabela de contatos
      const { data: contatoAtualizado, error: contatoError } = await supabase
        .from('crm_contatos')
        .update({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
        })
        .eq('id', lead.contato_id)
        .select()
        .single();
      
      if (contatoError) throw contatoError;

      // Passo 2: Atualizar a tabela de leads (fonte e status)
      const { data: leadAtualizado, error: leadError } = await supabase
        .from('crm_leads')
        .update({
          fonte: formData.fonte,
          status: formData.status,
        })
        .eq('id', lead.id)
        .select()
        .single();
        
      if (leadError) throw leadError;
      
      // Monta o objeto completo para atualizar a UI
      const resultadoFinal = {
        ...leadAtualizado,
        crm_contatos: contatoAtualizado
      };

      onContatoAtualizado(resultadoFinal);
      onClose();

    } catch (error) {
      console.error('Erro ao atualizar lead/contato:', error);
      setError('Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Editar Lead / Contato</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
              <label htmlFor="edit-nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome do Contato*</label>
              <input id="edit-nome" name="nome" type="text" value={formData.nome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-email" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">E-mail</label>
              <input id="edit-email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div>
              <label htmlFor="edit-telefone" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label>
              <input id="edit-telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-fonte" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Fonte do Lead</label>
              <input id="edit-fonte" name="fonte" type="text" value={formData.fonte} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div>
              <label htmlFor="edit-status" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Status</label>
              <select id="edit-status" name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white dark:text-gray-200">
                <option>Novo</option>
                <option>Em Contato</option>
                <option>Qualificado</option>
                <option value="Convertido" disabled>Convertido</option>
                <option>Descartado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-200" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
              {loading ? 'A Salvar...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;