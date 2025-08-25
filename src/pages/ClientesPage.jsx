import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ClienteForm from '../components/clientes/ClienteForm';
import { Plus, Edit, Trash2, Building, Star, ChevronDown, ChevronUp, User, Mail, Phone, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
        ${status === 'Ativo' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
        }`}
    >
        {status}
    </span>
);

const ClienteCard = ({ cliente, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const principal = cliente.contatos.find(c => c.is_principal);

    return (
        <div className="
            bg-white rounded-lg shadow-md border overflow-hidden 
            transition-shadow duration-300 hover:shadow-lg
            dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-lg-dark
        "> {/* <-- Estilos do card */}
            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-center mb-2">
                            <Building className="w-5 h-5 text-gray-500 mr-3 dark:text-gray-400" /> {/* <-- Cor do ícone */}
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{cliente.nome_fantasia || cliente.razao_social}</h3> {/* <-- Cor do título */}
                        </div>
                        <p className="text-sm text-gray-600 ml-8 dark:text-gray-300">{cliente.razao_social}</p> {/* <-- Cor do texto secundário */}
                        <p className="text-sm text-gray-500 ml-8 mt-1 dark:text-gray-400">{cliente.cnpj}</p> {/* <-- Cor do texto secundário */}
                    </div>
                    
                    <div className="
                        flex-1 mb-4 md:mb-0 md:mx-4 p-3 rounded-lg
                        bg-gray-50 dark:bg-gray-700/50
                    "> {/* <-- Fundo da caixa de contato */}
                         <p className="font-semibold text-gray-700 text-sm flex items-center mb-1 dark:text-gray-200"><Star size={14} className="text-yellow-500 mr-1.5" /> Contato Principal</p>
                         {principal ? (
                            <>
                                <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300">
                                    <User size={14} className="mr-2 text-gray-400 dark:text-gray-500" /> {principal.nome}
                                </div>
                                {principal.email && (
                                    <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300">
                                        <Mail size={14} className="mr-2 text-gray-400 dark:text-gray-500" /> {principal.email}
                                    </div>
                                )}
                                {principal.telefone && (
                                     <div className="flex items-center text-sm text-gray-600 mt-1 dark:text-gray-300">
                                         <Phone size={14} className="mr-2 text-gray-400 dark:text-gray-500"/> {principal.telefone}
                                     </div>
                                )}
                            </>
                         ) : <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Nenhum contato principal definido.</p>}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <StatusBadge status={cliente.status} />
                        <button onClick={(e) => { e.stopPropagation(); onEdit(cliente); }} className="p-2 text-gray-500 rounded-full transition-colors hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-blue-400"><Edit size={18} /></button> {/* <-- Botões de ação */}
                        <button onClick={(e) => { e.stopPropagation(); onDelete(cliente.id); }} className="p-2 text-gray-500 rounded-full transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"><Trash2 size={18} /></button> {/* <-- Botões de ação */}
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-500 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full"> {/* <-- Botão expandir */}
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 md:p-6 border-t bg-gray-50/50 dark:bg-gray-900/50 dark:border-gray-700"> {/* <-- Área expandida */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">CNPJ</p>
                            <p className="text-gray-800 dark:text-gray-200">{cliente.cnpj}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">E-mail Principal da Empresa</p>
                            <p className="text-gray-800 dark:text-gray-200">{cliente.email_principal || 'Não informado'}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Telefone Principal da Empresa</p>
                            <p className="text-gray-800 dark:text-gray-200">{cliente.telefone_principal || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Plano</p>
                            <p className="text-gray-800 dark:text-gray-200">{cliente.plano || 'Não definido'}</p>
                        </div>
                        {cliente.plano === 'Plano Estratégico' && (
                            <div className="md:col-span-2">
                                <p className="font-medium text-gray-500 dark:text-gray-400">Módulos Contratados</p>
                                {cliente.modulos_contratados && cliente.modulos_contratados.length > 0 ? (
                                    <ul className="list-disc list-inside mt-1 text-gray-800 dark:text-gray-200 space-y-1">
                                        {cliente.modulos_contratados.map(m => <li key={m}>{m}</li>)}
                                    </ul>
                                ) : <p className="text-gray-600 dark:text-gray-300">Nenhum módulo contratado.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange, onItemsPerPageChange, itemsPerPage, totalItems }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <span className="text-gray-600 dark:text-gray-400">Mostrar por página:</span> {/* <-- Texto */}
                {[5, 10, 50].map(size => (
                    <button 
                        key={size}
                        onClick={() => onItemsPerPageChange(size)}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            itemsPerPage === size 
                                ? 'bg-blue-600 text-white font-semibold' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 border dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
                        }`} /* <-- Botões de tamanho */
                    >
                        {size}
                    </button>
                ))}
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"> {/* <-- Texto e cor dos ícones */}
                 <span className="">Página {currentPage} de {totalPages} ({totalItems} clientes)</span>
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronsLeft size={16} /></button>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronsRight size={16} /></button>
            </div>
        </div>
    );
};


export default function ClientesPage() {
    // ... (nenhuma alteração na lógica do componente)
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchClientes = useCallback(async () => {
        setLoading(true);
        const { data: clientesData, error } = await supabase
            .from('clientes')
            .select('*, contatos(*)');
        
        if (error) console.error('Erro ao buscar clientes:', error);
        else setClientes(clientesData || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    const handleOpenModal = (cliente = null) => {
        setSelectedClient(cliente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedClient(null);
    };

    const handleSave = () => {
        handleCloseModal();
        fetchClientes();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem a certeza de que quer apagar este cliente? Esta ação é irreversível.')) {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) alert('Erro ao apagar cliente: ' + error.message);
            else fetchClientes();
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(clientes.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleItemsPerPageChange = (size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };


    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900"> {/* <-- Fundo da página */}
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Clientes</h1> {/* <-- Título da página */}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600" /* <-- Botão principal */
                    >
                        <Plus size={20} className="mr-2" />
                        Novo Cliente
                    </button>
                </div>

                {loading ? (
                    <p className="dark:text-gray-300">A carregar clientes...</p> /* <-- Texto de loading */
                ) : (
                    <>
                        <div className="space-y-4">
                            {currentClientes.map(cliente => (
                                <ClienteCard key={cliente.id} cliente={cliente} onEdit={handleOpenModal} onDelete={handleDelete} />
                            ))}
                        </div>
                        {clientes.length > 0 && (
                             <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={clientes.length}
                             />
                        )}
                    </>
                )}
            </div>

            {/* O modal de ClienteForm também precisará dos estilos dark. 
                A lógica será a mesma aplicada no nosso Modal.jsx genérico da conversa anterior.
             */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <ClienteForm 
                        onSave={handleSave} 
                        initialData={selectedClient}
                        onClose={handleCloseModal}
                    />
                </div>
            )}
        </div>
    );
}
