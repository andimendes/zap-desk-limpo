// src/components/crm/PaginaLeads.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, PlusCircle, User, Building, Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import AddLeadModal from './AddLeadModal';
import AddNegocioModal from './AddNegocioModal'; // Importamos o AddNegocioModal

const PaginaLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  
  // Estados para a conversão
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadParaConverter, setLeadParaConverter] = useState(null);
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);


  const fetchLeads = async () => {
    // Não seta o loading aqui para permitir recarregamentos mais suaves
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
    setLoading(true);
    fetchLeads();
    // Busca as etapas do funil para passar ao AddNegocioModal
    const fetchEtapas = async () => {
      // Busca as etapas do primeiro funil que encontrar. Pode ser melhorado para ser mais específico.
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
  
  const handleAbrirConversao = (lead) => {
      setLeadParaConverter(lead);
      setIsConvertModalOpen(true);
  }
  
  // Esta função é chamada pelo AddNegocioModal após a conversão ser bem-sucedida
  const handleNegocioAdicionadoDaConversao = (novoNegocio, leadIdConvertido) => {
      if(leadIdConvertido) {
          // Atualiza a UI para mostrar que o lead foi convertido, sem precisar de buscar na base de dados novamente
          setLeads(leads.map(l => l.id === leadIdConvertido ? { ...l, status: 'Convertido' } : l));
      }
      // Aqui você poderia também notificar o CrmBoard para adicionar o novo negócio
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contato</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4"><div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-200"><User size={16} className="text-gray-400 mr-3"/>{lead.nome}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.empresa || 'N/A'}</td>
                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'Convertido' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{lead.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.email}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {lead.status !== 'Convertido' ? (
                        <button onClick={() => handleAbrirConversao(lead)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          Converter <ArrowRight size={14} />
                        </button>
                      ) : (
                        <span className="text-green-600 flex items-center justify-start gap-1 text-xs">
                           <CheckCircle size={14} /> Convertido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
      
      {/* Nossos dois modais, renderizados condicionalmente */}
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