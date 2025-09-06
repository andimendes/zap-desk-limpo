// src/components/crm/EmpresaFormModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';

const EmpresaFormModal = ({ isOpen, onClose, onSave, empresa }) => {
  // Estado inicial agora inclui todos os campos da tabela crm_empresas
  const initialState = {
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    site: '',
    segmento: '',
    // Campos de endereço separados para corresponder à sua estrutura
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  };
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (empresa) {
        // Garante que todos os campos do estado existam, mesmo que nulos no objeto 'empresa'
        setFormData({ ...initialState, ...empresa });
      } else {
        setFormData(initialState);
      }
      setError('');
    }
  }, [empresa, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_fantasia) {
      setError('O nome fantasia é obrigatório.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let result;
      // Prepara os dados para salvar, enviando todos os campos do formulário
      const dadosParaSalvar = { ...formData };

      if (empresa?.id) {
        // Modo Edição: Atualiza a empresa existente
        const { data, error: updateError } = await supabase
          .from('crm_empresas')
          .update(dadosParaSalvar)
          .eq('id', empresa.id)
          .select()
          .single();
        if (updateError) throw updateError;
        result = data;
      } else {
        // Modo Criação: Insere uma nova empresa
        const { data, error: insertError } = await supabase
          .from('crm_empresas')
          .insert(dadosParaSalvar)
          .select()
          .single();
        if (insertError) throw insertError;
        result = data;
      }
      
      onSave(result); // Devolve os dados salvos para o componente pai
      onClose(); // Fecha o modal

    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      setError(`Não foi possível salvar as alterações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="nome_fantasia" className="block text-sm font-semibold mb-1">Nome Fantasia*</label><input id="nome_fantasia" name="nome_fantasia" type="text" value={formData.nome_fantasia || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required /></div>
            <div><label htmlFor="razao_social" className="block text-sm font-semibold mb-1">Razão Social</label><input id="razao_social" name="razao_social" type="text" value={formData.razao_social || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="cnpj" className="block text-sm font-semibold mb-1">CNPJ</label><input id="cnpj" name="cnpj" type="text" value={formData.cnpj || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="telefone" className="block text-sm font-semibold mb-1">Telefone</label><input id="telefone" name="telefone" type="tel" value={formData.telefone || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="site" className="block text-sm font-semibold mb-1">Site</label><input id="site" name="site" type="url" placeholder="https://exemplo.com" value={formData.site || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="segmento" className="block text-sm font-semibold mb-1">Segmento</label><input id="segmento" name="segmento" type="text" placeholder="Ex: Contabilidade, Tecnologia" value={formData.segmento || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>

          <hr className="dark:border-gray-600 my-6" />
          
          {/* Endereço Separado */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1"><label htmlFor="cep" className="block text-sm font-semibold mb-1">CEP</label><input id="cep" name="cep" type="text" value={formData.cep || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label htmlFor="rua" className="block text-sm font-semibold mb-1">Rua</label><input id="rua" name="rua" type="text" value={formData.rua || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="numero" className="block text-sm font-semibold mb-1">Número</label><input id="numero" name="numero" type="text" value={formData.numero || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="complemento" className="block text-sm font-semibold mb-1">Complemento</label><input id="complemento" name="complemento" type="text" value={formData.complemento || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="bairro" className="block text-sm font-semibold mb-1">Bairro</label><input id="bairro" name="bairro" type="text" value={formData.bairro || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="cidade" className="block text-sm font-semibold mb-1">Cidade</label><input id="cidade" name="cidade" type="text" value={formData.cidade || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="estado" className="block text-sm font-semibold mb-1">Estado (UF)</label><input id="estado" name="estado" type="text" maxLength="2" value={formData.estado || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2 inline-block" size={16} />}
              {loading ? 'A Salvar...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpresaFormModal;