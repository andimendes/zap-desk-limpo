import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { PlusCircle, X } from 'lucide-react';

// --- Modal para Convidar Utilizador ---
const InviteUserModal = ({ isOpen, onClose, onInvite, roles }) => {
    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setSelectedRoles([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRoleChange = (roleId) => {
        setSelectedRoles(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        await onInvite(email, selectedRoles);
        setIsInviting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Convidar Novo Utilizador</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail do Convidado</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@exemplo.com" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Atribuir Cargos</label>
                            <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg max-h-48 overflow-y-auto dark:border-gray-600">
                                {roles.map(role => (
                                    <label key={role.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => handleRoleChange(role.id)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isInviting || !email} className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600">
                            {isInviting ? 'Enviando...' : 'Enviar Convite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' }`}>
        {status === 'ativo' ? 'Ativo' : 'Convidado'}
    </span>
);

export default function GestaoDeEquipaPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profilesRes, rolesRes, userRolesRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('roles').select('*'),
                supabase.from('user_roles').select('*')
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (rolesRes.error) throw rolesRes.error;
            if (userRolesRes.error) throw userRolesRes.error;

            const profilesData = profilesRes.data;
            const rolesData = rolesRes.data;
            const userRolesData = userRolesRes.data;

            const usersWithRoles = profilesData.map(profile => {
                const roleLinks = userRolesData.filter(link => link.user_id === profile.id);
                const userRoles = roleLinks.map(link => rolesData.find(role => role.id === link.role_id)).filter(Boolean); 
                return { ...profile, roles: userRoles };
            });

            setUsers(usersWithRoles);
            setRoles(rolesData);

        } catch (error) {
            console.error("Erro ao carregar dados da equipa:", error);
            alert("Não foi possível carregar a equipa. Verifique a consola para mais detalhes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // <-- MUDANÇA AQUI: A lógica de convite foi implementada -->
    const handleInviteUser = async (email, roleIds) => {
        // 1. Convidar o utilizador através da API de Admin do Supabase
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
        
        if (inviteError) {
            console.error("Erro ao convidar utilizador:", inviteError);
            alert("Erro ao enviar convite: " + inviteError.message);
            return;
        }

        // 2. Se o convite foi enviado com sucesso, atribuir os cargos na nossa tabela `user_roles`
        if (inviteData.user && roleIds.length > 0) {
            const userRolesToInsert = roleIds.map(roleId => ({
                user_id: inviteData.user.id,
                role_id: roleId
            }));

            const { error: rolesError } = await supabase.from('user_roles').insert(userRolesToInsert);

            if (rolesError) {
                console.error("Erro ao atribuir cargos:", rolesError);
                alert("Utilizador convidado, mas ocorreu um erro ao atribuir os cargos.");
            }
        }
        
        alert("Convite enviado com sucesso!");
        fetchData(); // Recarrega os dados para mostrar o novo utilizador convidado
    };

    if (loading) {
        return <div className="p-8 text-center dark:text-gray-200">A carregar equipa...</div>;
    }

    return (
        <>
            <InviteUserModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInvite={handleInviteUser}
                roles={roles}
            />
            <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-full">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestão da Equipa</h1>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
                            <PlusCircle size={20} className="mr-2" />
                            Convidar Utilizador
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cargos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=random`} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.full_name || '(Aguardando convite)'}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {(user.roles || []).map(role => (
                                                    <span key={role.id} className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={user.full_name ? 'ativo' : 'convidado'} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
