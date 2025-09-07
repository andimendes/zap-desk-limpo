// src/components/crm/ContatoFormModal.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, X, Search, PlusCircle, Link as LinkIcon, MessageSquare } from 'lucide-react';

const TransferList = ({ allItems, selectedItems, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedIds = new Set(selectedItems.map(item => item.value));
  
  const availableItems = useMemo(() => {
    return allItems
      .filter(item => !selectedIds.has(item.value))
      .filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allItems, selectedIds, searchTerm]);

  const handleSelect = (item) => onSelectionChange([...selectedItems, item]);
  const handleDeselect = (itemToRemove) => onSelectionChange(selectedItems.filter(item => item.value !== itemToRemove.value));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex flex-col">
        <label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Empresas Disponíveis</label>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <ul className="flex-1 overflow-y-auto h-48 border dark:border-gray-600 rounded-lg p-2 space-y-1">
          {availableItems.length > 0 ? availableItems.map(item => (
            <li key={item.value} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
              <span className="text-sm">{item.label}</span>
              <button type="button" onClick={() => handleSelect(item)} className="text-blue-500 hover:text-blue-700" title={`Vincular ${item.label}`}><PlusCircle size={18} /></button>
            </li>
          )) : <li className="text-center text-sm text-gray-500 p-4">Nenhuma empresa encontrada.</li>}
        </ul>
      </div>
      <div className="flex flex-col">
        <label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Empresas Vinculadas ({selectedItems.length})</label>
        <div className="flex-1 overflow-y-auto h-48 border dark:border-gray-600 rounded-lg p-2 space-y-1 bg-white dark:bg-gray-700">
           {selectedItems.length > 0 ? selectedItems.map(item => (
            <li key={item.value} className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-900/30">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-100">{item.label}</span>
              <button type="button" onClick={() => handleDeselect(item)} className="text-red-500 hover:text-red-700" title={`Desvincular ${item.label}`}><X size={18} /></button>
            </li>
           )) : <li className="text-center text-sm text-gray-500 p-4">Nenhuma empresa vinculada.</li>}
        </div>
      </div>
    </div>
  );
};

const ContatoFormModal = ({ isOpen, onClose, onSave, contato, empresaIdInicial }) => {
  const initialState = {
    nome: '', email: '', telefone: '', cargo: '',
    linkedin: '', instagram: '', facebook: '', anotacoes: '',
  };
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState([]);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setError('');
      const { data: ed } = await supabase.from('crm_empresas').select('id, nome_fantasia');
      const options = ed.map(e => ({ value: e.id, label: e.nome_fantasia }));
      setEmpresasDisponiveis(options);
      if (contato?.id) {
        // Limpa a propriedade 'empresasVinculadas' que vem do componente pai
        const { empresasVinculadas, ...contatoLimpo } = contato;
        setFormData({ ...initialState, ...contatoLimpo });

        const { data: vd } = await supabase.from('empresa_contato_junction').select('empresa_id').eq('contato_id', contato.id);
        const vIds = vd.map(v => v.empresa_id);
        setEmpresasSelecionadas(options.filter(opt => vIds.includes(opt.value)));
      } else {
        setFormData(initialState);
        setEmpresasSelecionadas(options.filter(opt => opt.value === empresaIdInicial));
      }
    };
    loadData();
  }, [isOpen, contato, empresaIdInicial]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) { setError('O nome do contato é obrigatório.'); return; }
    setLoading(true);
    setError('');
    try {
      // --- CORREÇÃO AQUI ---
      // Usamos a desestruturação para remover a propriedade 'empresasVinculadas'
      // antes de enviar o objeto para a base de dados.
      const { empresasVinculadas, ...dadosParaSalvar } = formData;

      let contatoSalvo;
      if (contato?.id) {
        const { data, error } = await supabase.from('crm_contatos').update(dadosParaSalvar).eq('id', contato.id).select().single();
        if (error) throw error;
        contatoSalvo = data;
      } else {
        const { data, error } = await supabase.from('crm_contatos').insert(dadosParaSalvar).select().single();
        if (error) throw error;
        contatoSalvo = data;
      }
      
      const contatoId = contatoSalvo.id;
      await supabase.from('empresa_contato_junction').delete().eq('contato_id', contatoId);
      if (empresasSelecionadas.length > 0) {
        await supabase.from('empresa_contato_junction').insert(empresasSelecionadas.map(emp => ({ contato_id: contatoId, empresa_id: emp.value })));
      }
      
      onSave(contatoSalvo);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar contato:', err);
      setError(`Não foi possível salvar as alterações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{contato ? 'Editar Contato' : 'Novo Contato'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"><X size={20} /></button>
        </header>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
          <fieldset>
            <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Informações Principais</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="nome" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Nome*</label><input id="nome" name="nome" type="text" value={formData.nome || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required /></div>
              <div><label htmlFor="cargo" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Cargo</label><input id="cargo" name="cargo" type="text" value={formData.cargo || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
              <div><label htmlFor="email" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">E-mail</label><input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
              <div><label htmlFor="telefone" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Telefone</label><input id="telefone" name="telefone" type="tel" value={formData.telefone || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><LinkIcon size={20}/> Redes Sociais e Outros</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label htmlFor="linkedin" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">LinkedIn</label><input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
                <div><label htmlFor="instagram" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Instagram</label><input id="instagram" name="instagram" type="text" placeholder="@usuario" value={formData.instagram || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
                <div><label htmlFor="facebook" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Facebook</label><input id="facebook" name="facebook" type="url" placeholder="https://facebook.com/..." value={formData.facebook || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
            </div>
            <div className="mt-4">
                <label htmlFor="anotacoes" className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200 flex items-center gap-2"><MessageSquare size={16}/> Anotações</label>
                <textarea id="anotacoes" name="anotacoes" value={formData.anotacoes || ''} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" placeholder="Informações adicionais sobre o contato..."></textarea>
            </div>
          </fieldset>
          <fieldset>
             <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Vincular Empresas</legend>
             <TransferList allItems={empresasDisponiveis} selectedItems={empresasSelecionadas} onSelectionChange={setEmpresasSelecionadas} />
          </fieldset>
          <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2 inline-block" size={16} />}
              {loading ? 'A Guardar...' : 'Salvar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContatoFormModal;