// src/components/crm/AddNegocioModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import BuscaECria from './BuscaECria'; // Importe o componente de busca

const AddNegocioModal = ({ isOpen, onClose, etapas, onNegocioAdicionado, leadData }) => {
  const { session } = useAuth();
  
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [nomeContatoPrincipal, setNomeContatoPrincipal] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [responsavelId, setResponsavelId] = useState(session?.user?.id || '');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efeito para preencher o formulário se dados de um lead forem passados
  useEffect(() => {
    if (leadData) {
      setTitulo(`Negócio com ${leadData.nome}`);
      setNomeContatoPrincipal(leadData.nome || '');
      // Se houver um nome de empresa no lead, podemos pré-preencher também
      // setNomeEmpresa(leadData.empresa || '');
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

  // Função "upsert": tenta encontrar pelo nome, se não achar, cria um novo.
  const findOrCreate = async (tabela, coluna, valor) => {
    if (!valor || !valor.trim()) return null;
    
    // Tenta encontrar um registro existente (case-insensitive)
    let { data, error } = await supabase.from(tabela).select('id').ilike(coluna, valor.trim()).limit(1).single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignora o erro 'not found'
    
    if (data) return data.id; // Retorna o ID se encontrou

    // Se não encontrou, cria um novo
    // Para 'crm_empresas', a coluna é 'nome_fantasia'
    const insertData = tabela === 'crm_empresas' ? { nome_fantasia: valor.trim() } : { [coluna]: valor.trim() };
    const { data: novoRegistro, error: insertError } = await supabase.from(tabela).insert(insertData).select('id').single();
    if (insertError) throw insertError;
    
    return novoRegistro.id;
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
      // PASSO 1: Encontrar ou criar a Empresa e o Contato
      const empresaId = await findOrCreate('crm_empresas', 'nome_fantasia', nomeEmpresa);
      const contatoId = await findOrCreate('crm_contatos', 'nome', nomeContatoPrincipal);
      
      // PASSO 2: Inserir o novo negócio com o ID da empresa
      const { data: novoNegocio, error: insertError } = await supabase
        .from('crm_negocios')
        .insert({
          titulo,
          valor: valor || null,
          etapa_id: etapaId,
          user_id: session.user.id,
          responsavel_id: responsavelId || null,
          lead_origem_id: leadData?.id || null,
          empresa_id: empresaId,
        })
        .select('*, responsavel:profiles(full_name)')
        .single();

      if (insertError) throw insertError;
      
      // PASSO 3: Se um contato foi criado/encontrado, associá-lo ao negócio
      if (contatoId) {
        const { error: assocError } = await supabase.from('crm_negocio_contatos').insert({
          negocio_id: novoNegocio.id,
          contato_id: contatoId
        });
        if (assocError) throw assocError;
      }
      
      // Se o negócio foi criado a partir de um lead, atualiza o status do lead
      if (leadData?.id) {
          const { error: leadUpdateError } = await supabase
            .from('crm_leads')
            .update({ status: 'Convertido' })
            .eq('id', leadData.id);

          if (leadUpdateError) {
              console.error('Erro ao atualizar status do lead:', leadUpdateError);
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
    setNomeContatoPrincipal('');
    setNomeEmpresa('');
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
                <BuscaECria 
                  tabela="crm_contatos"
                  coluna="nome"
                  placeholder="Busque ou crie um contato"
                  valorInicial={nomeContatoPrincipal}
                  onSelecao={(valor) => setNomeContatoPrincipal(valor)}
                />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Valor (R$)</label>
                <input id="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="etapa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Etapa Inicial*</label>
                <select id="etapa" value={etapaId} onChange={(e) => setEtapaId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:text-gray-200">
                  {etapas.map(etapa => (<option key={etapa.id} value={etapa.id}>{etapa.nome_etapa}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="responsavel" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Responsável</label>
              <select id="responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:text-gray-200">
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