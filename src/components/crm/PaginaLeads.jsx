// src/components/crm/PaginaLeads.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, PlusCircle, User, Building, Mail, Phone, ArrowRight, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import AddLeadModal from './AddLeadModal';
import AddNegocioModal from './AddNegocioModal';
// O EditLeadModal será substituído por um EditContactModal no futuro.

const PaginaLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  
  const [leadParaConverter, setLeadParaConverter] = useState(null);
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);


  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      // Query atualizada para buscar os leads e os dados dos contatos relacionados
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*, crm_contatos(*)') // <-- A GRANDE MUDANÇA ESTÁ AQUI
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads:', error);
        setError('Não foi possível carregar os leads.');
      } else {
        setLeads(data);
      }
      setLoading(false);
    };
    fetchLeads();

    const fetchEtapas = async () => {
      const { data: funis } = await supabase.from('crm_funis').select('id').limit(1).single();
      if(funis) {
          const { data: etapas } = await supabase.from('crm_etapas').select('*').eq('funil_id', funis.id).order('ordem');
          setEtapasDoFunil(etapas || []);
      }
    };
    fetchEtapas();
  }, []);

  const handleLeadAdicionado = (novoLead) => {
    setLeads([novoLead, ...leads]);
  };

  const handleDeletarLead = async (lead) => {
    if (window.confirm(`Tem certeza de que deseja apagar o lead de "${lead.crm_contatos.nome}"?`)) {
        // Primeiro apaga o lead, depois o contato.
        const { error: leadError } = await supabase.from('crm_leads').delete().eq('id', lead.id);
        if(leadError) return alert('Erro ao apagar o lead.');

        const { error: contatoError } = await supabase.from('crm_contatos').delete().eq('id', lead.contato_id);
        if(contatoError) return alert('Lead apagado, mas houve erro ao apagar o contato associado.');

        setLeads(leads.filter(l => l.id !== lead.id));
    }
  };
  
  const handleAbrirConversao = (lead) => {
      // Passamos os dados do contato para o modal de conversão
      const leadDataForConversion = {
          id: lead.id,
          nome: lead.crm_contatos.nome,
          empresa: lead.crm_contatos.empresa_id, // Futuramente, podemos buscar o nome da empresa
          email: lead.crm_contatos.email,
          telefone: lead.crm_contatos.telefone,
      }
      setLeadParaConverter(leadDataForConversion);
      setIsConvertModalOpen(true);
  }
  
  const handleNegocioAdicionadoDaConversao = (novoNegocio, leadIdConvertido) => {
      if(leadIdConvertido) {
          setLeads(leads.map(l => l.id === leadIdConvertido ? { ...l, status: 'Convertido' } : l));
      }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/80 min-h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Prospecção de Leads</h1>
          <button onClick={() => setIsAddLeadModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusCircle size={20} />
            Adicionar Lead
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y dark:divide-gray-700">
             <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-200">{lead.crm_contatos?.nome || 'Contato não encontrado'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{lead.crm_contatos?.email}</div>
                    </td>
                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'Convertido' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{lead.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.fonte}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-gray-400 hover:text-blue-600" title="Editar Contato">
                                <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDeletarLead(lead)} className="text-gray-400 hover:text-red-600" title="Apagar Lead e Contato">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {lead.status !== 'Convertido' ? (
                          <button onClick={() => handleAbrirConversao(lead)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            Converter <ArrowRight size={14} />
                          </button>
                        ) : (
                          <span className="text-green-600 flex items-center justify-end gap-1 text-xs">
                             <CheckCircle size={14} /> Convertido
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
      
      <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} onLeadAdicionado={handleLeadAdicionado} />
      
      {isConvertModalOpen && (
        <AddNegocioModal 
            isOpen={isConvertModalOpen}
            onClose={() => setIsConvertModalOpen(false)}
            etapas={etapasDoFunil}
            onNegocioAdicionado={handleNegocioAdicionadoDaConversao}
            leadData={leadParaConverter}
        />
      )}
    </>
  );
};

export default PaginaLeads;