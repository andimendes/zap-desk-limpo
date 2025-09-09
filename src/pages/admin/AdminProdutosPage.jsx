import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, Edit, PlusCircle, AlertTriangle } from 'lucide-react';

const AdminProdutosPage = () => {
  const { profile } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProdutos = useCallback(async () => {
    if (!profile?.tenant_id) {
        setLoading(false);
        return;
    };
    setLoading(true);
    setFeedback({ type: '', message: '' });
    const { data, error } = await supabase
      .from('produtos_servicos')
      .select('*')
      .eq('tenant_id', profile.tenant_id) // LÓGICA SAAS
      .order('nome', { ascending: true });

    if (error) {
      setFeedback({ type: 'error', message: 'Não foi possível carregar os produtos.' });
    } else {
      setProdutos(data);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const resetForm = () => {
    setNome(''); setDescricao(''); setPreco('');
    setEditingProduto(null); setIsFormOpen(false);
  };

  const handleEditClick = (produto) => {
    setEditingProduto(produto); setNome(produto.nome);
    setDescricao(produto.descricao || ''); setPreco(produto.preco_padrao);
    setIsFormOpen(true);
  };
  
  const handleDeleteClick = async (id) => {
    if (window.confirm('Tem a certeza que quer apagar este item?')) {
      const { error } = await supabase.from('produtos_servicos').delete().eq('id', id).eq('tenant_id', profile.tenant_id); // LÓGICA SAAS
      if (error) {
        setFeedback({ type: 'error', message: 'Erro ao apagar o item.' });
      } else {
        fetchProdutos();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.tenant_id) {
        setFeedback({ type: 'error', message: 'Sessão inválida.' });
        return;
    }
    setIsSubmitting(true);
    const produtoData = {
      nome,
      descricao,
      preco_padrao: preco,
      tenant_id: profile.tenant_id, // LÓGICA SAAS
    };

    let error;
    if (editingProduto) {
      ({ error } = await supabase.from('produtos_servicos').update(produtoData).eq('id', editingProduto.id).eq('tenant_id', profile.tenant_id)); // LÓGICA SAAS
    } else {
      ({ error } = await supabase.from('produtos_servicos').insert(produtoData));
    }

    if (error) {
        setFeedback({ type: 'error', message: `Erro ao salvar o item: ${error.message}` });
    } else {
      resetForm();
      fetchProdutos();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Catálogo de Produtos e Serviços</h1>
        <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <PlusCircle size={18} /> Novo Item
        </button>
      </div>

      {feedback.message && (
        <div className={`mb-4 p-4 rounded-md flex items-center gap-3 ${feedback.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 'bg-green-100 border-l-4 border-green-500 text-green-700'}`}>
            <AlertTriangle className="h-6 w-6" /> <p>{feedback.message}</p>
        </div>
      )}

      {isFormOpen && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4">{editingProduto ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nome" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome do Item</label>
                <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
              </div>
              <div>
                <label htmlFor="preco" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Preço Padrão (R$)</label>
                <input id="preco" type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="descricao" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Descrição</label>
              <textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows="3" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"></textarea>
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-blue-300">
                {isSubmitting ? 'A Salvar...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {produtos.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{p.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco_padrao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditClick(p)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteClick(p.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProdutosPage;
