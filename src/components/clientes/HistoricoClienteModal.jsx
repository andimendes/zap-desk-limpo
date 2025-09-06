import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
// 1. IMPORTAMOS O NOSSO NOVO SERVIÇO
import { getNegocios } from '../../services/negocioService'; 
import { X, Building, Mail, Phone, Loader2, User, FileText, DollarSign, Briefcase } from 'lucide-react';

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
        <div className="flex items-start gap-3">
            <Building className="w-5 h-5 mt-1 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">Razão Social</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.razao_social}</p>
            </div>
        </div>
        <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 mt-1 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">CNPJ</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.cnpj}</p>
            </div>
        </div>
         <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 mt-1 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">E-mail Principal</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.email_principal || 'Não informado'}</p>
            </div>
        </div>
        <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 mt-1 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">Telefone Principal</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.telefone_principal || 'Não informado'}</p>
            </div>
        </div>
        <div className="flex items-start gap-3 col-span-full">
            <DollarSign className="w-5 h-5 mt-1 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">Plano</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{empresa.plano || 'Nenhum plano contratado'}</p>
            </div>
        </div>
        {empresa.plano === 'Plano Estratégico' && empresa.modulos_contratados?.length > 0 && (
            <div className="flex items-start gap-3 col-span-full">
                <Briefcase className="w-5 h-5 mt-1 text-gray-500" />
                 <div>
                    <p className="text-xs text-gray-500">Módulos Contratados</p>
                    <ul className="list-disc list-inside mt-1">
                        {empresa.modulos_contratados.map(m => <li key={m}>{m}</li>)}
                    </ul>
                </div>
            </div>
        )}
    </div>
);

const ContatosTab = ({ contatos, loading, error }) => {
    if (loading) return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-6 space-y-4">
            {contatos.length > 0 ? contatos.map(contato => (
                 contato.crm_contatos && <div key={contato.crm_contatos.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                     <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{contato.crm_contatos.nome}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{contato.crm_contatos.cargo || 'Cargo não informado'}</p>
                        </div>
                        {contato.is_principal && <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Principal</span>}
                     </div>
                     <div className="mt-3 pt-3 border-t text-sm space-y-2">
                         <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14}/> {contato.crm_contatos.email || 'E-mail não informado'}</p>
                         <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14}/> {contato.crm_contatos.telefone || 'Telefone não informado'}</p>
                     </div>
                 </div>
            )) : <p className="text-center text-gray-500 py-4">Nenhum contato vinculado a esta empresa.</p>}
        </div>
    );
};

const ChamadosTab = ({ chamados, loading, error }) => {
    if (loading) return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-6 space-y-3">
            {chamados.length > 0 ? chamados.map(chamado => (
                 <div key={chamado.id} className="p-3 border rounded-lg">
                     <p className="font-semibold">{chamado.titulo}</p>
                     <div className="flex justify-between items-center text-xs mt-1 text-gray-500">
                        <span>Aberto em: {new Date(chamado.created_at).toLocaleDateString()}</span>
                        <span>Status: {chamado.status}</span>
                        <span>Prioridade: {chamado.prioridade}</span>
                     </div>
                 </div>
            )) : <p className="text-center text-gray-500 py-4">Nenhum chamado encontrado para este cliente.</p>}
        </div>
    );
};

// 2. CRIAMOS A NOVA ABA DE NEGÓCIOS
const NegociosTab = ({ negocios, loading, error }) => {
    if (loading) return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-6 space-y-3">
            {negocios.length > 0 ? negocios.map(negocio => (
                 <div key={negocio.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                     <div className="flex justify-between items-center">
                         <p className="font-bold text-gray-800 dark:text-gray-100">{negocio.titulo}</p>
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                             negocio.status === 'Ganho' ? 'bg-green-100 text-green-800' :
                             negocio.status === 'Perdido' ? 'bg-red-100 text-red-800' :
                             'bg-blue-100 text-blue-800'
                         }`}>{negocio.status}</span>
                     </div>
                     <div className="mt-3 pt-3 border-t text-sm space-y-2">
                         <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold"><DollarSign size={14}/> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
                         <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><User size={14}/> Responsável: {negocio.responsavel?.full_name || 'Não definido'}</p>
                     </div>
                 </div>
            )) : <p className="text-center text-gray-500 py-4">Nenhum negócio encontrado para esta empresa.</p>}
        </div>
    );
};


const PlaceholderTab = ({ title }) => (
    <div className="p-10 text-center text-gray-500">
        <p>A funcionalidade de **{title}** será implementada em breve.</p>
    </div>
);


export default function HistoricoClienteModal({ empresa, onClose }) {
    const [activeTab, setActiveTab] = useState('info');
    // 3. ADICIONAMOS O ESTADO PARA OS NEGÓCIOS
    const [data, setData] = useState({ contatos: [], chamados: [], negocios: [] });
    const [loading, setLoading] = useState({ contatos: true, chamados: true, negocios: true });
    const [errors, setErrors] = useState({ contatos: null, chamados: null, negocios: null });

    if (!empresa) return null;

    useEffect(() => {
        if (!empresa?.id) return;

        const fetchData = async () => {
            // Reset dos estados ao carregar
            setLoading({ contatos: true, chamados: true, negocios: true });
            setErrors({ contatos: null, chamados: null, negocios: null });

            // Fetch Contatos
            const { data: contatosData, error: contatosError } = await supabase
                .from('empresa_contato_junction')
                .select('is_principal, crm_contatos(*)')
                .eq('empresa_id', empresa.id);

            if (contatosError) {
                console.error("Erro ao buscar contatos:", contatosError);
                setErrors(prev => ({ ...prev, contatos: 'Não foi possível carregar os contatos.' }));
            } else {
                setData(prev => ({ ...prev, contatos: contatosData || [] }));
            }
            setLoading(prev => ({...prev, contatos: false}));
            
            // Fetch Chamados
            const { data: chamadosData, error: chamadosError } = await supabase
                .from('chamados_com_detalhes')
                .select('*')
                .eq('cliente_cnpj', empresa.cnpj);

            if (chamadosError) {
                console.error("Erro ao buscar chamados:", chamadosError);
                setErrors(prev => ({ ...prev, chamados: 'Não foi possível carregar o histórico de chamados.'}));
            } else {
                setData(prev => ({...prev, chamados: chamadosData || []}));
            }
            setLoading(prev => ({...prev, chamados: false}));

            // 4. USAMOS O NOSSO SERVIÇO PARA BUSCAR OS NEGÓCIOS
            const { data: negociosData, error: negociosError } = await getNegocios({ empresaId: empresa.id });
             if (negociosError) {
                console.error("Erro ao buscar negócios:", negociosError);
                setErrors(prev => ({ ...prev, negocios: 'Não foi possível carregar os negócios.'}));
            } else {
                setData(prev => ({...prev, negocios: negociosData || []}));
            }
            setLoading(prev => ({...prev, negocios: false}));
        };

        fetchData();
    }, [empresa]);

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoTab empresa={empresa} />;
            case 'contatos':
                return <ContatosTab contatos={data.contatos} loading={loading.contatos} error={errors.contatos} />;
            case 'chamados':
                 return <ChamadosTab chamados={data.chamados} loading={loading.chamados} error={errors.chamados} />;
            // 5. RENDERIZAMOS A NOSSA NOVA ABA DE NEGÓCIOS
            case 'negocios':
                 return <NegociosTab negocios={data.negocios} loading={loading.negocios} error={errors.negocios} />;
            case 'faturas':
                 return <PlaceholderTab title="Faturas" />;
            default:
                return null;
        }
    };

    return (
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
    );
}
