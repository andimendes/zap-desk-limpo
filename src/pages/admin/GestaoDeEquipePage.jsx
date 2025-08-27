import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { UserPlus, X, Save, LoaderCircle, Pencil } from 'lucide-react';

// --- Componente do Modal de Edição (sem alterações) ---
const EditUserModal = ({ user, allRoles, onClose, onSave, isSaving }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setSelectedRole(user.role || '');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, { name, email, role: selectedRole }); 
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Utilizador</h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input id="userName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                <input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Atribuir Cargo
              </label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                {allRoles.map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end items-center gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-300">
              {isSaving ? <><LoaderCircle size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---
const GestaoDeEquipaPage = () => {
    const [team, setTeam] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchTeamAndRoles = useCallback(async () => {
        setLoading(true);
        
        const { data: teamData, error: teamError } = await supabase.functions.invoke('get-team-members');
        const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');

        if (teamError) console.error("Erro ao buscar equipa:", teamError.message);
        if (rolesError) console.error("Erro ao buscar cargos:", rolesError.message);

        // <-- DEBUG 1: VER O QUE RECEBEMOS DA FUNÇÃO
        console.log('Dados recebidos da Edge Function:', teamData);

        setTeam(teamData?.teamMembers || []);
        setRoles(rolesData || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTeamAndRoles();
    }, [fetchTeamAndRoles]);

    const handleSaveUser = async (userId, updatedData) => {
        setIsSaving(true);
        alert(`Funcionalidade de salvar ainda não implementada.\nUserId: ${userId}\nNovos Dados: ${JSON.stringify(updatedData)}`);
        setIsSaving(false);
        setEditingUser(null);
        fetchTeamAndRoles();
    };

    // <-- DEBUG 2: VER O QUE ESTÁ NO ESTADO ANTES DE RENDERIZAR
    console.log("Estado 'team' que será renderizado na tabela:", team);

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestão da Equipe</h1>
                    <button onClick={() => setInviteModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                        <UserPlus size={20} /> Convidar Utilizador
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Cargo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Status do Convite</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-4 text-gray-500 dark:text-gray-400">A carregar equipe...</td></tr>
                            ) : team.map(member => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full object-cover" src={`https://ui-avatars.com/api/?name=${member.name ? member.name.replace(' ', '+') : 'NU'}&background=random`} alt={member.name} />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">{member.role}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Aceite' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setEditingUser(member)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                                            <Pencil size={14} /> Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isInviteModalOpen && <InviteUserModal roles={roles} onClose={() => setInviteModalOpen(false)} onInviteSent={fetchTeamAndRoles} />}
            
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    allRoles={roles}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

// O componente InviteUserModal permanece o mesmo por enquanto
const InviteUserModal = ({ roles, onClose, onInviteSent }) => {
    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const handleRoleToggle = (roleName) => {
        setSelectedRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName]);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setFeedback({ type: '', message: '' });
        try {
            const { error } = await supabase.functions.invoke('invite-user', {
                body: { email, roles: selectedRoles },
            });
            if (error) throw new Error(error.message);
            setFeedback({ type: 'success', message: 'Convite enviado com sucesso!' });
            setTimeout(() => { onClose(); onInviteSent(); }, 2000);
        } catch (error) {
            setFeedback({ type: 'error', message: `Erro ao enviar convite: ${error.message}` });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleInvite}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Convidar Novo Utilizador</h3>
                            <button type="button" onClick={onClose}><X className="text-gray-500 dark:text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail do Convidado</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Atribuir Cargos</label>
                                <div className="mt-2 space-y-2">
                                    {roles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={selectedRoles.includes(role.name)} onChange={() => handleRoleToggle(role.name)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                            <span className="text-gray-700 dark:text-gray-300">{role.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end items-center gap-4">
                        {feedback.message && <p className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</p>}
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSending} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-blue-300">{isSending ? 'Enviando...' : 'Enviar Convite'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GestaoDeEquipaPage;
