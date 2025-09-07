// src/components/contatos/PaginaContatos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
// --- ALTERAÇÃO 1: Trocamos o formulário antigo pelo nosso novo modal unificado ---
import ContatoFormModal from '../crm/ContatoFormModal'; 
import ImportacaoContatosModal from './ImportacaoContatosModal';
import { Plus, Edit, Trash2, Loader2, List, LayoutGrid, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';

// Função para formatar o telefone para exibição (sem alterações)
const formatTelefone = (telefone) => {
  if (!telefone) return 'Sem telefone';
  const telefoneLimpo = String(telefone).replace(/\D/g, '');
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
};

// Componente ContatoCard (sem alterações)
const ContatoCard = ({ contato, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4 flex flex-col justify-between">
        <div>
            <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-3">
                    {contato.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold">{contato.nome}</h3>
                    <p className="text-sm text-gray-500">{contato.cargo || 'Sem cargo'}</p>
                </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1 mt-3 pt-3 border-t">
                <p>{contato.email || 'Sem e-mail'}</p>
                <p>{formatTelefone(contato.telefone)}</p>
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => onEdit(contato)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
            <button onClick={() => onDelete(contato)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
    </div>
);

// Componente ContatoListItem (sem alterações)
const ContatoListItem = ({ contato, onEdit, onDelete }) => (
     <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-4">
                    {contato.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="text-sm font-medium">{contato.nome}</div>
                    <div className="text-sm text-gray-500">{contato.cargo || 'Sem cargo'}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contato.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTelefone(contato.telefone)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => onEdit(contato)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
            <button onClick={() => onDelete(contato)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </td>
    </tr>
);

export default function PaginaContatos() {
    // Todos os 'useState' e funções de lógica permanecem os mesmos
    const [contatos, setContatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedContato, setSelectedContato] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const fetchContatos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('crm_contatos').select('*').order('nome', { ascending: true });
        if (error) console.error("Erro a buscar contatos:", error);
        else setContatos(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchContatos(); }, [fetchContatos]);

    const handleOpenFormModal = (contato = null) => {
        setSelectedContato(contato);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedContato(null);
    };

    const handleSave = () => {
        fetchContatos();
        handleCloseFormModal();
    };

    const handleDelete = async (contato) => {
        if (window.confirm(`Tem a certeza que deseja apagar ${contato.nome}?`)) {
            await supabase.from('empresa_contato_junction').delete().eq('contato_id', contato.id);
            await supabase.from('crm_contatos').delete().eq('id', contato.id);
            fetchContatos();
        }
    };
    
    const handleImportComplete = () => {
        setIsImportModalOpen(false);
        fetchContatos();
    };

    const filteredContatos = contatos.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const handleExport = () => { 
        const csv = Papa.unparse(contatos.map(c => ({nome: c.nome, email: c.email, telefone: c.telefone, cargo: c.cargo})));
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "contatos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900">
            {/* O cabeçalho e a área de visualização continuam os mesmos */}
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Contatos</h1>
                        <p className="text-gray-500">Gira os seus contatos individuais.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-lg shadow-sm border">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : ''}`}><LayoutGrid size={16}/></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : ''}`}><List size={16}/></button>
                        </div>
                        <button onClick={() => setIsImportModalOpen(true)} className="p-2 bg-white rounded-lg shadow-sm border"><Upload size={16}/></button>
                        <button onClick={handleExport} className="p-2 bg-white rounded-lg shadow-sm border"><Download size={16}/></button>
                        <button onClick={() => handleOpenFormModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Novo Contato</button>
                    </div>
                </header>
                 <div className="mb-4">
                    <input type="text" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg"/>
                </div>
                {loading ? <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>
                : filteredContatos.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredContatos.map(c => <ContatoCard key={c.id} contato={c} onEdit={handleOpenFormModal} onDelete={handleDelete} />)}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border">
                            <table className="min-w-full divide-y">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">E-mail</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">Telefone</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredContatos.map(c => <ContatoListItem key={c.id} contato={c} onEdit={handleOpenFormModal} onDelete={handleDelete} />)}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                     <div className="text-center py-10 text-gray-500">
                        <p>Nenhum contato encontrado.</p>
                    </div>
                )}
            </div>
            
            {/* --- ALTERAÇÃO 2: Simplificamos a renderização do modal --- */}
            {/* O 'div' que criava o fundo escuro foi removido. */}
            {/* O nome da prop 'contatoInicial' foi atualizado para 'contato'. */}
            {isFormModalOpen && (
                <ContatoFormModal 
                    isOpen={isFormModalOpen}
                    onSave={handleSave}
                    contato={selectedContato}
                    onClose={handleCloseFormModal}
                />
            )}

            {isImportModalOpen && (
                <ImportacaoContatosModal
                    onClose={() => setIsImportModalOpen(false)}
                    onComplete={handleImportComplete}
                />
            )}
        </div>
    );
}