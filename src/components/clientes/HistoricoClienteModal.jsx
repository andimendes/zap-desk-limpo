// src/components/clientes/HistoricoClienteModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { getNegocios } from '../../services/negocioService';
import { X, Building, Mail, Phone, Loader2, User, FileText, DollarSign, Briefcase, PlusCircle, Edit } from 'lucide-react';
import ContatoFormModal from '../crm/ContatoFormModal';

// --- FUNÇÃO DE FORMATAÇÃO DE TELEFONE ADICIONADA AQUI ---
const formatarTelefoneExibicao = (telefone) => {
    if (!telefone) return '';
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    if (telefoneLimpo.length === 11) {
        return telefoneLimpo.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    }
    if (telefoneLimpo.length === 10) {
        return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
};

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            active
                ? 'bg-white dark:bg-gray-800 border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
    >
        {children}
    </button>
);

const InfoTab = ({ empresa }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
        <div className="flex items-start gap-3"><Building className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">Razão Social</p><p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.razao_social}</p></div></div>
        <div className="flex items-start gap-3"><FileText className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">CNPJ</p><p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.cnpj}</p></div></div>
        <div className="flex items-start gap-3"><Mail className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">E-mail Principal</p><p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.email_principal || 'Não informado'}</p></div></div>
        {/* --- MÁSCARA APLICADA AQUI --- */}
        <div className="flex items-start gap-3"><Phone className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">Telefone Principal</p><p className="font-semibold text-gray-800 dark:text-gray-200">{formatarTelefoneExibicao(empresa.telefone_principal) || 'Não informado'}</p></div></div>
        <div className="flex items-start gap-3 col-span-full"><DollarSign className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">Plano</p><p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.plano || 'Nenhum plano contratado'}</p></div></div>
        {empresa.plano === 'Plano Estratégico' && empresa.modulos_contratados?.length > 0 && (
            <div className="flex items-start gap-3 col-span-full"><Briefcase className="w-5 h-5 mt-1 text-gray-500" /><div><p className="text-xs text-gray-500">Módulos Contratados</p><ul className="list-disc list-inside mt-1">{empresa.modulos_contratados.map(m => <li key={m}>{m}</li>)}</ul></div></div>
        )}
    </div>
);

const ContatosTab = ({ contatos, loading, error, onAddContato, onEditContato }) => {
    if (loading) return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={onAddContato} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    <PlusCircle size={16} /> Novo Contato
                </button>
            </div>
            <div className="space-y-4">
                {contatos.length > 0 ? contatos.map(contato => (
                     contato.crm_contatos && <div key={contato.crm_contatos.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 group">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{contato.crm_contatos.nome}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{contato.crm_contatos.cargo || 'Cargo não informado'}</p>
                            </div>
                            <div className="flex items-center">
                                {contato.is_principal && <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mr-2">Principal</span>}
                                <button onClick={() => onEditContato(contato.crm_contatos)} className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit size={16} />
                                </button>
                            </div>
                         </div>
                         <div className="mt-3 pt-3 border-t text-sm space-y-2">
                             <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14}/> {contato.crm_contatos.email || 'E-mail não informado'}</p>
                             {/* --- MÁSCARA APLICADA AQUI --- */}
                             <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14}/> {formatarTelefoneExibicao(contato.crm_contatos.telefone) || 'Telefone não informado'}</p>
                         </div>
                     </div>
                )) : <p className="text-center text-gray-500 py-4">Nenhum contato vinculado a esta empresa.</p>}
            </div>
        </div>
    );
};

const ChamadosTab = ({ chamados, loading, error }) => { /* ... código ... */ };
const NegociosTab = ({ negocios, loading, error }) => { /* ... código ... */ };
const PlaceholderTab = ({ title }) => { /* ... código ... */ };

