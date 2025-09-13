import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Building, DollarSign, Users, TrendingUp, AlertTriangle, Loader2, Edit, Lock, Unlock, PlusCircle, Save, X, Copy } from 'lucide-react';

// --- Componentes de UI ---
const StatCard = ({ icon, title, value }) => ( <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"> <div className="flex items-center justify-between"> <div className="text-gray-500 dark:text-gray-400">{icon}</div> </div> <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p> <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p> </div> );
const Modal = ({ isOpen, onClose, title, children }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onMouseDown={onClose}> <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onMouseDown={e => e.stopPropagation()}> <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"> <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3> <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"> <X size={20} /> </button> </div> <div className="p-6">{children}</div> </div> </div> ); };

// Formulário para gerar o convite
const InviteCompanyForm = ({ plans, onGenerate, onCancel }) => {
    const [formData, setFormData] = useState({ p_company_name: '', p_user_email: '', p_initial_plan_id: plans[0]?.id || '', p_is_trial: true });
    const [isSaving, setIsSaving] = useState(false);
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name === 'p_initial_plan_id' ? Number(value) : value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onGenerate(formData);
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium">Nome da Empresa</label><input type="text" name="p_company_name" value={formData.p_company_name} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-lg"/></div>
            <div><label className="block text-sm font-medium">E-mail do Admin da Empresa</label><input type="email" name="p_user_email" value={formData.p_user_email} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-lg"/></div>
            <div><label className="block text-sm font-medium">Plano Inicial</label><select name="p_initial_plan_id" value={formData.p_initial_plan_id} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-lg bg-white"><option value="" disabled>Selecione um plano</option>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></div>
            <div><label className="flex items-center gap-3"><input type="checkbox" name="p_is_trial" checked={formData.p_is_trial} onChange={handleChange} className="h-4 w-4 rounded"/><span>Iniciar com período de teste de 14 dias</span></label></div>
            <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300">Fechar</button><button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700">{isSaving ? 'A Gerar...' : 'Gerar Link de Convite'}</button></div>
        </form>
    );
};

// --- Componente Principal da Página ---
export default function MasterAdminPage() {
    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [clientsRes, plansRes] = await Promise.all([
                supabase.from('master_admin_dashboard_view').select('*').order('signup_date', { ascending: false }),
                supabase.from('plans').select('id, name')
            ]);
            if (clientsRes.error) throw clientsRes.error;
            if (plansRes.error) throw plansRes.error;
            setClients(clientsRes.data || []);
            setPlans(plansRes.data || []);
        } catch (err) {
            setError("Não foi possível carregar os dados. Verifique a consola.");
            console.error("Erro ao carregar dados do painel master:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const handleGenerateInvite = async (formData) => {
        const { data: token, error } = await supabase.rpc('master_create_invitation_token', formData);
        if (error) {
            alert("Erro ao gerar convite: " + error.message);
        } else {
            const inviteLink = `${window.location.origin}/cadastro?invite_token=${token}`;
            setGeneratedLink(inviteLink);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Link copiado para a área de transferência!');
    };
    
    const mrr = useMemo(() => clients.filter(c => c.subscription_status === 'active').reduce((acc, client) => acc + parseFloat(client.plan_price || 0), 0), [clients]);
    const activeClients = useMemo(() => clients.filter(c => c.subscription_status === 'active').length, [clients]);

    if (loading) { return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin mr-2" /> A carregar...</div>; }
    if (error) { return <div className="p-8 text-center text-red-500 flex items-center justify-center h-full"><AlertTriangle size={24} className="mr-2" /> {error}</div>; }

    return (
        <>
            <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div><h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Painel de Controlo Master</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral de todas as empresas e finanças do SaaS.</p></div>
                    <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm"><PlusCircle size={20} />Nova Empresa</button>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={<DollarSign />} title="Receita Mensal (MRR)" value={`R$ ${mrr.toFixed(2)}`} />
                    <StatCard icon={<Users />} title="Clientes Ativos" value={activeClients} />
                    <StatCard icon={<Building />} title="Total de Empresas" value={clients.length} />
                    <StatCard icon={<TrendingUp />} title="Novos Clientes (Mês)" value="0" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Empresa</th><th className="px-6 py-3 text-left text-xs font-bold uppercase">Plano</th><th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-bold uppercase">Data de Cadastro</th><th className="px-6 py-3 text-left text-xs font-bold uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {clients.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">Nenhuma empresa encontrada.</td></tr>
                                ) : (
                                    clients.map(client => (
                                        <tr key={client.tenant_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{client.company_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{client.plan_name || 'Nenhum'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{client.subscription_status || 'Sem contrato'}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(client.signup_date).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                                                <button className="text-blue-600 hover:text-blue-800" title="Gerir Subscrição (a implementar)"><Edit size={16}/></button>
                                                <button className="text-red-600 hover:text-red-800" title="Bloquear / Desbloquear"><Lock size={16}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Modal isOpen={isInviteModalOpen} onClose={() => { setIsInviteModalOpen(false); setGeneratedLink(null); }} title={!generatedLink ? "Gerar Convite para Nova Empresa" : "Link de Convite Gerado"}>
                {!generatedLink ? (
                    <InviteCompanyForm plans={plans} onGenerate={handleGenerateInvite} onCancel={() => setIsInviteModalOpen(false)} />
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">Envie este link para o administrador da nova empresa. Ele irá usá-lo para completar o registo e definir a sua própria senha.</p>
                        <input type="text" readOnly value={generatedLink} className="w-full p-2 border rounded-lg bg-gray-100" />
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={copyLink} className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Copy size={16} />Copiar Link</button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}