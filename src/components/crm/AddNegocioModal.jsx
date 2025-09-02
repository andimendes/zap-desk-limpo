// src/components/crm/AddNegocioModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// O modal agora aceita uma nova prop opcional: 'leadData'
const AddNegocioModal = ({ isOpen, onClose, etapas, onNegocioAdicionado, leadData }) => {
  const { session } = useAuth();
  
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [empresaContato, setEmpresaContato] = useState('');
  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [responsavelId, setResponsavelId] = useState(session?.user?.id || '');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efeito para preencher o formulário se dados de um lead forem passados
  useEffect(() => {
    if (leadData) {
      setTitulo(`Negócio ${leadData.nome} - ${leadData.empresa || ''}`);
      setNomeContato(leadData.nome || '');
      setEmpresaContato(leadData.empresa || '');
    }
  }, [leadData]);


  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name', { ascending: true });
        if (error) {
          console.error('Erro ao buscar utilizadores:', error);
          setError('Não foi possível carregar a lista de responsáveis.');
        } else {
          setListaDeUsers(data);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !etapaId) {
      setError('O título e a etapa são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: novoNegocio, error: insertError } = await supabase
        .from('crm_negocios')
        .insert({
          titulo,
          valor: valor || null,
          nome_contato: nomeContato,
          empresa_contato: empresaContato,
          etapa_id: etapaId,
          user_id: session.user.id,
          responsavel_id: responsavelId || null,
          lead_origem_id: leadData?.id || null // Guarda o ID do lead de origem, se houver
        })
        .select('*, responsavel:profiles(full_name)')
        .single();

      if (insertError) throw insertError;
      
      // Se o negócio foi criado a partir de um lead, atualiza o status do lead
      if (leadData?.id) {
          const { error: leadUpdateError } = await supabase
            .from('crm_leads')
            .update({ status: 'Convertido' })
            .eq('id', leadData.id);

          if (leadUpdateError) {
              alert('Negócio criado com sucesso, mas houve um erro ao atualizar o status do lead.');
          }
      }

      onNegocioAdicionado(novoNegocio, leadData?.id);
      handleClose();

    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      setError('Não foi possível adicionar o negócio.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitulo('');
    setValor('');
    setNomeContato('');
    setEmpresaContato('');
    setEtapaId(etapas.length > 0 ? etapas[0].id : '');
    setResponsavelId(session?.user?.id || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{leadData ? 'Converter Lead em Negócio' : 'Adicionar Novo Negócio'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Título do Negócio*</label>
              <input id="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nomeContato" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome do Contacto</label>
                <input id="nomeContato" type="text" value={nomeContato} onChange={(e) => setNomeContato(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="empresaContato" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
                <input id="empresaContato" type="text" value={empresaContato} onChange={(e) => setEmpresaContato(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Valor (R$)</label>
                <input id="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="etapa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Etapa Inicial*</label>
                <select id="etapa" value={etapaId} onChange={(e) => setEtapaId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {etapas.map(etapa => (<option key={etapa.id} value={etapa.id}>{etapa.nome_etapa}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="responsavel" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Responsável</label>
              <select id="responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Selecione...</option>
                {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
              </select>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-200" disabled={loading}>Cancelar</button>
              <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
                {loading ? 'A Guardar...' : 'Salvar Negócio'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddNegocioModal;