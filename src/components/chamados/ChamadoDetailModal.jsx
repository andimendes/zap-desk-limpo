import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
    X, FileText, MessageSquare, ListTodo, History, PlusCircle, Edit, Trash2, 
    User, Building, Mail, Phone, Calendar, Flag, Clock, Briefcase, CheckCircle
} from 'lucide-react';

// Sub-componente para criar um avatar com as iniciais do nome
const Avatar = ({ nome }) => {
    const iniciais = nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
    return (
        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
            {iniciais}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function ChamadoDetailModal({ chamado, onClose, onChamadoUpdated }) {
    const [activeTab, setActiveTab] = useState('geral');
    const { profile } = useAuth();
    const [chamadoData, setChamadoData] = useState(chamado);

    useEffect(() => {
        setChamadoData(chamado);
    }, [chamado]);

    const handleInternalUpdate = () => {
        onChamadoUpdated();
    };

    const TabButton = ({ id, label, icon }) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {icon} {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'geral': return <AbaGeral chamado={chamadoData} onUpdate={handleInternalUpdate} />;
            case 'anotacoes': return <AbaAnotacoes chamado={chamadoData} profile={profile} />;
            case 'tarefas': return <AbaTarefas chamado={chamadoData} profile={profile} onUpdate={handleInternalUpdate} />;
            case 'historico': return <AbaHistorico chamado={chamadoData} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-start p-6 border-b">
                    <div>
                        <p className="text-sm text-gray-500">#{chamadoData.id.substring(0, 8)}</p>
                        <h2 className="text-2xl font-bold text-gray-800">{chamadoData.titulo}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={24} className="text-gray-500"/>
                    </button>
                </div>

                <div className="flex flex-grow overflow-hidden">
                    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                        <div className="flex border-b mb-6 space-x-2">
                            <TabButton id="geral" label="Geral" icon={<FileText size={16}/>} />
                            <TabButton id="anotacoes" label="Anotações" icon={<MessageSquare size={16}/>} />
                            <TabButton id="tarefas" label="Tarefas" icon={<ListTodo size={16}/>} />
                            <TabButton id="historico" label="Histórico" icon={<History size={16}/>} />
                        </div>
                        <div className="flex-grow">
                            {renderContent()}
                        </div>
                    </div>

                    <aside className="w-1/3 bg-gray-50 border-l p-6 overflow-y-auto">
                        <InfoPanel chamado={chamadoData} />
                        <ActionPanel chamado={chamadoData} />
                    </aside>
                </div>
            </div>
        </div>
    );
}

// --- PAINEL DE INFORMAÇÕES (BARRA LATERAL) ---
const InfoPanel = ({ chamado }) => {
    const statusCores = { 'Aberto': 'bg-blue-100 text-blue-700', 'Em Andamento': 'bg-yellow-100 text-yellow-700', 'Aguardando Cliente': 'bg-purple-100 text-purple-700', 'Resolvido': 'bg-green-100 text-green-700', 'Cancelado': 'bg-gray-100 text-gray-700' };
    const prioridadeCores = { 'Urgente': 'text-red-600', 'Alta': 'text-yellow-600', 'Normal': 'text-blue-600', 'Baixa': 'text-green-600' };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-gray-700 mb-3">Detalhes</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${statusCores[chamado.status]}`}>{chamado.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Prioridade</span>
                        <span className={`font-semibold flex items-center gap-1.5 ${prioridadeCores[chamado.prioridade]}`}><Flag size={14} /> {chamado.prioridade}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Aberto em</span>
                        <span className="text-gray-800">{new Date(chamado.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            </div>
            <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Cliente</h4>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building className="text-blue-600" /></div>
                    <div>
                        <p className="font-bold text-gray-800">{chamado.clientes?.nome_fantasia || chamado.clientes?.razao_social}</p>
                        <p className="text-sm text-gray-500">{chamado.clientes?.razao_social}</p>
                    </div>
                </div>
            </div>
            <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Atendente</h4>
                <div className="flex items-center gap-3">
                    <Avatar nome={chamado.atendente?.full_name} />
                    <div>
                        <p className="font-bold text-gray-800">{chamado.atendente?.full_name || 'Não atribuído'}</p>
                        <p className="text-sm text-gray-500">Responsável pelo chamado</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAINEL DE AÇÕES (BARRA LATERAL) ---
const ActionPanel = ({ chamado }) => {
    const principal = chamado.clientes?.contatos?.find(c => c.is_principal);
    const email = chamado.clientes?.email_principal || principal?.email;
    const telefone = chamado.clientes?.telefone_principal || principal?.telefone;
    const telefoneNumeros = telefone?.replace(/\D/g, '');

    const ActionButton = ({ icon, label, href, disabled }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center gap-3 p-3 text-sm font-medium rounded-lg transition-colors ${disabled ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}>
            {icon}
            <span>{label}</span>
        </a>
    );

    const WhatsAppIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.505 1.905 6.344l-1.225 4.429 4.57-1.202z" />
        </svg>
    );

    return (
        <div className="border-t pt-6 mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">Ações Rápidas</h4>
            <div className="space-y-2">
                <ActionButton icon={<Mail size={18} className="text-blue-500" />} label="Enviar E-mail" href={`mailto:${email}`} disabled={!email} />
                <ActionButton icon={<WhatsAppIcon />} label="Chamar no WhatsApp" href={`https://wa.me/${telefoneNumeros}`} disabled={!telefoneNumeros} />
                <ActionButton icon={<Phone size={18} className="text-purple-500" />} label="Iniciar Chamada (SIP)" href={`tel:${telefoneNumeros}`} disabled={!telefoneNumeros} />
                <ActionButton icon={<Calendar size={18} className="text-red-500" />} label="Agendar Reunião" href="#" disabled />
            </div>
        </div>
    );
};


// --- ABAS DE CONTEÚDO ---

// **INÍCIO DA CORREÇÃO** - Código das abas restaurado
const AbaGeral = ({ chamado, onUpdate }) => {
    const [editData, setEditData] = useState({ ...chamado, atendente_id: chamado.atendente_id || '' });
    const [agentes, setAgentes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { supabase.from('profiles').select('id, full_name').then(({ data }) => setAgentes(data || [])); }, []);
    const handleChange = (e) => setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUpdate = async () => {
        setLoading(true); setError(null);
        const { error: updateError } = await supabase.from('chamados').update({
            titulo: editData.titulo,
            descricao: editData.descricao,
            status: editData.status,
            prioridade: editData.prioridade,
            atendente_id: editData.atendente_id || null
        }).eq('id', chamado.id);
        if (updateError) setError(updateError.message); else onUpdate();
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-500">Título</label><input type="text" name="titulo" value={editData.titulo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" /></div>
            <div><label className="block text-sm font-medium text-gray-500">Descrição</label><textarea name="descricao" rows="5" value={editData.descricao} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"></textarea></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-500">Status</label><select name="status" value={editData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option>Aberto</option><option>Em Andamento</option><option>Aguardando Cliente</option><option>Resolvido</option><option>Cancelado</option></select></div>
                <div><label className="block text-sm font-medium text-gray-500">Prioridade</label><select name="prioridade" value={editData.prioridade} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
                <div><label className="block text-sm font-medium text-gray-500">Atribuído a</label><select name="atendente_id" value={editData.atendente_id} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option value="">Ninguém</option>{agentes.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select></div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={handleUpdate} disabled={loading} className="py-2 px-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-green-300">{loading ? 'Salvando...' : 'Salvar Alterações'}</button></div>
        </div>
    );
};

const AbaAnotacoes = ({ chamado, profile }) => {
    const [anotacoes, setAnotacoes] = useState([]);
    const [novaAnotacao, setNovaAnotacao] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');

    const fetchAnotacoes = useCallback(async () => {
        const { data } = await supabase.from('anotacoes').select('*').eq('chamado_id', chamado.id).order('created_at', { ascending: false });
        setAnotacoes(data || []);
    }, [chamado.id]);

    useEffect(() => { fetchAnotacoes(); }, [fetchAnotacoes]);

    const handleAddAnotacao = async () => {
        if (novaAnotacao.trim() === '') return;
        const { data } = await supabase.from('anotacoes').insert({ chamado_id: chamado.id, conteudo: novaAnotacao, usuario_id: profile.id, usuario_nome: profile.full_name }).select().single();
        if (data) {
            setAnotacoes(prev => [data, ...prev]);
            await supabase.from('historico_chamados').insert({ chamado_id: chamado.id, usuario_id: profile.id, usuario_nome: profile.full_name, acao: `Adicionou anotação: "${novaAnotacao}"` });
        }
        setNovaAnotacao('');
    };

    const handleDeleteAnotacao = async (id) => {
        if (window.confirm('Tem a certeza que quer apagar esta anotação?')) {
            await supabase.from('anotacoes').delete().eq('id', id);
            fetchAnotacoes();
        }
    };

    const handleUpdateAnotacao = async (id) => {
        await supabase.from('anotacoes').update({ conteudo: editingText }).eq('id', id);
        setEditingId(null);
        fetchAnotacoes();
    };

    return (
        <div>
            <div className="flex gap-2 mb-4"><textarea value={novaAnotacao} onChange={(e) => setNovaAnotacao(e.target.value)} placeholder="Adicionar uma anotação..." rows="3" className="flex-grow p-2 border rounded-md text-sm" /><button onClick={handleAddAnotacao} className="bg-blue-500 text-white p-2 rounded-md self-start"><PlusCircle size={16}/></button></div>
            <ul className="space-y-3 text-sm text-gray-700 max-h-80 overflow-y-auto">{anotacoes.map(a => <li key={a.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-start">
                    <div><strong>{a.usuario_nome || 'Utilizador'}</strong> <span className="text-gray-400">({new Date(a.created_at).toLocaleString('pt-BR')})</span></div>
                    {a.usuario_id === profile.id && <div className="flex gap-2"><button onClick={() => { setEditingId(a.id); setEditingText(a.conteudo); }}><Edit size={14}/></button><button onClick={() => handleDeleteAnotacao(a.id)}><Trash2 size={14}/></button></div>}
                </div>
                {editingId === a.id ? <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} onBlur={() => handleUpdateAnotacao(a.id)} autoFocus className="w-full mt-1 p-1 border rounded-md"/> : <p className="mt-1">{a.conteudo}</p>}
            </li>)}</ul>
        </div>
    );
};

const AbaTarefas = ({ chamado, profile, onUpdate }) => {
    const [tarefas, setTarefas] = useState([]);
    const [novaTarefa, setNovaTarefa] = useState({ descricao: '', tipo: 'Geral', data_prazo: '' });
    const [showForm, setShowForm] = useState(false);

    const fetchTarefas = useCallback(async () => {
        const { data } = await supabase.from('tarefas').select('*').eq('chamado_id', chamado.id).order('created_at');
        setTarefas(data || []);
    }, [chamado.id]);

    useEffect(() => { fetchTarefas(); }, [fetchTarefas]);

    const handleAddTarefa = async () => {
        if (novaTarefa.descricao.trim() === '') return;
        const { data } = await supabase.from('tarefas').insert({ chamado_id: chamado.id, ...novaTarefa, data_prazo: novaTarefa.data_prazo || null }).select().single();
        if (data) {
            await supabase.from('historico_chamados').insert({ chamado_id: chamado.id, usuario_id: profile.id, usuario_nome: profile.full_name, acao: `Criou tarefa: "${novaTarefa.descricao}"` });
            fetchTarefas();
            onUpdate();
        }
        setNovaTarefa({ descricao: '', tipo: 'Geral', data_prazo: '' });
        setShowForm(false);
    };

    const handleToggleTarefa = async (tarefa) => {
        const { data } = await supabase.from('tarefas').update({ concluida: !tarefa.concluida }).eq('id', tarefa.id).select().single();
        if (data) {
            await supabase.from('historico_chamados').insert({ chamado_id: chamado.id, usuario_id: profile.id, usuario_nome: profile.full_name, acao: `Marcou tarefa como ${data.concluida ? 'concluída' : 'pendente'}: "${tarefa.descricao}"` });
            fetchTarefas();
            onUpdate();
        }
    };
    
    const handleDeleteTarefa = async (id) => {
        if (window.confirm('Tem a certeza que quer apagar esta tarefa?')) {
            await supabase.from('tarefas').delete().eq('id', id);
            fetchTarefas();
            onUpdate();
        }
    };

    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const progresso = tarefas.length > 0 ? (tarefasConcluidas / tarefas.length) * 100 : 0;

    const tiposDeTarefa = {
        'Geral': <Briefcase size={16} className="text-gray-500" />,
        'Ligação': <Phone size={16} className="text-blue-500" />,
        'Reunião': <Calendar size={16} className="text-purple-500" />,
        'E-mail': <Mail size={16} className="text-red-500" />,
        'Assinatura': <Edit size={16} className="text-green-500" />,
    };

    return (
        <div>
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-gray-700">Checklist de Tarefas</h4>
                    <span className="text-sm font-medium text-gray-500">{tarefasConcluidas} de {tarefas.length} concluídas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progresso}%` }}></div>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {tarefas.map(t => (
                    <div key={t.id} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg border hover:border-blue-300">
                        <input type="checkbox" checked={t.concluida} onChange={() => handleToggleTarefa(t)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className={`flex-grow ${t.concluida ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.descricao}</span>
                        <span className="flex items-center gap-1.5 text-xs bg-gray-200 px-2 py-1 rounded-full">{tiposDeTarefa[t.tipo] || tiposDeTarefa['Geral']} {t.tipo}</span>
                        {t.data_prazo && <span className={`text-xs ${new Date(t.data_prazo) < new Date() && !t.concluida ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>{new Date(t.data_prazo).toLocaleDateString('pt-BR')}</span>}
                        <button onClick={() => handleDeleteTarefa(t.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                ))}
            </div>

            {!showForm && <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-gray-300 text-gray-500 p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-400 transition-colors"><PlusCircle size={16}/> Adicionar Tarefa</button>}
            
            {showForm && (
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <textarea value={novaTarefa.descricao} onChange={(e) => setNovaTarefa(p => ({...p, descricao: e.target.value}))} placeholder="Descreva a nova tarefa..." rows="2" className="w-full p-2 border rounded-md text-sm mb-2" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <select value={novaTarefa.tipo} onChange={(e) => setNovaTarefa(p => ({...p, tipo: e.target.value}))} className="p-2 border rounded-md text-sm bg-white">
                                {Object.keys(tiposDeTarefa).map(tipo => <option key={tipo}>{tipo}</option>)}
                            </select>
                            <input type="datetime-local" value={novaTarefa.data_prazo} onChange={(e) => setNovaTarefa(p => ({...p, data_prazo: e.target.value}))} className="p-2 border rounded-md text-sm" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowForm(false)} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleAddTarefa} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AbaHistorico = ({ chamado }) => {
    const [historico, setHistorico] = useState([]);
    useEffect(() => { supabase.from('historico_chamados').select('*').eq('chamado_id', chamado.id).order('created_at', { ascending: false }).then(({ data }) => setHistorico(data || [])); }, [chamado.id]);
    return <ul className="space-y-3 text-xs text-gray-600 max-h-96 overflow-y-auto">{historico.map(h => <li key={h.id}><strong>{h.usuario_nome || 'Sistema'}</strong>: {h.acao} <span className="text-gray-400">({new Date(h.created_at).toLocaleString('pt-BR')})</span></li>)}</ul>;
};
// **FIM DA CORREÇÃO**

export default ChamadoDetailModal;
