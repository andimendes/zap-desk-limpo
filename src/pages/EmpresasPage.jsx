import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { PlusCircle, Search, Building, Edit, Trash2 } from 'lucide-react';
import EmpresaFormUnificado from '../components/empresas/EmpresaFormUnificado';

// Componente para exibir cada empresa na lista
const EmpresaCard = ({ empresa, onEdit, onDelete }) => {
    const statusCores = {
        'Potencial': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Cliente Ativo': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Inativo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Building className="w-6 h-6 text-gray-400" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{empresa.nome_fantasia || empresa.razao_social}</h3>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCores[empresa.status]}`}>{empresa.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-9">{empresa.razao_social}</p>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end items-center gap-2">
                 <button onClick={() => onEdit(empresa)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Edit size={18} />
                </button>
                <button onClick={() => onDelete(empresa.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};


// Componente principal da página
function EmpresasPage() {
    // --- Gestão de Estado ---
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Controlo do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);

    // --- Busca de Dados ---
    const fetchEmpresas = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('crm_empresas')
            .select('*')
            .order('nome_fantasia', { ascending: true });

        if (error) {
            console.error('Erro ao buscar empresas:', error);
            setError('Não foi possível carregar as empresas.');
        } else {
            setEmpresas(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);
    
    // --- Lógica de Filtro ---
    const filteredEmpresas = useMemo(() => {
        if (!searchTerm) return empresas;
        const lowercasedTerm = searchTerm.toLowerCase();
        return empresas.filter(emp =>
            (emp.nome_fantasia && emp.nome_fantasia.toLowerCase().includes(lowercasedTerm)) ||
            (emp.razao_social && emp.razao_social.toLowerCase().includes(lowercasedTerm)) ||
            (emp.cnpj && emp.cnpj.includes(searchTerm))
        );
    }, [empresas, searchTerm]);

    // --- Funções de Ação (Handlers) ---
    const handleOpenCreateModal = () => {
        setSelectedEmpresa({});
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (empresa) => {
        setSelectedEmpresa(empresa);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmpresa(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchEmpresas();
    };
    
    const handleDelete = async (empresaId) => {
        if (window.confirm('Tem a certeza de que quer excluir esta empresa?')) {
            const { error } = await supabase.from('crm_empresas').delete().eq('id', empresaId);
            if (error) {
                alert('Erro ao excluir empresa: ' + error.message);
            } else {
                fetchEmpresas();
            }
        }
    };
    
    // --- Renderização ---
    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="max-w-full mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Central de Empresas</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gira os seus clientes e contatos num só lugar.</p>
                    </div>
                    <button onClick={handleOpenCreateModal} className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm">
                        <PlusCircle size={20} /> Nova Empresa
                    </button>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, razão social ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>

                {loading && <div className="text-center p-8"><span className="text-lg">A carregar empresas...</span></div>}
                {error && <div className="text-center p-8 text-red-500">{error}</div>}

                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmpresas.map(empresa => (
                            <EmpresaCard key={empresa.id} empresa={empresa} onEdit={handleOpenEditModal} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
                 {filteredEmpresas.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Nenhuma empresa encontrada.</p>}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <EmpresaFormUnificado
                        initialData={selectedEmpresa}
                        tabelaAlvo="crm_empresas"
                        onClose={handleCloseModal}
                        onSave={handleSaveSuccess}
                    />
                </div>
            )}
        </div>
    );
}

export default EmpresasPage;