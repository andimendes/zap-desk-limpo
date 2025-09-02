// src/components/crm/PaginaLeads.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, PlusCircle, User, Building, Mail, Phone, ArrowRight, CheckCircle, Pencil, Trash2 } from 'lucide-react'; // 1. Adicionamos o ícone Trash2
import AddLeadModal from './AddLeadModal';
import AddNegocioModal from './AddNegocioModal';
import EditLeadModal from './EditLeadModal';

const PaginaLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [leadParaConverter, setLeadParaConverter] = useState(null);
  const [leadParaEditar, setLeadParaEditar] = useState(null);
  const [etapasDoFunil, setEtapasDoFunil] = useState([]);


  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao buscar leads:', error);
        setError('Não foi possível carregar os leads.');
      } else {
        setLeads(data);
      }
      setLoading(false);
    };
    
    setLoading(true);
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

  // 2. --- NOVA FUNÇÃO PARA APAGAR UM LEAD ---
  const handleDeletarLead = async (leadId) => {
    if (window.confirm('Tem certeza de que deseja apagar este lead? Esta ação não pode ser desfeita.')) {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao apagar lead:', error);
        alert('Não foi possível apagar o lead.');
      } else {
        // Remove o lead da lista na tela sem precisar de recarregar
        setLeads(leads.filter(l => l.id !== leadId));
      }
    }
  };
  
  const handleAbrirEdicao = (lead) => {
    setLeadParaEditar(lead);
    setIsEditModalOpen(true);
  };

  const handleLeadAtualizado = (leadAtualizado) => {
    setLeads(leads.map(l => l.id === leadAtualizado.id ? leadAtualizado : l));
  };
  
  const handleAbrirConversao = (lead) => {
      setLeadParaConverter(lead);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contato</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                    <td className="px-6 py-4"><div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-200"><User size={16} className="text-gray-400 mr-3"/>{lead.nome}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.empresa || 'N/A'}</td>
                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'Convertido' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{lead.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.email}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* 3. Botão de Editar */}
                            <button onClick={() => handleAbrirEdicao(lead)} className="text-gray-400 hover:text-blue-600" title="Editar Lead">
                                <Pencil size={16} />
                            </button>
                            {/* 3. Botão de Apagar */}
                            <button onClick={() => handleDeletarLead(lead.id)} className="text-gray-400 hover:text-red-600" title="Apagar Lead">
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

      {isEditModalOpen && (
        <EditLeadModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onLeadAtualizado={handleLeadAtualizado}
            lead={leadParaEditar}
        />
      )}
    </>
  );
};

export default PaginaLeads;