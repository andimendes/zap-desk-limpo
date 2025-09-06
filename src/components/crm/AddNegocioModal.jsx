// src/components/crm/AddNegocioModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
// 1. IMPORTAMOS O NOSSO SERVIÇO CENTRALIZADO
import { createNegocio } from '@/services/negocioService';
import BuscaECria from './BuscaECria';
import { Loader2 } from 'lucide-react';

const AddNegocioModal = ({ isOpen, onClose, etapas = [], onNegocioAdicionado, leadData }) => {
  const { session } = useAuth();
  
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState(null); // { nome }
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null); // { nome_fantasia }

  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [responsavelId, setResponsavelId] = useState(session?.user?.id || '');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leadData) {
      setTitulo(`Negócio com ${leadData.nome}`);
      setContatoSelecionado({ nome: leadData.nome || '' });
    }
  }, [leadData]);

  useEffect(() => {
    if (isOpen) {
      if (etapas.length > 0 && !etapas.find(e => e.id === etapaId)) {
        setEtapaId(etapas[0].id);
      }
      
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name', { ascending: true });
        if (error) console.error('Erro ao buscar utilizadores:', error);
        else setListaDeUsers(data || []);
      };
      fetchUsers();
    }
  }, [isOpen, etapas, etapaId]);

  // Função auxiliar para encontrar ou criar um registo (Empresa ou Contato)
  const findOrCreate = async (tabela, coluna, valor, extraData = {}) => {
    if (!valor || !valor.trim()) return null;

    let { data, error } = await supabase.from(tabela).select('id').ilike(coluna, valor.trim()).limit(1).single();
    
    if (data) return data.id;

    if (error && error.code === 'PGRST116') {
      const insertData = { [coluna]: valor.trim(), ...extraData };
      const { data: novoRegistro, error: insertError } = await supabase.from(tabela).insert(insertData).select('id').single();
      if (insertError) throw insertError;
      return novoRegistro.id;
    }
    
    if (error) throw error;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !etapaId) {
      setError('O título e a etapa são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Usa a função auxiliar para obter os IDs da empresa e do contato, criando-os se necessário
      const empresaId = await findOrCreate('crm_empresas', 'nome_fantasia', empresaSelecionada?.nome_fantasia, { status: 'Potencial' });
      // 2. CORREÇÃO: Apontamos para a tabela 'contatos' e a coluna 'name'
      const contatoId = await findOrCreate('contatos', 'name', contatoSelecionado?.nome, { empresa_id: empresaId });

      // Se um contato foi encontrado mas não tinha empresa, e uma empresa foi selecionada, faz a ligação
      if (contatoId && empresaId) {
          const { data: contactData } = await supabase.from('contatos').select('empresa_id').eq('id', contatoId).single();
          if (contactData && !contactData.empresa_id) {
              await supabase.from('contatos').update({ empresa_id: empresaId }).eq('id', contatoId);
          }
      }

      // Prepara o objeto do negócio com todos os dados necessários
      const negocioData = {
        titulo,
        valor: valor || null,
        etapa_id: etapaId,
        user_id: session.user.id,
        responsavel_id: responsavelId || null,
        status: 'Ativo',
        empresa_id: empresaId, // Associa a empresa
        contato_id: contatoId,   // Associa o contato diretamente
      };
      
      // Chama a função centralizada do nosso serviço para criar o negócio
      const { data: novoNegocio, error: insertError } = await createNegocio(negocioData);

      if (insertError) throw insertError;
      
      onNegocioAdicionado(novoNegocio);
      handleClose();

    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      setError(`Não foi possível adicionar o negócio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitulo('');
    setValor('');
    setContatoSelecionado(null);
    setEmpresaSelecionada(null);
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
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Pessoa de Contato</label>
                 {/* 3. CORREÇÃO: Apontamos o BuscaECria para a tabela 'contatos' e a coluna 'name' */}
                <BuscaECria tabela="contatos" coluna="name" placeholder="Busque ou crie um contato" valorInicial={contatoSelecionado?.nome} onSelecao={(valor) => setContatoSelecionado({ nome: valor })} />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
                <BuscaECria tabela="crm_empresas" coluna="nome_fantasia" placeholder="Busque ou crie uma empresa" valorInicial={empresaSelecionada?.nome_fantasia} onSelecao={(valor) => setEmpresaSelecionada({ nome_fantasia: valor })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Valor (R$)</label>
                <input id="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="etapa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Etapa Inicial*</label>
                <select id="etapa" value={etapaId} onChange={(e) => setEtapaId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:text-gray-200" required>
                  {etapas.map(etapa => (<option key={etapa.id} value={etapa.id}>{etapa.nome_etapa}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="responsavel" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Responsável</label>
              <select id="responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:text-gray-200">
                <option value="">Ninguém atribuído</option>
                {listaDeUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
              </select>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-200" disabled={loading}>Cancelar</button>
              <button type="submit" className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold disabled:bg-blue-300" disabled={loading}>
                {loading && <Loader2 className="animate-spin inline-block mr-2" />}
                {loading ? 'A Guardar...' : 'Salvar Negócio'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddNegocioModal;