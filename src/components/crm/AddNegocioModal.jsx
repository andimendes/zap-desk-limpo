// src/components/crm/AddNegocioModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import BuscaECria from './BuscaECria';
import { Loader2 } from 'lucide-react';

const AddNegocioModal = ({ isOpen, onClose, etapas = [], onNegocioAdicionado, leadData }) => {
  const { session } = useAuth();
  
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  // --- 1. ESTADOS PARA GUARDAR OBJETOS COMPLETOS, NÃO APENAS NOMES ---
  const [contatoSelecionado, setContatoSelecionado] = useState(null); // { id, nome }
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null); // { id, nome_fantasia }

  const [etapaId, setEtapaId] = useState(etapas.length > 0 ? etapas[0].id : '');
  const [responsavelId, setResponsavelId] = useState(session?.user?.id || '');
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leadData) {
      setTitulo(`Negócio com ${leadData.nome}`);
      // Se tivermos dados do lead, podemos pré-selecionar
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

  // --- 2. FUNÇÃO GENÉRICA E ROBUSTA PARA ENCONTRAR OU CRIAR REGISTOS ---
  const findOrCreate = async (tabela, coluna, valor) => {
    if (!valor || !valor.trim()) return null;

    // Busca pelo valor exato (case-insensitive)
    let { data, error } = await supabase.from(tabela).select('id').ilike(coluna, valor.trim()).limit(1).single();
    
    // Se encontrou, retorna o ID
    if (data) return data.id;

    // Se não encontrou (e o erro é o esperado 'PGRST116'), cria um novo
    if (error && error.code === 'PGRST116') {
      const insertData = { [coluna]: valor.trim() };
      // Se for uma empresa, define o status inicial como 'Potencial'
      if (tabela === 'crm_empresas') {
        insertData.status = 'Potencial';
      }

      const { data: novoRegistro, error: insertError } = await supabase.from(tabela).insert(insertData).select('id').single();
      if (insertError) throw insertError; // Lança erro se a inserção falhar
      return novoRegistro.id;
    }
    
    // Se for qualquer outro erro na busca, lança-o
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
      // --- 3. USA OS NOMES DOS ESTADOS PARA OBTER OS IDs ---
      const empresaId = await findOrCreate('crm_empresas', 'nome_fantasia', empresaSelecionada?.nome_fantasia);
      const contatoId = await findOrCreate('crm_contatos', 'nome', contatoSelecionado?.nome);

      // Se um contato foi criado/encontrado, e uma empresa também, vincula o contato à empresa
      if (contatoId && empresaId) {
        await supabase.from('crm_contatos').update({ empresa_id: empresaId }).eq('id', contatoId);
      }
      
      const { data: novoNegocio, error: insertError } = await supabase
        .from('crm_negocios')
        .insert({
          titulo,
          valor: valor || null,
          etapa_id: etapaId,
          user_id: session.user.id,
          responsavel_id: responsavelId || null,
          lead_origem_id: leadData?.id || null,
          empresa_id: empresaId, // Vincula a empresa ao negócio
        })
        .select('*, responsavel:profiles(full_name)')
        .single();
      if (insertError) throw insertError;
      
      // Vincula o contato ao negócio
      if (contatoId) {
        await supabase.from('crm_negocio_contatos').insert({ negocio_id: novoNegocio.id, contato_id: contatoId });
      }
      
      // Atualiza o status do Lead, se aplicável
      if (leadData?.id) {
          await supabase.from('crm_leads').update({ status: 'Convertido' }).eq('id', leadData.id);
      }

      onNegocioAdicionado(novoNegocio, leadData?.id);
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
            
            {/* --- 4. O BUSCAECRIA AGORA ATUALIZA OS ESTADOS DE OBJETOS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Pessoa de Contato</label>
                <BuscaECria tabela="crm_contatos" coluna="nome" placeholder="Busque ou crie um contato" valorInicial={contatoSelecionado?.nome} onSelecao={(valor) => setContatoSelecionado({ nome: valor })} />
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