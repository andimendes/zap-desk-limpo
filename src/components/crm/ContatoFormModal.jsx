// src/components/crm/ContatoFormModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, Linkedin, Instagram, Facebook } from 'lucide-react'; // Ícones adicionados
import BuscaECria from './BuscaECria';
import InputMask from 'react-input-mask';

const ContatoFormModal = ({ isOpen, onClose, onSave, contato, empresaIdInicial }) => {
  // --- ALTERADO: Adicionado campos de redes sociais ao estado inicial ---
  const initialState = {
    nome: '', cargo: '', email: '', telefone: '',
    linkedin_url: '', instagram_url: '', facebook_url: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDadosIniciais = async () => {
        // Garante que o form seja resetado ao abrir
        setFormData(initialState); 
        setNomeEmpresa('');

        if (contato) {
            // Preenche com todos os dados, incluindo os novos
            setFormData({ ...initialState, ...contato });
            
            // Se estiver editando um contato sem contexto de empresa, não preenche a empresa
            if (empresaIdInicial) {
                const { data } = await supabase.from('crm_empresas').select('nome_fantasia').eq('id', empresaIdInicial).single();
                if (data) setNomeEmpresa(data.nome_fantasia);
            }
        } else if (empresaIdInicial) {
            const { data } = await supabase.from('crm_empresas').select('nome_fantasia').eq('id', empresaIdInicial).single();
            if (data) setNomeEmpresa(data.nome_fantasia);
        }
    };
    if (isOpen) fetchDadosIniciais();
  }, [contato, isOpen, empresaIdInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const findOrCreateEmpresa = async (nome) => {
      if (!nome || !nome.trim()) return null;
      let { data } = await supabase.from('crm_empresas').select('id').ilike('nome_fantasia', nome.trim()).limit(1).single();
      if (data) return data.id;
      const { data: novoRegistro, error: insertError } = await supabase.from('crm_empresas').insert({ nome_fantasia: nome.trim() }).select('id').single();
      if (insertError) throw insertError;
      return novoRegistro.id;
  };

  // --- GRANDE ALTERAÇÃO: Lógica de handleSubmit para Muitos-para-Muitos ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome do contato é obrigatório.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const empresaId = await findOrCreateEmpresa(nomeEmpresa);

      // 1. Prepara os dados do contato SEM o 'empresa_id'
      const dadosContato = {
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ''),
      };
      
      let savedContact;

      // 2. Salva (cria ou atualiza) o contato
      if (contato?.id) {
        const { data, error } = await supabase.from('crm_contatos').update(dadosContato).eq('id', contato.id).select().single();
        if (error) throw error;
        savedContact = data;
      } else {
        const { data, error } = await supabase.from('crm_contatos').insert(dadosContato).select().single();
        if (error) throw error;
        savedContact = data;
      }

      // 3. Se uma empresa foi selecionada, cria a LIGAÇÃO na tabela junction
      if (empresaId && savedContact) {
        // Verifica se a ligação já existe para não duplicar
        const { data: existingLink } = await supabase
          .from('empresa_contato_junction')
          .select()
          .match({ empresa_id: empresaId, contato_id: savedContact.id })
          .limit(1);

        if (!existingLink || existingLink.length === 0) {
          const { error: linkError } = await supabase
            .from('empresa_contato_junction')
            .insert({ empresa_id: empresaId, contato_id: savedContact.id });
          if (linkError) throw linkError;
        }
      }

      onSave(savedContact);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      setError(`Não foi possível salvar as alterações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{contato ? 'Editar Contato' : 'Novo Contato'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome*</label><input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required /></div>
                <div><label htmlFor="cargo" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Cargo</label><input id="cargo" name="cargo" type="text" value={formData.cargo} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            </div>
            <div><label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa (para criar um novo vínculo)</label><BuscaECria tabela="crm_empresas" coluna="nome_fantasia" placeholder="Busque ou crie uma empresa" valorInicial={nomeEmpresa} onSelecao={(valor) => setNomeEmpresa(valor)} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">E-mail</label><input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                <div><label htmlFor="telefone" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label><InputMask mask="(99) 99999-9999" value={formData.telefone} onChange={handleChange}>{(inputProps) => <input {...inputProps} id="telefone" name="telefone" type="tel" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />}</InputMask></div>
            </div>
            
            {/* --- NOVO: Campos de Redes Sociais --- */}
            <hr className="dark:border-gray-600 my-2" />
            <div className="space-y-4">
                <div className="relative"><label htmlFor="linkedin_url" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">LinkedIn</label><Linkedin className="absolute left-3 top-10 h-5 w-5 text-gray-400" /><input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin_url} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative"><label htmlFor="instagram_url" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Instagram</label><Instagram className="absolute left-3 top-10 h-5 w-5 text-gray-400" /><input id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/..." value={formData.instagram_url} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div className="relative"><label htmlFor="facebook_url" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Facebook</label><Facebook className="absolute left-3 top-10 h-5 w-5 text-gray-400" /><input id="facebook_url" name="facebook_url" type="url" placeholder="https://facebook.com/..." value={formData.facebook_url} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600" disabled={loading}>Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>{loading && <Loader2 className="animate-spin mr-2" size={16} />}{loading ? 'A Salvar...' : 'Salvar'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ContatoFormModal;