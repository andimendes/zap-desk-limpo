// src/components/crm/AddNegocioModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AddNegocioModal = ({ isOpen, onClose, etapas, onNegocioAdicionado, leadData }) => {
  const { session } = useAuth();
  
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  // NOVOS ESTADOS para guardar os nomes que serão usados para buscar/criar
  const [nomeContatoPrincipal, setNomeContatoPrincipal] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  
  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [responsavelId, setResponsavelId] = useState(session?.user?.id || '');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leadData) {
      // Já pegamos o nome do contato direto do lead
      setNomeContatoPrincipal(leadData.nome || '');
      // Sugerimos um título, mas o nome da empresa agora é um campo separado
      setTitulo(`Negócio com ${leadData.nome}`);
    }
  }, [leadData]);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => { /* ...código inalterado... */ };
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
    const { data: novoRegistro, error: insertError } = await supabase.from(tabela).insert({ [coluna]: valor.trim() }).select('id').single();
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
          empresa_id: empresaId, // <-- AQUI!
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
      
      if (leadData?.id) { /* ...código de atualização do lead inalterado... */ }

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
    // Limpa os novos estados
    setNomeContatoPrincipal('');
    setNomeEmpresa('');
    setEtapaId(etapas.length > 0 ? etapas[0].id : '');
    setResponsavelId(session?.user?.id || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    // O JSX (visual) do formulário precisa ser atualizado para refletir as novas variáveis de estado.
    // Troque os inputs de 'nomeContato' e 'empresaContato' para 'nomeContatoPrincipal' e 'nomeEmpresa'.
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{leadData ? 'Converter Lead em Negócio' : 'Adicionar Novo Negócio'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Título do Negócio*</label>
              <input id="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            {/* CAMPOS ATUALIZADOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nomeContatoPrincipal" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Pessoa de Contato</label>
                <input id="nomeContatoPrincipal" type="text" value={nomeContatoPrincipal} onChange={(e) => setNomeContatoPrincipal(e.target.value)} placeholder="Busque ou crie um contato" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="nomeEmpresa" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Empresa</label>
                <input id="nomeEmpresa" type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Busque ou crie uma empresa" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
            {/* RESTANTE DO FORMULÁRIO INALTERADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ... Campos de Valor e Etapa ... */}
            </div>
            <div>
                {/* ... Campo de Responsável ... */}
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                {/* ... Botões ... */}
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddNegocioModal;