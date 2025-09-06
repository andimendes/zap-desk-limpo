import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ContatoForm from '../components/clientes/ContatoForm';
import { Plus, Edit, Trash2, Loader2, User, List, LayoutGrid, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';

const ContatoCard = ({ contato, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4 flex flex-col justify-between">
        <div>
            <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-3">
                    {contato.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{contato.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contato.cargo || 'Sem cargo'}</p>
                </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mt-3 pt-3 border-t dark:border-gray-600">
                <p>{contato.email || 'Sem e-mail'}</p>
                <p>{contato.telefone || 'Sem telefone'}</p>
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => onEdit(contato)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
            <button onClick={() => onDelete(contato)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
    </div>
);

const ContatoListItem = ({ contato, onEdit, onDelete }) => (
     <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-4">
                    {contato.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{contato.nome}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{contato.cargo || 'Sem cargo'}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contato.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contato.telefone}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => onEdit(contato)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
            <button onClick={() => onDelete(contato)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </td>
    </tr>
);


export default function ContatosPage() {
    const [contatos, setContatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContato, setSelectedContato] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const fetchContatos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('crm_contatos').select('*').order('nome', { ascending: true });
        if (error) {
            console.error("Erro a buscar contatos:", error);
        } else {
            setContatos(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchContatos();
    }, [fetchContatos]);

    const handleOpenModal = (contato = null) => {
        setSelectedContato(contato);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedContato(null);
    };

    const handleSave = () => {
        fetchContatos();
        handleCloseModal();
    };

    const handleDelete = async (contato) => {
        if (window.confirm(`Tem a certeza que deseja apagar ${contato.nome}?`)) {
            // Primeiro, apagar as ligações na tabela de junção
            await supabase.from('empresa_contato_junction').delete().eq('contato_id', contato.id);
            // Depois, apagar o contato
            await supabase.from('crm_contatos').delete().eq('id', contato.id);
            fetchContatos();
        }
    };

    const filteredContatos = contatos.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const handleExport = () => { 
        const csv = Papa.unparse(contatos);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "contatos.csv");
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
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Contatos</h1>
                        <p className="text-gray-500">Gira os seus contatos individuais.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white'}`}><LayoutGrid size={16}/></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white'}`}><List size={16}/></button>
                        <button onClick={handleImport} className="p-2 bg-white rounded-md"><Upload size={16}/></button>
                        <button onClick={handleExport} className="p-2 bg-white rounded-md"><Download size={16}/></button>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Novo Contato</button>
                    </div>
                </header>

                 <div className="mb-4">
                    <input type="text" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg"/>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin inline-block text-blue-500" /></div>
                : viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredContatos.map(c => <ContatoCard key={c.id} contato={c} onEdit={handleOpenModal} onDelete={handleDelete} />)}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Telefone</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredContatos.map(c => <ContatoListItem key={c.id} contato={c} onEdit={handleOpenModal} onDelete={handleDelete} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <ContatoForm 
                        onSave={handleSave}
                        initialData={selectedContato}
                        onClose={handleCloseModal}
                    />
                </div>
            )}
        </div>
    );
}