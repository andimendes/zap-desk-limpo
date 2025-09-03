// src/components/crm/AddLeadModal.jsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AddLeadModal = ({ isOpen, onClose, onLeadAdicionado }) => {
  const { session } = useAuth();
  
  // Adicionamos o campo 'empresa' ao estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    fonte: '',
    empresa: '', 
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função "upsert": tenta encontrar uma empresa, se não achar, cria uma nova.
  const findOrCreateEmpresa = async (nomeEmpresa) => {
    if (!nomeEmpresa || !nomeEmpresa.trim()) return null;
    
    let { data, error } = await supabase
      .from('crm_empresas')
      .select('id')
      .ilike('nome_fantasia', nomeEmpresa.trim())
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) return data.id;

    const { data: novaEmpresa, error: insertError } = await supabase
      .from('crm_empresas')
      .insert({ nome_fantasia: nomeEmpresa.trim() })
      .select('id')
      .single();
    if (insertError) throw insertError;
    
    return novaEmpresa.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome do lead é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Passo 1: Encontrar ou criar a empresa para obter o ID.
      const empresaId = await findOrCreateEmpresa(formData.empresa);

      // Passo 2: Criar o contato, agora com o 'empresa_id' associado.
      const { data: novoContato, error: contatoError } = await supabase
        .from('crm_contatos')
        .insert({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          empresa_id: empresaId, // Associamos a empresa ao contato
        })
        .select()
        .single();

      if (contatoError) throw contatoError;

      // Passo 3: Criar o lead, referenciando o contato recém-criado.
      const { data: novoLead, error: leadError } = await supabase
        .from('crm_leads')
        .insert({
          user_id: session.user.id,
          contato_id: novoContato.id,
          fonte: formData.fonte,
          status: 'Novo',
        })
        .select('*, crm_contatos(*)') // Buscamos o lead com os dados do contato
        .single();
        
      if (leadError) throw leadError;
      
      onLeadAdicionado(novoLead);
      handleClose();

    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      setError('Não foi possível adicionar o lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nome: '', email: '', telefone: '', fonte: '', empresa: '' });
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
              <label htmlFor="nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome*</label>
              <input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label htmlFor="empresa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
              <input id="empresa" name="empresa" type="text" value={formData.empresa} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">E-mail</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div>
              <label htmlFor="telefone" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label>
              <input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div>
            <label htmlFor="fonte" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Fonte do Lead</label>
            <input id="fonte" name="fonte" type="text" value={formData.fonte} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
              {loading ? 'A Guardar...' : 'Guardar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;