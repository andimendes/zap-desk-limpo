// src/components/crm/PaginaLeads.jsx

import React, { useState, useEffect } from 'react'; // <-- A CORREÇÃO ESTÁ AQUI
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, PlusCircle, User, Building, Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import AddLeadModal from './AddLeadModal';

const PaginaLeads = () => {
  const { session } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Função para buscar os leads
  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar leads:', error);
      setError('Não foi possível carregar os leads.');
    } else {
      setLeads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLeadAdicionado = (novoLead) => {
    setLeads([novoLead, ...leads]);
  };

  const handleConverterEmNegocio = async (lead) => {
    if (!session?.user?.id) {
        alert('Sessão inválida.');
        return;
    }
    if (!window.confirm(`Tem certeza de que deseja converter "${lead.nome}" em um novo negócio?`)) {
        return;
    }

    try {
        // Passo A: Criar o novo negócio
        const { data: novoNegocio, error: negocioError } = await supabase
            .from('crm_negocios')
            .insert({
                titulo: `Negócio ${lead.nome} - ${lead.empresa || ''}`,
                nome_contato: lead.nome,
                empresa_contato: lead.empresa,
                contato_email: lead.email,
                contato_telefone: lead.telefone,
                user_id: session.user.id,
                responsavel_id: session.user.id,
                status: 'Ativo',
                lead_origem_id: lead.id
            })
            .select('id')
            .single();

        if (negocioError) throw negocioError;

        // Passo B: Atualizar o status do lead
        const { error: leadError } = await supabase
            .from('crm_leads')
            .update({ status: 'Convertido' })
            .eq('id', lead.id);

        if (leadError) throw leadError;

        alert(`Lead "${lead.nome}" convertido com sucesso! Um novo negócio foi criado no seu funil de vendas.`);
        
        setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'Convertido' } : l));

    } catch (error) {
        console.error('Erro ao converter lead:', error);
        alert('Ocorreu um erro ao converter o lead. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 inline-block" /></div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/80 min-h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Prospecção de Leads</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Adicionar Lead
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contato</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {leads.length > 0 ? leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><User className="h-5 w-5 text-gray-400 mr-3" /><div className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.nome}</div></div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-500 dark:text-gray-400"><Building className="h-5 w-5 text-gray-400 mr-3" />{lead.empresa || 'N/A'}</div></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'Convertido' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><div className="flex items-center gap-4">{lead.email && <div className="flex items-center gap-1.5"><Mail size={14} /> {lead.email}</div>}{lead.telefone && <div className="flex items-center gap-1.5"><Phone size={14} /> {lead.telefone}</div>}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {lead.status !== 'Convertido' ? (
                    <button onClick={() => handleConverterEmNegocio(lead)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1">
                      Converter <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span className="text-green-600 flex items-center justify-end gap-1 text-xs">
                        <CheckCircle size={14} /> Convertido
                    </span>
                  )}
                </td>
              </tr>
            )) : (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">Nenhum lead encontrado.</td></tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onLeadAdicionado={handleLeadAdicionado} />
    </>
  );
};

export default PaginaLeads;