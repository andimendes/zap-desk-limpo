// src/components/crm/PaginaClientes.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, Users, Search, Loader2, PlusCircle } from 'lucide-react';

const PaginaClientes = () => {
  const [activeTab, setActiveTab] = useState('empresas');
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [contatos, setContatos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empresasRes, contatosRes] = await Promise.all([
          supabase.from('crm_empresas').select('*').order('nome_fantasia'),
          supabase.from('crm_contatos').select('*, empresa:crm_empresas(nome_fantasia)').order('nome')
        ]);

        if (empresasRes.error) throw empresasRes.error;
        if (contatosRes.error) throw contatosRes.error;

        setEmpresas(empresasRes.data || []);
        setContatos(contatosRes.data || []);

      } catch (error) {
        console.error("Erro ao buscar dados de clientes:", error);
        alert("Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dadosFiltrados = useMemo(() => {
    if (!termoBusca) {
      return { empresas, contatos };
    }
    const termo = termoBusca.toLowerCase();
    
    const empresasFiltradas = empresas.filter(e => 
      e.nome_fantasia.toLowerCase().includes(termo)
    );
    const contatosFiltrados = contatos.filter(c => 
      c.nome.toLowerCase().includes(termo) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.empresa?.nome_fantasia && c.empresa.nome_fantasia.toLowerCase().includes(termo))
    );

    return { empresas: empresasFiltradas, contatos: contatosFiltrados };
  }, [termoBusca, empresas, contatos]);


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/80 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Clientes e Contatos</h1>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </div>
            <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <PlusCircle size={20} />
                {activeTab === 'empresas' ? 'Nova Empresa' : 'Novo Contato'}
            </button>
        </div>
      </header>

      <div>
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('empresas')}
                    className={`${activeTab === 'empresas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                    <Building size={16} /> Empresas
                </button>
                <button
                    onClick={() => setActiveTab('contatos')}
                    className={`${activeTab === 'contatos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                    <Users size={16} /> Contatos
                </button>
            </nav>
        </div>
        
        <div className="mt-6">
            {loading ? (
                <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    {activeTab === 'empresas' && (
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome da Empresa</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                                {dadosFiltrados.empresas.map(empresa => (
                                    <tr key={empresa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{empresa.nome_fantasia}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'contatos' && (
                         <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefone</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                                {dadosFiltrados.contatos.map(contato => (
                                    <tr key={contato.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{contato.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contato.empresa?.nome_fantasia || '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contato.email || '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contato.telefone || '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaginaClientes;
```

#### **2. Como Integrar a Nova Página**

Agora, você precisa de "ligar" esta nova página ao seu menu.

1.  **Vá para o seu ficheiro de rotas:** Este é, provavelmente, o `App.jsx`, ou onde quer que você defina os caminhos da sua aplicação (por exemplo, `<Route path="/crm" ... />`).
2.  **Adicione uma nova rota:** Importe o novo componente e adicione uma rota para ele. O código será algo parecido com isto:

    ```jsx
    // Dentro do seu ficheiro de rotas (ex: App.jsx)

    import PaginaClientes from './components/crm/PaginaClientes'; // Importe a nova página

    // ...

    <Routes>
      {/* ...suas outras rotas... */}
      <Route path="/clientes" element={<PaginaClientes />} />
      {/* ...suas outras rotas... */}
    </Routes>