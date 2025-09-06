import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import EmpresaFormUnificado from '../components/clientes/EmpresaFormUnificado';
import HistoricoClienteModal from '../components/clientes/HistoricoClienteModal';
import { Plus, Edit, Building, Star, ChevronDown, ChevronUp, User, List, Filter, Loader2, Mail, Phone, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';


const EmpresaCard = ({ empresa, onEdit, onHistory }) => {
    if (!empresa || typeof empresa !== 'object') return null;
    
    const [isExpanded, setIsExpanded] = useState(false);

    const principal = empresa.empresa_contato_junction?.find(j => j.is_principal)?.crm_contatos;

    const statusConfig = {
        'Cliente Ativo': { text: 'Cliente Ativo', style: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        'Potencial': { text: 'Potencial', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        'Inativo': { text: 'Inativo', style: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };
    const statusInfo = statusConfig[empresa.status] || { text: empresa.status || 'Sem Status', style: 'bg-gray-100 text-gray-800' };

    return (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden transition-shadow duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex-1 mb-4 md:mb-0 cursor-pointer" onClick={() => onHistory(empresa)}>
                        <div className="flex items-center mb-2"><Building className="w-5 h-5 text-gray-500 mr-3" /><h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{empresa.nome_fantasia || empresa.razao_social}</h3></div>
                        <p className="text-sm text-gray-600 ml-8 dark:text-gray-300">{empresa.razao_social}</p>
                    </div>
                    <div className="flex-1 mb-4 md:mb-0 md:mx-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <p className="font-semibold text-gray-700 text-sm flex items-center mb-1 dark:text-gray-200"><Star size={14} className="text-yellow-500 mr-1.5" /> Contato Principal</p>
                        {principal ? (
                            <>
                                <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><User size={14} className="mr-2" /> {principal.nome}</div>
                                {principal.email && <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><Mail size={14} className="mr-2" /> {principal.email}</div>}
                                {principal.telefone && <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><Phone size={14} className="mr-2" /> {principal.telefone}</div>}
                            </>
                        ) : <p className="text-sm text-gray-500 mt-1 italic">Nenhum contato principal.</p>}
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.style}`}>{statusInfo.text}</span>
                        <button onClick={() => onEdit(empresa)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-600"><Edit size={18} /></button>
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-500 rounded-full">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 md:p-6 border-t bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                        <div><p className="font-medium text-gray-500">CNPJ</p><p>{empresa.cnpj || 'Não informado'}</p></div>
                        <div><p className="font-medium text-gray-500">E-mail da Empresa</p><p>{empresa.email_principal || 'Não informado'}</p></div>
                        <div><p className="font-medium text-gray-500">Telefone da Empresa</p><p>{empresa.telefone_principal || 'Não informado'}</p></div>
                        {empresa.status === 'Cliente Ativo' && <>
                            <div><p className="font-medium text-gray-500">Plano</p><p>{empresa.plano || 'Não definido'}</p></div>
                            {empresa.plano === 'Plano Estratégico' && <div className="md:col-span-2"><p className="font-medium">Módulos</p><ul className="list-disc list-inside mt-1">{empresa.modulos_contratados?.map(m => <li key={m}>{m}</li>)}</ul></div>}
                        </>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function EmpresasPage() {
    const [view, setView] = useState('clientes');
    const [loading, setLoading] = useState(true);
    const [empresas, setEmpresas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalEmpresaOpen, setIsModalEmpresaOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);


    const fetchData = useCallback(async () => {
        setLoading(true);
        const statusQuery = view === 'clientes' ? 'Cliente Ativo' : 'Potencial';
        
        const { data, error } = await supabase
            .from('crm_empresas')
            .select('*, empresa_contato_junction(*, crm_contatos(*))')
            .eq('status', statusQuery);

        if (error) {
            console.error("Erro ao buscar dados:", error);
            setEmpresas([]);
        } else {
            setEmpresas(data || []);
        }
        setLoading(false);
    }, [view]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenEmpresaModal = (empresa = null) => { setSelectedEmpresa(empresa); setIsModalEmpresaOpen(true); };
    const handleCloseEmpresaModal = () => setIsModalEmpresaOpen(false);
    const handleSaveEmpresa = () => { handleCloseEmpresaModal(); fetchData(); };
    const handleOpenHistory = (empresa) => { setSelectedEmpresa(empresa); setIsHistoryOpen(true); };

    const filteredEmpresas = empresas.filter(e =>
        (e.nome_fantasia && e.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.razao_social && e.razao_social.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.cnpj && e.cnpj.includes(searchTerm))
    );
    
    // Funções de importação/exportação (ainda como placeholders)
    const handleExport = () => { 
        const csv = Papa.unparse(empresas);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "empresas.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleImport = () => alert('Funcionalidade de importação a ser implementada.');

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Central de Empresas</h1>
                        <p className="text-gray-500">Gira os seus clientes e contatos num só lugar.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('clientes')} className={`px-3 py-1 rounded-md text-sm font-semibold ${view === 'clientes' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Clientes</button>
                        <button onClick={() => setView('potenciais')} className={`px-3 py-1 rounded-md text-sm font-semibold ${view === 'potenciais' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Potenciais</button>
                        <button onClick={handleImport} className="p-2 bg-white rounded-md"><Upload size={16}/></button>
                        <button onClick={handleExport} className="p-2 bg-white rounded-md"><Download size={16}/></button>
                        <button onClick={() => handleOpenEmpresaModal()} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Nova Empresa</button>
                    </div>
                </header>

                <div className="mb-4">
                    <input type="text" placeholder="Buscar por nome, razão social ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg"/>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin inline-block text-blue-500" /></div>
                 : <div className="space-y-4">
                    {filteredEmpresas.length > 0 ? filteredEmpresas.map(empresa => (
                        empresa && <EmpresaCard key={empresa.id} empresa={empresa} onEdit={handleOpenEmpresaModal} onHistory={handleOpenHistory} />
                    )) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>Nenhuma empresa encontrada.</p>
                            <p className="text-sm mt-1">Tente ajustar a sua busca ou o filtro selecionado.</p>
                        </div>
                    )}
                </div>}
            </div>

            {isModalEmpresaOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    {/* **CORREÇÃO**: Passando a prop 'tabelaAlvo' explicitamente */}
                    <EmpresaFormUnificado 
                        onSave={handleSaveEmpresa} 
                        initialData={selectedEmpresa}
                        onClose={handleCloseEmpresaModal}
                        tabelaAlvo="crm_empresas" 
                    />
                </div>
            )}
            
            {isHistoryOpen && <HistoricoClienteModal empresa={selectedEmpresa} onClose={() => setIsHistoryOpen(false)} />}
        </div>
    );
}