// src/components/crm/EmpresaFormModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';

// --- 1. FUNÇÃO DE BUSCA ATUALIZADA PARA RETORNAR DADOS ESTRUTURADOS ---
const buscarDadosExternos = async (tipo, valor) => {
    try {
        let url;
        const valorLimpo = valor.replace(/\D/g, '');

        if (tipo === 'cnpj' && valorLimpo.length === 14) {
            url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.receitaws.com.br/v1/cnpj/${valorLimpo}`)}`;
        } else if (tipo === 'cep' && valorLimpo.length === 8) {
            url = `https://viacep.com.br/ws/${valorLimpo}/json/`;
        } else {
            return { error: `Valor inválido para busca por ${tipo}.` };
        }

        const response = await fetch(url);
        let data = await response.json();

        if (tipo === 'cnpj') {
            data = JSON.parse(data.contents);
            if (data.status === "ERROR") throw new Error(data.message);
            return {
                razao_social: data.nome,
                nome_fantasia: data.fantasia || data.nome,
                cnpj: data.cnpj,
                telefone: data.telefone,
                cep: data.cep?.replace(/\D/g, ''),
                rua: `${data.logradouro}, ${data.numero}`,
                bairro: data.bairro,
                cidade: data.municipio,
                estado: data.uf,
            };
        }
        
        if (data.erro) throw new Error('CEP não encontrado');
        return {
            cep: data.cep?.replace(/\D/g, ''),
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
        };

    } catch (error) {
        console.error(`Erro ao buscar ${tipo}:`, error);
        return { error: error.message };
    }
};

const EmpresaFormModal = ({ isOpen, onClose, onSave, empresa }) => {
  // --- 2. ESTADO DO FORMULÁRIO ATUALIZADO COM OS CAMPOS DE ENDEREÇO ---
  const initialState = {
    nome_fantasia: '', razao_social: '', cnpj: '', telefone: '', site: '', segmento: '',
    cep: '', rua: '', bairro: '', cidade: '', estado: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(null); // 'cnpj' ou 'cep'

  useEffect(() => {
    if (isOpen) {
        if (empresa) {
            // Garante que todos os campos do estado existam, mesmo que nulos na origem
            const empresaData = { ...initialState, ...empresa };
            setFormData(empresaData);
        } else {
            setFormData(initialState);
        }
    }
  }, [empresa, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBusca = async (tipo) => {
      const valor = tipo === 'cnpj' ? formData.cnpj : formData.cep;
      if (!valor) return;

      setBuscando(tipo);
      const dadosEncontrados = await buscarDadosExternos(tipo, valor);
      setBuscando(null);

      if (dadosEncontrados && !dadosEncontrados.error) {
          setFormData(prev => ({ ...prev, ...dadosEncontrados }));
      } else if (dadosEncontrados.error) {
          alert(`Não foi possível buscar os dados: ${dadosEncontrados.error}`);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_fantasia) { setError('O nome da empresa é obrigatório.'); return; }
    setLoading(true); setError('');
    try {
      let result;
      const dadosParaSalvar = { ...formData };
      // Remove campos que não devem ser vazios ou são apenas para controle
      if (!dadosParaSalvar.valor) delete dadosParaSalvar.valor;

      if (empresa?.id) {
        const { data, error: updateError } = await supabase.from('crm_empresas').update(dadosParaSalvar).eq('id', empresa.id).select().single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase.from('crm_empresas').insert(dadosParaSalvar).select().single();
        if (insertError) throw insertError;
        result = data;
      }
      onSave(result);
      onClose();
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
        {/* --- 3. FORMULÁRIO ATUALIZADO COM OS NOVOS CAMPOS --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="nome_fantasia" className="block text-sm font-semibold mb-1">Nome Fantasia*</label><input id="nome_fantasia" name="nome_fantasia" type="text" value={formData.nome_fantasia} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required /></div>
            <div><label htmlFor="razao_social" className="block text-sm font-semibold mb-1">Razão Social</label><input id="razao_social" name="razao_social" type="text" value={formData.razao_social} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          
          <div>
            <label htmlFor="cnpj" className="block text-sm font-semibold mb-1">CNPJ</label>
            <div className="flex gap-2">
                <input id="cnpj" name="cnpj" type="text" value={formData.cnpj} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={() => handleBusca('cnpj')} disabled={buscando} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-semibold disabled:opacity-50 w-28">{buscando === 'cnpj' ? <Loader2 className="animate-spin" /> : 'Buscar'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="telefone" className="block text-sm font-semibold mb-1">Telefone</label><input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label htmlFor="site" className="block text-sm font-semibold mb-1">Site</label><input id="site" name="site" type="url" placeholder="https://exemplo.com" value={formData.site} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          
          <hr className="dark:border-gray-700"/>

          <div>
            <label htmlFor="cep" className="block text-sm font-semibold mb-1">CEP</label>
            <div className="flex gap-2">
                <input id="cep" name="cep" type="text" value={formData.cep} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={() => handleBusca('cep')} disabled={buscando} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-semibold disabled:opacity-50 w-28">{buscando === 'cep' ? <Loader2 className="animate-spin" /> : 'Buscar'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label htmlFor="rua" className="block text-sm font-semibold mb-1">Rua e Número</label><input id="rua" name="rua" type="text" value={formData.rua} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
              <div><label htmlFor="bairro" className="block text-sm font-semibold mb-1">Bairro</label><input id="bairro" name="bairro" type="text" value={formData.bairro} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="cidade" className="block text-sm font-semibold mb-1">Cidade</label><input id="cidade" name="cidade" type="text" value={formData.cidade} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
              <div><label htmlFor="estado" className="block text-sm font-semibold mb-1">Estado (UF)</label><input id="estado" name="estado" type="text" maxLength="2" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>

          <hr className="dark:border-gray-700"/>

          <div><label htmlFor="segmento" className="block text-sm font-semibold mb-1">Segmento</label><input id="segmento" name="segmento" type="text" placeholder="Ex: Tecnologia, Varejo" value={formData.segmento} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>

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