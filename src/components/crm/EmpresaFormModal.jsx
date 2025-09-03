// src/components/crm/EmpresaFormModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';

// Função para buscar endereço (pode ser movida para um arquivo de 'utils' no futuro)
const buscarEndereco = async (tipo, valor) => {
    try {
        let url;
        if (tipo === 'cnpj') {
            // Usaremos um proxy CORS para acessar a API da ReceitaWS
            url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.receitaws.com.br/v1/cnpj/${valor.replace(/\D/g, '')}`)}`;
        } else if (tipo === 'cep') {
            url = `https://viacep.com.br/ws/${valor.replace(/\D/g, '')}/json/`;
        } else {
            return null;
        }

        const response = await fetch(url);
        let data = await response.json();

        // Tratamento para o proxy CORS
        if (tipo === 'cnpj') {
            data = JSON.parse(data.contents);
            if (data.status === "ERROR") throw new Error(data.message);
            return {
                razao_social: data.nome,
                nome_fantasia: data.fantasia || data.nome,
                cnpj: data.cnpj,
                telefone: data.telefone,
                endereco: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`
            };
        }
        
        // Tratamento para ViaCEP
        if (data.erro) throw new Error('CEP não encontrado');
        return {
            endereco: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${data.cep}`
        };

    } catch (error) {
        console.error(`Erro ao buscar ${tipo}:`, error);
        return null;
    }
};


const EmpresaFormModal = ({ isOpen, onClose, onSave, empresa }) => {
  const [formData, setFormData] = useState({ nome_fantasia: '', razao_social: '', cnpj: '', telefone: '', site: '', endereco: '', segmento: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (empresa) setFormData({ nome_fantasia: empresa.nome_fantasia || '', razao_social: empresa.razao_social || '', cnpj: empresa.cnpj || '', telefone: empresa.telefone || '', site: empresa.site || '', endereco: empresa.endereco || '', segmento: empresa.segmento || '' });
    else setFormData({ nome_fantasia: '', razao_social: '', cnpj: '', telefone: '', site: '', endereco: '', segmento: '' });
  }, [empresa, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscaAutomatica = useCallback(async () => {
      const { cnpj, endereco } = formData;
      let dadosEncontrados = null;
      setBuscando(true);

      if (cnpj && cnpj.replace(/\D/g, '').length === 14) {
          dadosEncontrados = await buscarEndereco('cnpj', cnpj);
      } else if (!dadosEncontrados && endereco && endereco.replace(/\D/g, '').length === 8) {
          dadosEncontrados = await buscarEndereco('cep', endereco);
      }

      if (dadosEncontrados) {
          setFormData(prev => ({ ...prev, ...dadosEncontrados }));
      }
      setBuscando(false);
  }, [formData.cnpj, formData.endereco]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_fantasia) { setError('O nome da empresa é obrigatório.'); return; }
    setLoading(true); setError('');
    try {
      let result;
      if (empresa?.id) {
        const { data, error: updateError } = await supabase.from('crm_empresas').update(formData).eq('id', empresa.id).select().single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase.from('crm_empresas').insert(formData).select().single();
        if (insertError) throw insertError;
        result = data;
      }
      onSave(result);
      onClose();
    } catch (error) { console.error('Erro ao salvar empresa:', error); setError('Não foi possível salvar as alterações.'); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="nome_fantasia" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome Fantasia*</label><input id="nome_fantasia" name="nome_fantasia" type="text" value={formData.nome_fantasia} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required /></div>
            <div><label htmlFor="razao_social" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Razão Social</label><input id="razao_social" name="razao_social" type="text" value={formData.razao_social} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          
          <div>
            <label htmlFor="cnpj" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">CNPJ</label>
            <div className="flex gap-2">
                <input id="cnpj" name="cnpj" type="text" value={formData.cnpj} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={handleBuscaAutomatica} disabled={buscando} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-semibold disabled:opacity-50">{buscando ? <Loader2 className="animate-spin" /> : 'Buscar'}</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="telefone" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label><input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="site" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Site</label><input id="site" name="site" type="url" placeholder="https://exemplo.com" value={formData.site} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          
          <div>
            <label htmlFor="endereco" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">CEP ou Endereço Completo</label>
             <div className="flex gap-2">
                <input id="endereco" name="endereco" type="text" placeholder="Digite o CEP para buscar" value={formData.endereco} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                 <button type="button" onClick={handleBuscaAutomatica} disabled={buscando} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-semibold disabled:opacity-50">{buscando ? <Loader2 className="animate-spin" /> : 'Buscar'}</button>
            </div>
          </div>

          <div><label htmlFor="segmento" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Segmento</label><input id="segmento" name="segmento" type="text" placeholder="Ex: Tecnologia, Varejo" value={formData.segmento} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>{loading && <Loader2 className="animate-spin mr-2" size={16} />}{loading ? 'A Salvar...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpresaFormModal;