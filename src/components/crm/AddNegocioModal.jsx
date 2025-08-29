// src/components/crm/AddNegocioModal.jsx
import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AddNegocioModal = ({ isOpen, onClose, etapas, onNegocioAdicionado }) => {
  const { session } = useAuth(); // <-- 1. CORREÇÃO: Obter o objeto 'session'
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [empresaContato, setEmpresaContato] = useState('');
  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !etapaId) {
      setError('O título e a etapa são obrigatórios.');
      return;
    }
    
    // Verificação de segurança para garantir que o utilizador está logado
    if (!session?.user?.id) {
      setError('Sessão de utilizador inválida. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('crm_negocios')
        .insert({
          titulo,
          valor: valor || null,
          nome_contato: nomeContato,
          empresa_contato: empresaContato,
          etapa_id: etapaId,
          user_id: session.user.id, // <-- 2. CORREÇÃO: Usar session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      onNegocioAdicionado(data); // Envia o novo negócio de volta para o CrmBoard
      handleClose();
    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      setError('Não foi possível adicionar o negócio. Verifique as permissões da base de dados (RLS).');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetar o formulário
    setTitulo('');
    setValor('');
    setNomeContato('');
    setEmpresaContato('');
    setEtapaId(etapas.length > 0 ? etapas[0].id : '');
    setError('');
    onClose(); // Fecha o modal
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Adicionar Novo Negócio</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="titulo" className="block text-gray-700 font-semibold mb-2">Título do Negócio</label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="nomeContato" className="block text-gray-700 font-semibold mb-2">Nome do Contacto</label>
              <input
                id="nomeContato"
                type="text"
                value={nomeContato}
                onChange={(e) => setNomeContato(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="empresaContato" className="block text-gray-700 font-semibold mb-2">Empresa</label>
              <input
                id="empresaContato"
                type="text"
                value={empresaContato}
                onChange={(e) => setEmpresaContato(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="valor" className="block text-gray-700 font-semibold mb-2">Valor (R$)</label>
              <input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="etapa" className="block text-gray-700 font-semibold mb-2">Etapa Inicial</label>
              <select
                id="etapa"
                value={etapaId}
                onChange={(e) => setEtapaId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {etapas.map(etapa => (
                  <option key={etapa.id} value={etapa.id}>{etapa.nome_etapa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'A Adicionar...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNegocioModal;
