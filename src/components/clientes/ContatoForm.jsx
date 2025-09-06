// src/components/clientes/ContatoForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';

const ContatoFormModal = ({ isOpen, onClose, contatoInicial, empresaId }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(contatoInicial);

  useEffect(() => {
    if (contatoInicial) {
      setFormData({
        nome: contatoInicial.nome || '',
        email: contatoInicial.email || '',
        telefone: contatoInicial.telefone || '',
        cargo: contatoInicial.cargo || ''
      });
    } else {
      // Reset para o estado inicial quando for criar um novo
      setFormData({ nome: '', email: '', telefone: '', cargo: '' });
    }
  }, [contatoInicial, isOpen]);

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
      if (isEditing) {
        // Modo Edição
        const { error } = await supabase
          .from('crm_contatos')
          .update(formData)
          .eq('id', contatoInicial.id);
        
        if (error) throw error;
        alert("Contato atualizado com sucesso!");

      } else {
        // Modo Criação
        const { data: novoContato, error: insertError } = await supabase
          .from('crm_contatos')
          .insert(formData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Vincula o novo contato à empresa
        const { error: junctionError } = await supabase
            .from('empresa_contato_junction')
            .insert({ empresa_id: empresaId, contato_id: novoContato.id });

        if (junctionError) throw junctionError;
        
        alert("Contato criado e vinculado com sucesso!");
      }
      onClose();

    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      setError(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Contato' : 'Criar Novo Contato'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block font-semibold mb-1">Nome*</label>
            <input name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700" required />
          </div>
          <div>
            <label htmlFor="email" className="block font-semibold mb-1">E-mail</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="telefone" className="block font-semibold mb-1">Telefone</label>
            <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="cargo" className="block font-semibold mb-1">Cargo</label>
            <input name="cargo" value={formData.cargo} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700" />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600">Cancelar</button>
            <button type="submit" disabled={loading} className="py-2 px-5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center">
              {loading && <Loader2 className="animate-spin mr-2" />}
              {isEditing ? 'Salvar Alterações' : 'Criar e Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContatoFormModal;