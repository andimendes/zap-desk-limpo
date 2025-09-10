// src/components/clientes/PaginaEmpresas.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import EmpresaFormUnificado from './EmpresaFormUnificado';
import HistoricoClienteModal from './HistoricoClienteModal';
import ImportacaoModal from './ImportacaoModal';
import { Plus, Edit, Trash2, Building, Star, ChevronDown, ChevronUp, User, Mail, Phone, Upload, Download, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

const formatCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const cnpjLido = cnpj.replace(/\D/g, '');
  return cnpjLido.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// --- FUNÇÃO DE FORMATAÇÃO DE TELEFONE ATUALIZADA ---
const formatarTelefoneExibicao = (telefone) => {
    if (!telefone) return '';
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    // Formato para celular com 9º dígito: (xx) x xxxx-xxxx
    if (telefoneLimpo.length === 11) {
        return telefoneLimpo.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    }
    // Formato para telefone fixo ou celular antigo: (xx) xxxx-xxxx
    if (telefoneLimpo.length === 10) {
        return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    // Retorna o número original se não se encaixar nos padrões
    return telefone;
};

const EmpresaCard = ({ empresa, onEdit, onDelete, onHistory }) => {
    if (!empresa || typeof empresa !== 'object') return null;
    
    const [isExpanded, setIsExpanded] = useState(false);

    const principal = {
        nome: empresa.contato_principal_nome,
        email: empresa.contato_principal_email,
        telefone: empresa.contato_principal_telefone,
    };

    const statusConfig = {
        'Cliente Ativo': { text: 'Cliente Ativo', style: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        'Potencial': { text: 'Potencial', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        'Inativo': { text: 'Inativo', style: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    };
    const statusInfo = statusConfig[empresa.status] || { text: empresa.status || 'Sem Status', style: 'bg-gray-100 text-gray-800' };

    return (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden transition-shadow duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex-1 mb-4 md:mb-0 cursor-pointer" onClick={() => onHistory(empresa)}>
                        <div className="flex items-center mb-2"><Building className="w-5 h-5 text-gray-500 mr-3" /><h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{empresa.nome_fantasia || empresa.razao_social}</h3></div>
                        <p className="text-sm text-gray-600 ml-8 dark:text-gray-300">{empresa.cnpj ? formatCNPJ(empresa.cnpj) : 'CNPJ não informado'}</p>
                    </div>
                    <div className="flex-1 mb-4 md:mb-0 md:mx-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <p className="font-semibold text-gray-700 text-sm flex items-center mb-1 dark:text-gray-200"><Star size={14} className="text-yellow-500 mr-1.5" /> Contato Principal</p>
                        {principal.nome ? (
                            <>
                                <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><User size={14} className="mr-2" /> {principal.nome}</div>
                                {principal.email && <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><Mail size={14} className="mr-2" /> {principal.email}</div>}
                                {/* --- MÁSCARA APLICADA AQUI --- */}
                                {principal.telefone && <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300"><Phone size={14} className="mr-2" /> {formatarTelefoneExibicao(principal.telefone)}</div>}
                            </>
                        ) : <p className="text-sm text-gray-500 mt-1 italic">Nenhum contato principal.</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.style}`}>{statusInfo.text}</span>
                        <button onClick={() => onEdit(empresa)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-600"><Edit size={18} /></button>
                        <button onClick={() => onDelete(empresa.id)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-600"><Trash2 size={18} /></button>
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-500 rounded-full">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 md:p-6 border-t bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                        <div><p className="font-medium text-gray-500">CNPJ</p><p>{empresa.cnpj ? formatCNPJ(empresa.cnpj) : 'Não informado'}</p></div>
                        <div><p className="font-medium text-gray-500">E-mail da Empresa</p><p>{empresa.email_principal || 'Não informado'}</p></div>
                        {/* --- MÁSCARA APLICADA AQUI --- */}
                        <div><p className="font-medium text-gray-500">Telefone da Empresa</p><p>{formatarTelefoneExibicao(empresa.telefone_principal) || 'Não informado'}</p></div>
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


export default function PaginaEmpresas() {
    const [view, setView] = useState('clientes');
    const [loading, setLoading] = useState(true);
    const [empresas, setEmpresas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalEmpresaOpen, setIsModalEmpresaOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);


    const fetchData = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('crm_empresas')
            .select('*, empresa_contato_junction(*, crm_contatos(*))');

        if (view === 'clientes') {
            query = query.in('status', ['Cliente Ativo', 'Inativo']);
        } else { 
            query = query.eq('status', 'Potencial');
        }
        
        const { data, error } = await query;

        if (error) {
            console.error("Erro ao buscar dados:", error);
            setEmpresas([]);
        } else {
            const empresasComContato = (data || []).map(emp => {
                const principalJunction = emp.empresa_contato_junction?.find(j => j.is_principal);
                const contatoPrincipal = principalJunction?.crm_contatos;
                return {
                    ...emp,
                    contato_principal_nome: contatoPrincipal?.nome,
                    contato_principal_email: contatoPrincipal?.email,
                    contato_principal_telefone: contatoPrincipal?.telefone,
                };
            });
            setEmpresas(empresasComContato);
        }
        setLoading(false);
    }, [view]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenEmpresaModal = (empresa = {}) => { 
        setSelectedEmpresa(empresa); 
        setIsModalEmpresaOpen(true); 
    };

    const handleCloseEmpresaModal = () => {
        setIsModalEmpresaOpen(false);
        setSelectedEmpresa(null);
    };

    const handleSaveEmpresa = () => { 
        handleCloseEmpresaModal(); 
        fetchData(); 
    };
    
    const handleOpenHistory = (empresa) => { 
        setSelectedEmpresa(empresa); 
        setIsHistoryOpen(true); 
    };

    const handleDelete = async (empresaId) => {
        if (window.confirm('Tem a certeza de que quer excluir esta empresa e todos os seus contatos associados?')) {
            await supabase.from('empresa_contato_junction').delete().eq('empresa_id', empresaId);
            const { error } = await supabase.from('crm_empresas').delete().eq('id', empresaId);
            if (error) {
                alert('Erro ao excluir empresa: ' + error.message);
            } else {
                fetchData();
            }
        }
    };

    const filteredEmpresas = useMemo(() => empresas.filter(e =>
        (e.nome_fantasia && e.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.razao_social && e.razao_social.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.cnpj && e.cnpj.includes(searchTerm))
    ), [empresas, searchTerm]);
    
    const handleExport = () => { 
        const csv = Papa.unparse(empresas.map(e => ({
            nome_fantasia: e.nome_fantasia,
            razao_social: e.razao_social,
            cnpj: e.cnpj,
            status: e.status,
            contato_principal: e.contato_principal_nome,
            email_contato: e.contato_principal_email,
            telefone_contato: e.contato_principal_telefone,
        })));
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `empresas-${view}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportComplete = () => {
        setIsImportModalOpen(false);
        fetchData();
    };


    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Central de Empresas</h1>
                        <p className="text-gray-500 dark:text-gray-400">Gira os seus clientes e contatos num só lugar.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border dark:border-gray-700">
                            <button onClick={() => setView('clientes')} className={`px-3 py-1 rounded-md text-sm font-semibold ${view === 'clientes' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Clientes</button>
                            <button onClick={() => setView('potenciais')} className={`px-3 py-1 rounded-md text-sm font-semibold ${view === 'potenciais' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Potenciais</button>
                        </div>
                        <button onClick={() => setIsImportModalOpen(true)} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300"><Upload size={16}/></button>
                        <button onClick={handleExport} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300"><Download size={16}/></button>
                        <button onClick={() => handleOpenEmpresaModal()} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Nova Empresa</button>
                    </div>
                </header>

                <div className="mb-4">
                    <input type="text" placeholder="Buscar por nome, razão social ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"/>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin inline-block text-blue-500" /></div>
                 : <div className="space-y-4">
                    {filteredEmpresas.length > 0 ? filteredEmpresas.map(empresa => (
                        empresa && <EmpresaCard key={empresa.id} empresa={empresa} onEdit={handleOpenEmpresaModal} onDelete={handleDelete} onHistory={handleOpenHistory} />
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
                    <EmpresaFormUnificado 
                        onSave={handleSaveEmpresa} 
                        initialData={selectedEmpresa || {}}
                        onClose={handleCloseEmpresaModal}
                        tabelaAlvo="crm_empresas" 
                    />
                </div>
            )}
            
            {isHistoryOpen && <HistoricoClienteModal empresa={selectedEmpresa} onClose={() => setIsHistoryOpen(false)} />}

            {isImportModalOpen && (
                <ImportacaoModal 
                    onClose={() => setIsImportModalOpen(false)}
                    onComplete={handleImportComplete}
                />
            )}
        </div>
    );
}