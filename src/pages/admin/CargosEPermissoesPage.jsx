import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient'; 
import { PERMISSIONS_MAP } from '../../config/permissionsMap';
import { ShieldCheck, PlusCircle, Loader2, X, Pencil, Trash2, AlertTriangle } from 'lucide-react'; // <-- MUDANÇA: Adicionado Trash2 e AlertTriangle

// <-- NOVO: Componente para o Modal de Confirmação ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:bg-red-400"
                    >
                        {isDeleting ? 'Apagando...' : 'Sim, Apagar'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componente do Modal para criar/editar um Cargo ---
const RoleModal = ({ isOpen, onClose, onSave, initialData }) => {
    // ... (este componente não muda)
    const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [isSaving, setIsSaving] = useState(false);
    useEffect(() => { if (initialData) { setName(initialData.name || ''); setDescription(initialData.description || ''); } else { setName(''); setDescription(''); } }, [initialData, isOpen]);
    if (!isOpen) return null;
    const handleSubmit = async (e) => { e.preventDefault(); if (!name.trim()) { alert('O nome do cargo é obrigatório.'); return; } setIsSaving(true); await onSave({ id: initialData?.id, name, description }); setIsSaving(false); };
    const isEditing = !!initialData;
    return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onMouseDown={onClose}> <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onMouseDown={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Editar Cargo' : 'Novo Cargo'}</h3> <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"> <X size={20} className="text-gray-600 dark:text-gray-400" /> </button> </div> <form onSubmit={handleSubmit}> <div className="space-y-4"> <div> <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cargo</label> <input id="role-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Vendedor" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /> </div> <div> <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (opcional)</label> <textarea id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Responsável pelas vendas e contacto com novos clientes." className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" rows="3" /> </div> </div> <div className="flex justify-end gap-4 mt-6"> <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"> Cancelar </button> <button type="submit" disabled={isSaving || !name.trim()} className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600">{isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Cargo')}</button> </div> </form> </div> </div> );
};

// --- Componente do Painel Direito (Detalhes e Permissões) ---
const RolePermissions = ({ selectedRole, onPermissionChange, isSaving }) => {
    // ... (este componente não muda)
    if (!selectedRole) { return ( <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400"> <ShieldCheck size={48} className="mb-4" /> <h3 className="text-lg font-semibold">Selecione um Cargo</h3> <p>Escolha um cargo à esquerda para ver e editar as suas permissões.</p> </div> ); }
    return ( <div> <div className="flex justify-between items-center mb-4"> <div> <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedRole.name}</h2> <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRole.description || 'Sem descrição.'}</p> </div> {isSaving && ( <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"> <Loader2 size={16} className="animate-spin" /> Salvando... </div> )} </div> <div className="space-y-6"> {PERMISSIONS_MAP.map(module => ( <div key={module.module}> <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 dark:border-gray-700">{module.module}</h4> <div className="space-y-3"> {module.permissions.map(permission => ( <label key={permission.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"> <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500" checked={(selectedRole.permissions || []).includes(permission.id)} onChange={(e) => onPermissionChange(permission.id, e.target.checked)} /> <span className="text-sm text-gray-800 dark:text-gray-200">{permission.label}</span> </label> ))} </div> </div> ))} </div> </div> );
};

// --- Componente Principal da Página ---
export default function CargosEPermissoesPage() {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleToDelete, setRoleToDelete] = useState(null); // <-- NOVO: Estado para o cargo a ser apagado

    const fetchRoles = useCallback(async () => { /*...*/ setLoading(true); const { data, error } = await supabase.from('roles').select('*').order('name', { ascending: true }); if (error) { console.error("Erro ao buscar cargos:", error); alert("Não foi possível carregar os cargos."); } else { setRoles(data); } setLoading(false); }, []);
    useEffect(() => { fetchRoles(); }, [fetchRoles]);
    const handlePermissionChange = async (permissionId, isChecked) => { /*...*/ if (!selectedRole) return; setIsSaving(true); const currentPermissions = selectedRole.permissions || []; const updatedPermissions = isChecked ? [...currentPermissions, permissionId] : currentPermissions.filter(p => p !== permissionId); const updatedRole = { ...selectedRole, permissions: updatedPermissions }; setSelectedRole(updatedRole); setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r)); const { error } = await supabase.from('roles').update({ permissions: updatedPermissions }).eq('id', selectedRole.id); if (error) { console.error("Erro ao salvar permissão:", error); alert("Ocorreu um erro ao salvar a permissão."); fetchRoles(); } setTimeout(() => setIsSaving(false), 500); };
    const handleOpenModal = (role = null) => { setEditingRole(role); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingRole(null); };
    const handleSaveRole = async (roleData) => { /*...*/ if (editingRole) { const { data, error } = await supabase.from('roles').update({ name: roleData.name, description: roleData.description }).eq('id', editingRole.id).select().single(); if (error) { alert('Erro ao atualizar o cargo: ' + error.message); } else if (data) { setRoles(roles.map(r => (r.id === data.id ? data : r)).sort((a, b) => a.name.localeCompare(b.name))); setSelectedRole(data); handleCloseModal(); } } else { const { data, error } = await supabase.from('roles').insert([{ name: roleData.name, description: roleData.description }]).select().single(); if (error) { alert('Erro ao criar o cargo: ' + error.message); } else if (data) { setRoles(prevRoles => [...prevRoles, data].sort((a, b) => a.name.localeCompare(b.name))); setSelectedRole(data); handleCloseModal(); } } };

    // <-- NOVO: Função para executar a exclusão
    const executeDelete = async () => {
        if (!roleToDelete) return;

        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', roleToDelete.id);
        
        if (error) {
            console.error("Erro ao apagar cargo:", error);
            alert("Não foi possível apagar o cargo: " + error.message);
        } else {
            // Remove o cargo da lista local e deseleciona se for o caso
            setRoles(roles.filter(r => r.id !== roleToDelete.id));
            if (selectedRole?.id === roleToDelete.id) {
                setSelectedRole(null);
            }
        }
        setRoleToDelete(null); // Fecha o modal de confirmação
    };

    if (loading) { return <div className="p-8 text-center dark:text-gray-200">A carregar cargos...</div>; }

    return (
        <>
            <RoleModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRole} initialData={editingRole} />
            {/* <-- NOVO: Renderiza o modal de confirmação */}
            <ConfirmationModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={executeDelete}
                title={`Apagar Cargo "${roleToDelete?.name}"`}
            >
                Tem a certeza de que quer apagar este cargo? Esta ação é irreversível. 
                Os utilizadores associados a este cargo não serão apagados, mas perderão estas permissões.
            </ConfirmationModal>

            <div className="flex h-screen bg-white dark:bg-gray-900">
                <aside className="w-1/4 border-r p-4 space-y-2 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/50">
                    <h3 className="text-lg font-bold px-2 mb-2 text-gray-800 dark:text-gray-100">Cargos</h3>
                    {roles.map(role => (
                        <div key={role.id} className="group relative">
                            <button onClick={() => setSelectedRole(role)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedRole?.id === role.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}>
                                {role.name}
                            </button>
                            {/* <-- MUDANÇA: Adicionado o ícone de lixo */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                <button onClick={() => handleOpenModal(role)} className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => setRoleToDelete(role)} className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50">
                        <PlusCircle size={18} />
                        Novo Cargo
                    </button>
                </aside>
                <main className="w-3/4 p-6 overflow-y-auto">
                    <RolePermissions 
                        selectedRole={selectedRole} 
                        onPermissionChange={handlePermissionChange} 
                        isSaving={isSaving}
                    />
                </main>
            </div>
        </>
    );
}
