import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, ShieldCheck, PlusCircle, Loader2, X, Pencil, Trash2, AlertTriangle, Save, Undo2 } from 'lucide-react';

// --- Componentes de UI (ConfirmationModal, RoleModal, RolePermissions) permanecem os mesmos da versão anterior ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => { const [isDeleting, setIsDeleting] = useState(false); if (!isOpen) return null; const handleConfirm = async () => { setIsDeleting(true); await onConfirm(); setIsDeleting(false); }; return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"> <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"> <div className="flex items-start"> <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10"> <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" /> </div> <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"> <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100">{title}</h3> <div className="mt-2"> <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p> </div> </div> </div> <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3"> <button type="button" onClick={handleConfirm} disabled={isDeleting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:bg-red-400"> {isDeleting ? 'Apagando...' : 'Sim, Apagar'} </button> <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"> Cancelar </button> </div> </div> </div> ); };
const RoleModal = ({ isOpen, onClose, onSave, initialData }) => { const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [isSaving, setIsSaving] = useState(false); useEffect(() => { if (initialData) { setName(initialData.name || ''); setDescription(initialData.description || ''); } else { setName(''); setDescription(''); } }, [initialData, isOpen]); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!name.trim()) { alert('O nome do cargo é obrigatório.'); return; } setIsSaving(true); await onSave({ id: initialData?.id, name, description }); setIsSaving(false); }; const isEditing = !!initialData; return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onMouseDown={onClose}> <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onMouseDown={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Editar Cargo' : 'Novo Cargo'}</h3> <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"> <X size={20} className="text-gray-600 dark:text-gray-400" /> </button> </div> <form onSubmit={handleSubmit}> <div className="space-y-4"> <div> <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cargo</label> <input id="role-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Vendedor" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /> </div> <div> <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (opcional)</label> <textarea id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Responsável pelas vendas e contacto com novos clientes." className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" rows="3" /> </div> </div> <div className="flex justify-end gap-4 mt-6"> <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"> Cancelar </button> <button type="submit" disabled={isSaving || !name.trim()} className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600">{isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Cargo')}</button> </div> </form> </div> </div> ); };
const RolePermissions = ({ selectedRole, availablePermissions, onPermissionChange, onSave, onDiscard, isSaving, hasChanges }) => {
    const permissionsByModule = useMemo(() => {
        if (!availablePermissions) return {};
        return availablePermissions.reduce((acc, permission) => {
            const moduleName = permission.name.split(':')[0];
            if (!acc[moduleName]) { acc[moduleName] = []; }
            acc[moduleName].push(permission);
            return acc;
        }, {});
    }, [availablePermissions]);

    if (!selectedRole) { return ( <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg"> <ShieldCheck size={48} className="mb-4 text-gray-400" /> <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Selecione um Cargo</h3> <p>Escolha um cargo à esquerda para ver e editar as suas permissões.</p> </div> ); }
    const handleSelectAllModule = (modulePermissions, isChecked) => { modulePermissions.forEach(permission => { onPermissionChange(permission.name, isChecked); }); };
    
    return ( <div> <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700"> <div> <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedRole.name}</h2> <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRole.description || 'Sem descrição.'}</p> </div> {hasChanges && ( <div className="flex items-center gap-3"> <button onClick={onDiscard} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"><Undo2 size={16} /> Descartar</button> <button onClick={onSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600">{isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar Alterações</>}</button> </div> )} </div> <div className="space-y-8"> {Object.entries(permissionsByModule).map(([moduleName, permissions]) => { const allInModuleSelected = permissions.every(p => (selectedRole.permissions || []).includes(p.name)); return ( <div key={moduleName}> <div className="flex justify-between items-center mb-3 border-b pb-2 dark:border-gray-700"> <h4 className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{moduleName}</h4> <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer"> <input type="checkbox" className="h-4 w-4 rounded" checked={allInModuleSelected} onChange={(e) => handleSelectAllModule(permissions, e.target.checked)} /> Selecionar Todas </label> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"> {permissions.map(permission => ( <label key={permission.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"> <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500" checked={(selectedRole.permissions || []).includes(permission.name)} onChange={(e) => onPermissionChange(permission.name, e.target.checked)} /> <span className="text-sm text-gray-800 dark:text-gray-200">{permission.description || permission.name}</span> </label> ))} </div> </div> ); })} </div> </div> );
};

// --- Componente Principal da Página (Com Tratamento de Erro Robusto) ---
export default function CargosEPermissoesPage() {
    const { profile } = useAuth();
    const [roles, setRoles] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // NOVO: Estado para armazenar a mensagem de erro
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [dirtyPermissions, setDirtyPermissions] = useState(null);

    // ALTERADO: Lógica de busca de dados agora é mais robusta
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Usamos Promise.all para executar as consultas em paralelo
            const [rolesResponse, permissionsResponse] = await Promise.all([
                supabase.from('roles').select('*').order('name', { ascending: true }),
                supabase.from('permissions').select('*').order('name')
            ]);

            const { data: rolesData, error: rolesError } = rolesResponse;
            if (rolesError) throw rolesError; // Lança o erro para o bloco catch

            const { data: permissionsData, error: permissionsError } = permissionsResponse;
            if (permissionsError) throw permissionsError; // Lança o erro para o bloco catch

            setRoles(rolesData || []);
            setAvailablePermissions(permissionsData || []);

        } catch (err) {
            // NOVO: Captura qualquer erro que ocorra durante a busca
            console.error("--- ERRO AO BUSCAR DADOS PARA PÁGINA DE CARGOS ---", err);
            setError(`Não foi possível carregar os dados. Erro: ${err.message}`);
        } finally {
            // NOVO: Garante que o loading sempre termina, mesmo que haja um erro
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePermissionChange = (permissionName, isChecked) => { if (!selectedRole) return; const currentPermissions = dirtyPermissions ?? selectedRole.permissions ?? []; const updatedPermissions = isChecked ? [...currentPermissions, permissionName] : currentPermissions.filter(p => p !== permissionName); setDirtyPermissions(updatedPermissions); };
    const handleSaveChanges = async () => { if (!selectedRole || dirtyPermissions === null) return; setIsSaving(true); const { error } = await supabase.from('roles').update({ permissions: dirtyPermissions }).eq('id', selectedRole.id); if (error) { console.error("Erro ao salvar permissões:", error); alert("Ocorreu um erro ao salvar as permissões."); } else { const updatedRole = { ...selectedRole, permissions: dirtyPermissions }; setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r)); setSelectedRole(updatedRole); setDirtyPermissions(null); } setIsSaving(false); };
    const handleDiscardChanges = () => { setDirtyPermissions(null); };
    const handleSelectRole = (role) => { if (dirtyPermissions) { if (window.confirm('Você tem alterações não salvas. Deseja descartá-las?')) { setSelectedRole(role); setDirtyPermissions(null); } } else { setSelectedRole(role); } };
    const handleOpenModal = (role = null) => { setEditingRole(role); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingRole(null); };
    const handleSaveRole = async (roleData) => { if (!profile?.tenant_id) { alert("Erro: não foi possível identificar a sua empresa."); return; } if (editingRole) { const { data, error } = await supabase.from('roles').update({ name: roleData.name, description: roleData.description }).eq('id', editingRole.id).select().single(); if (error) { alert('Erro ao atualizar o cargo: ' + error.message); } else if (data) { const updatedRoles = roles.map(r => (r.id === data.id ? { ...r, ...data } : r)).sort((a, b) => a.name.localeCompare(b.name)); setRoles(updatedRoles); setSelectedRole(prev => prev.id === data.id ? { ...prev, ...data } : prev); handleCloseModal(); } } else { const { data, error } = await supabase.from('roles').insert([{ name: roleData.name, description: roleData.description, tenant_id: profile.tenant_id, permissions: [] }]).select().single(); if (error) { alert('Erro ao criar o cargo: ' + error.message); } else if (data) { setRoles(prevRoles => [...prevRoles, data].sort((a, b) => a.name.localeCompare(b.name))); setSelectedRole(data); handleCloseModal(); } } };
    const executeDelete = async () => { if (!roleToDelete) return; const { error } = await supabase.from('roles').delete().eq('id', roleToDelete.id); if (error) { console.error("Erro ao apagar cargo:", error); alert("Não foi possível apagar o cargo: " + error.message); } else { setRoles(roles.filter(r => r.id !== roleToDelete.id)); if (selectedRole?.id === roleToDelete.id) { setSelectedRole(null); } } setRoleToDelete(null); };

    // ALTERADO: A renderização agora trata o estado de loading e erro de forma explícita
    const renderContent = () => {
        if (loading) {
            return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin mr-2" /> A carregar cargos e permissões...</div>;
        }
        if (error) {
            return <div className="p-8 text-center text-red-500 flex items-center justify-center h-full"><AlertTriangle size={24} className="mr-2" /> {error}</div>;
        }
        return (
            <div className="flex flex-grow overflow-hidden">
                <aside className="w-1/3 max-w-xs border-r p-4 space-y-2 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/50 overflow-y-auto">
                    {roles.map(role => ( <div key={role.id} className="group relative"> <button onClick={() => handleSelectRole(role)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3 ${selectedRole?.id === role.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}> <Shield size={16} /> {role.name} </button> <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"> <button onClick={() => handleOpenModal(role)} className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300"><Pencil size={14} /></button> <button onClick={() => setRoleToDelete(role)} className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"><Trash2 size={14} /></button> </div> </div> ))}
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"> <PlusCircle size={18} /> Novo Cargo </button>
                </aside>
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <RolePermissions selectedRole={selectedRole ? { ...selectedRole, permissions: dirtyPermissions ?? selectedRole.permissions ?? [] } : null} availablePermissions={availablePermissions} onPermissionChange={handlePermissionChange} onSave={handleSaveChanges} onDiscard={handleDiscardChanges} isSaving={isSaving} hasChanges={dirtyPermissions !== null} />
                </main>
            </div>
        );
    };

    return (
        <>
            <RoleModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRole} initialData={editingRole} />
            <ConfirmationModal isOpen={!!roleToDelete} onClose={() => setRoleToDelete(null)} onConfirm={executeDelete} title={`Apagar Cargo "${roleToDelete?.name}"`}>
                Tem a certeza de que quer apagar este cargo? Esta ação é irreversível. Os utilizadores associados a este cargo não serão apagados, mas perderão estas permissões.
            </ConfirmationModal>
            <div className="flex h-full flex-col bg-white dark:bg-gray-900">
                <header className="border-b dark:border-gray-700 p-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cargos e Permissões</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Crie e gira os cargos da sua equipe para controlar o que cada um pode ver e fazer.</p>
                </header>
                {renderContent()}
            </div>
        </>
    );
}