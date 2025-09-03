// src/components/crm/EditContactModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';
import BuscaECria from './BuscaECria'; // Precisamos do componente de busca

const EditContactModal = ({ isOpen, onClose, onSave, contato }) => {
  // --- 1. ADICIONAMOS TODOS OS CAMPOS DA TABELA AO ESTADO ---
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: ''
  });
  // Estado separado para o nome da empresa, para usar com o BuscaECria
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmpresaDoContato = async () => {
        if (contato?.empresa_id) {
            const { data, error } = await supabase
                .from('crm_empresas')
                .select('nome_fantasia')
                .eq('id', contato.empresa_id)
                .single();
            if (!error && data) {
                setNomeEmpresa(data.nome_fantasia);
            }
        } else {
            setNomeEmpresa('');
        }
    }

    if (isOpen) {
        if (contato) {
            // --- 2. PREENCHEMOS OS NOVOS CAMPOS AO EDITAR ---
            setFormData({
                nome: contato.nome || '',
                cargo: contato.cargo || '',
                email: contato.email || '',
                telefone: contato.telefone || ''
            });
            fetchEmpresaDoContato();
        } else {
            // Limpa o formulário para um novo contato
            setFormData({
                nome: '',
                cargo: '',
                email: '',
                telefone: ''
            });
            setNomeEmpresa('');
        }
    }
  }, [contato, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const findOrCreateEmpresa = async (nome) => {
      if (!nome || !nome.trim()) return null;
      let { data, error } = await supabase.from('crm_empresas').select('id').ilike('nome_fantasia', nome.trim()).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) return data.id;
      const { data: novoRegistro, error: insertError } = await supabase.from('crm_empresas').insert({ nome_fantasia: nome.trim() }).select('id').single();
      if (insertError) throw insertError;
      return novoRegistro.id;
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
      let result;
      // Primeiro, encontramos ou criamos a empresa para ter o ID
      const empresaId = await findOrCreateEmpresa(nomeEmpresa);

      const dadosContato = { 
        ...formData,
        empresa_id: empresaId // Adicionamos o ID da empresa
      };

      if (contato?.id) {
        const { data, error: updateError } = await supabase
          .from('crm_contatos')
          .update(dadosContato)
          .eq('id', contato.id)
          .select('*, empresa:crm_empresas(nome_fantasia)')
          .single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('crm_contatos')
          .insert(dadosContato)
          .select('*, empresa:crm_empresas(nome_fantasia)')
          .single();
        if (insertError) throw insertError;
        result = data;
      }
      onSave(result); // onSave deve ser preparado para receber o contato com a empresa aninhada
      onClose();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      setError('Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          {contato ? 'Editar Contato' : 'Novo Contato'}
        </h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        {/* --- 3. ATUALIZAMOS O FORMULÁRIO COM TODOS OS CAMPOS --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome*</label>
                    <input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="cargo" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Cargo</label>
                    <input id="cargo" name="cargo" type="text" value={formData.cargo} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>

            <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
                <BuscaECria 
                    tabela="crm_empresas" 
                    coluna="nome_fantasia" 
                    placeholder="Busque ou crie uma empresa" 
                    valorInicial={nomeEmpresa} 
                    onSelecao={(valor) => setNomeEmpresa(valor)}
                />
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

            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600" disabled={loading}>Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
                    {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                    {loading ? 'A Salvar...' : 'Salvar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;