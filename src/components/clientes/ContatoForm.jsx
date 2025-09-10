// src/components/clientes/ContatoForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';
import InputMask from 'react-input-mask'; 

const ContatoForm = ({ onClose, contatoInicial, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', cargo: ''
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
      setFormData({ nome: '', email: '', telefone: '', cargo: '' });
    }
  }, [contatoInicial]);

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

    const dadosParaSalvar = {
        ...formData,
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : '',
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('crm_contatos')
          .update(dadosParaSalvar)
          .eq('id', contatoInicial.id);
        if (error) throw error;
        alert("Contato atualizado com sucesso!");
      } else {
        const { error } = await supabase
            .from('crm_contatos')
            .insert(dadosParaSalvar);
        if (error) throw error;
        alert("Contato criado com sucesso!");
      }
      onSave();
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      setError(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- MÁSCARA DE TELEFONE DINÂMICA ---
  // Esta máscara muda automaticamente para se adaptar a telemóveis com 8 ou 9 dígitos.
  const telefoneMask = formData.telefone && formData.telefone.replace(/\D/g, '').length > 10 
    ? "(99) 99999-9999" 
    : "(99) 9999-9999";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
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
          {/* --- MÁSCARA APLICADA AQUI --- */}
          <InputMask
            mask={telefoneMask}
            value={formData.telefone}
            onChange={handleChange}
          >
            {(inputProps) => <input {...inputProps} name="telefone" className="w-full p-2 border rounded dark:bg-gray-700" />}
          </InputMask>
        </div>
        <div>
          <label htmlFor="cargo" className="block font-semibold mb-1">Cargo</label>
          <input name="cargo" value={formData.cargo} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700" />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} disabled={loading} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600">Cancelar</button>
          <button type="submit" disabled={loading} className="py-2 px-5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center">
            {loading && <Loader2 className="animate-spin mr-2" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContatoForm;