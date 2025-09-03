// src/pages/ProspeccaoPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { Building, Users, Search, Loader2, PlusCircle, Star, Lightbulb } from 'lucide-react';
import EmpresaDetalhesModal from '../components/crm/EmpresaDetalhesModal';

const ProspeccaoPage = () => {
  const [activeTab, setActiveTab] = useState('potenciais'); 
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [contatos, setContatos] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [potenciais, setPotenciais] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');

  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empresasRes, contatosRes, prospectsRes, negociosRes] = await Promise.all([
          supabase.from('crm_empresas').select('*').order('nome_fantasia'),
          supabase.from('crm_contatos').select('*, empresa:crm_empresas(nome_fantasia)').order('nome'),
          supabase
            .from('crm_empresas')
            .select('id, nome_fantasia, crm_negocios!inner(status)')
            .eq('crm_negocios.status', 'Ativo'),
          supabase.from('crm_negocios').select('empresa_id').not('empresa_id', 'is', null)
        ]);

        if (empresasRes.error) throw empresasRes.error;
        if (contatosRes.error) throw contatosRes.error;
        if (prospectsRes.error) throw prospectsRes.error;
        if (negociosRes.error) throw negociosRes.error;

        const prospectsUnicos = [...new Map(prospectsRes.data.map(item => [item.id, item])).values()];
        setProspects(prospectsUnicos || []);
        
        const todasAsEmpresas = empresasRes.data || [];
        setEmpresas(todasAsEmpresas);
        setContatos(contatosRes.data || []);
        
        const idsEmpresasComNegocio = new Set(negociosRes.data.map(n => n.empresa_id));
        const empresasPotenciais = todasAsEmpresas.filter(empresa => !idsEmpresasComNegocio.has(empresa.id));
        setPotenciais(empresasPotenciais);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dadosFiltrados = useMemo(() => {
    if (!termoBusca) {
      return { empresas, contatos, prospects, potenciais };
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
    const prospectsFiltrados = prospects.filter(p =>
      p.nome_fantasia.toLowerCase().includes(termo)
    );
    const potenciaisFiltrados = potenciais.filter(p =>
      p.nome_fantasia.toLowerCase().includes(termo)
    );

    return { empresas: empresasFiltradas, contatos: contatosFiltrados, prospects: prospectsFiltrados, potenciais: potenciaisFiltrados };
  }, [termoBusca, empresas, contatos, prospects, potenciais]);

  const handleAbrirDetalhes = (empresa) => {
    setEmpresaSelecionada(empresa);
    setIsDetalhesOpen(true);
  };

  const handleFecharDetalhes = () => {
    setIsDetalhesOpen(false);
    setEmpresaSelecionada(null);
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/80 min-h-full">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Base de Prospecção</h1>
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
                  Nova Empresa
              </button>
          </div>
        </header>

        <div>
          <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                      onClick={() => setActiveTab('potenciais')}
                      className={`${activeTab === 'potenciais' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                      <Lightbulb size={16} /> Potenciais
                  </button>
                  <button
                      onClick={() => setActiveTab('prospects')}
                      className={`${activeTab === 'prospects' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                      <Star size={16} /> Prospects
                  </button>
              </nav>
          </div>
          
          <div className="mt-6">
              {loading ? (
                  <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin inline-block text-blue-500" /></div>
              ) : (
                  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                      {activeTab === 'potenciais' && (
                          <table className="min-w-full divide-y dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresas sem Negócios Abertos</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                                  {dadosFiltrados.potenciais.map(potencial => (
                                      <tr key={potencial.id} onClick={() => handleAbrirDetalhes(potencial)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{potencial.nome_fantasia}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                      {activeTab === 'prospects' && (
                          <table className="min-w-full divide-y dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresas com Negócios Ativos</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                                  {dadosFiltrados.prospects.map(prospect => (
                                      <tr key={prospect.id} onClick={() => handleAbrirDetalhes(prospect)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{prospect.nome_fantasia}</td>
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

      {isDetalhesOpen && (
        <EmpresaDetalhesModal 
          isOpen={isDetalhesOpen}
          onClose={handleFecharDetalhes}
          empresa={empresaSelecionada}
        />
      )}
    </>
  );
};

export default ProspeccaoPage;