export default function HistoricoClienteModal({ empresa, onClose }) {
    const [activeTab, setActiveTab] = useState('info');
    const [data, setData] = useState({ contatos: [], chamados: [], negocios: [] });
    const [loading, setLoading] = useState({ contatos: true, chamados: true, negocios: true });
    const [errors, setErrors] = useState({ contatos: null, chamados: null, negocios: null });
    const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
    const [contatoEmEdicao, setContatoEmEdicao] = useState(null);

    const handleOpenContatoModal = (contato) => {
      setContatoEmEdicao(contato);
      setIsContatoModalOpen(true);
    };

    const handleCloseContatoModal = () => {
      setIsContatoModalOpen(false);
      setContatoEmEdicao(null);
    };

    const fetchData = useCallback(async () => {
        if (!empresa?.id) return;

        setLoading({ contatos: true, chamados: true, negocios: true });
        setErrors({ contatos: null, chamados: null, negocios: null });

        // Fetch Contatos
        const { data: contatosData, error: contatosError } = await supabase
            .from('empresa_contato_junction')
            .select('is_principal, crm_contatos(*)')
            .eq('empresa_id', empresa.id);
        if (contatosError) setErrors(prev => ({ ...prev, contatos: 'Não foi possível carregar os contatos.' }));
        else setData(prev => ({ ...prev, contatos: contatosData || [] }));
        setLoading(prev => ({...prev, contatos: false}));
        
        // Fetch Chamados
        const { data: chamadosData, error: chamadosError } = await supabase.from('chamados_com_detalhes').select('*').eq('cliente_id', empresa.id);
        if (chamadosError) setErrors(prev => ({ ...prev, chamados: 'Não foi possível carregar o histórico de chamados.'}));
        else setData(prev => ({...prev, chamados: chamadosData || []}));
        setLoading(prev => ({...prev, chamados: false}));

        // Fetch Negócios
        const { data: negociosData, error: negociosError } = await getNegocios({ empresaId: empresa.id });
         if (negociosError) setErrors(prev => ({ ...prev, negocios: 'Não foi possível carregar os negócios.'}));
        else setData(prev => ({...prev, negocios: negociosData || []}));
        setLoading(prev => ({...prev, negocios: false}));
    }, [empresa]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSaveContato = () => {
      handleCloseContatoModal();
      fetchData();
    };

    if (!empresa) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoTab empresa={empresa} />;
            case 'contatos':
                return <ContatosTab 
                            contatos={data.contatos} 
                            loading={loading.contatos} 
                            error={errors.contatos}
                            onAddContato={() => handleOpenContatoModal(null)}
                            onEditContato={handleOpenContatoModal}
                        />;
            case 'chamados':
                 return <ChamadosTab chamados={data.chamados} loading={loading.chamados} error={errors.chamados} />;
            case 'negocios':
                 return <NegociosTab negocios={data.negocios} loading={loading.negocios} error={errors.negocios} />;
            case 'faturas':
                 return <PlaceholderTab title="Faturas" />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
                    <header className="p-5 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{empresa?.nome_fantasia}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Histórico do Cliente</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={24} />
                        </button>
                    </header>
                    <nav className="border-b px-4">
                        <div className="flex items-center gap-4">
                            <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>Informações</TabButton>
                            <TabButton active={activeTab === 'contatos'} onClick={() => setActiveTab('contatos')}>Contatos</TabButton>
                            <TabButton active={activeTab === 'chamados'} onClick={() => setActiveTab('chamados')}>Chamados</TabButton>
                            <TabButton active={activeTab === 'negocios'} onClick={() => setActiveTab('negocios')}>Negócios</TabButton>
                            <TabButton active={activeTab === 'faturas'} onClick={() => setActiveTab('faturas')}>Faturas</TabButton>
                        </div>
                    </nav>
                    <main className="overflow-y-auto">
                        {renderContent()}
                    </main>
                </div>
            </div>

            {isContatoModalOpen && (
              <ContatoFormModal
                isOpen={isContatoModalOpen}
                onClose={handleCloseContatoModal}
                onSave={handleSaveContato}
                contato={contatoEmEdicao}
                empresaIdInicial={empresa.id}
              />
            )}
        </>
    );
}