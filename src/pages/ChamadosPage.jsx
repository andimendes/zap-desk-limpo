import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Filter, LayoutGrid, List } from 'lucide-react';
import { getSlaStatus } from '../utils/sla';

import DashboardStats from '../components/chamados/DashboardStats';
import FiltrosChamados from '../components/chamados/FiltrosChamados';
import KanbanCard from '../components/chamados/KanbanCard';
import ChamadoListItem from '../components/chamados/ChamadoListItem';
import CreateChamadoModal from '../components/chamados/CreateChamadoModal';
import ChamadoDetailModal from '../components/chamados/ChamadoDetailModal';

function ChamadosPage() {
    const [chamados, setChamados] = useState([]);
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedChamado, setSelectedChamado] = useState(null);
    const { profile, session } = useAuth();
    const [filtros, setFiltros] = useState({ atendente_id: '', cliente_id: '', prioridade: '', sla: '' });
    const [atendentes, setAtendentes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');

    const fetchDados = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('chamados').select(`
                *, 
                clientes!inner(*, contatos(*)), 
                atendente:profiles!chamados_atendente_id_fkey ( full_name )
            `);

            const { data: chamadosData, error: chamadosError } = await query.order('created_at', { ascending: false });
            if (chamadosError) throw chamadosError;

            const { data: tarefasData, error: tarefasError } = await supabase.from('tarefas').select('*');
            if (tarefasError) throw tarefasError;

            const { data: atendentesData, error: atendentesError } = await supabase.from('profiles').select('id, full_name').order('full_name');
            if (atendentesError) throw atendentesError;

            const { data: clientesData, error: clientesError } = await supabase.from('clientes').select('id, razao_social, nome_fantasia').order('nome_fantasia');
            if (clientesError) throw clientesError;

            setChamados(chamadosData || []);
            setTarefas(tarefasData || []);
            setAtendentes(atendentesData || []);
            setClientes(clientesData || []);

        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar dados:", err);
        } finally {
            setLoading(false);
        }
    }, [profile, session]);

    useEffect(() => {
        fetchDados();
        
        const subscription = supabase.channel('public:chamados')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, fetchDados)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, fetchDados)
            .subscribe();
            
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [fetchDados]);

    const chamadosFiltradosEOrdenados = useMemo(() => {
        let chamadosProcessados = chamados.filter(c => {
            const slaStatus = getSlaStatus(c.created_at, c.sla_resolucao_horas).text;
            return (filtros.atendente_id ? c.atendente_id === filtros.atendente_id : true) &&
                   (filtros.cliente_id ? c.cliente_id === filtros.cliente_id : true) &&
                   (filtros.prioridade ? c.prioridade === filtros.prioridade : true) &&
                   (filtros.sla ? slaStatus.toLowerCase().includes(filtros.sla.toLowerCase()) : true);
        });

        if (viewMode === 'list') {
            const prioridadeMap = { 'Urgente': 4, 'Alta': 3, 'Normal': 2, 'Baixa': 1 };
            const slaMap = { 'Atrasado': 3, 'Vence hoje': 2 };

            chamadosProcessados.sort((a, b) => {
                const slaA = getSlaStatus(a.created_at, a.sla_resolucao_horas).text;
                const slaB = getSlaStatus(b.created_at, b.sla_resolucao_horas).text;
                const scoreA = (slaMap[slaA] || 1) * 10 + (prioridadeMap[a.prioridade] || 1);
                const scoreB = (slaMap[slaB] || 1) * 10 + (prioridadeMap[b.prioridade] || 1);
                return scoreB - scoreA;
            });
        }
        return chamadosProcessados;
    }, [chamados, filtros, viewMode]);

    const limparFiltros = () => {
        setFiltros({ atendente_id: '', cliente_id: '', prioridade: '', sla: '' });
        setIsFilterOpen(false);
    };
    
    const KanbanView = () => {
        const colunas = ['Aberto', 'Em Andamento', 'Aguardando Cliente', 'Resolvido', 'Cancelado'];
        const colunaCores = { 'Aberto': 'border-blue-500', 'Em Andamento': 'border-yellow-500', 'Aguardando Cliente': 'border-purple-500', 'Resolvido': 'border-green-500', 'Cancelado': 'border-gray-500' };
        const chamadosPorColuna = colunas.reduce((acc, status) => { acc[status] = chamadosFiltradosEOrdenados.filter(c => c.status === status); return acc; }, {});

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                {colunas.map(status => (
                    <div key={status} className="bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col">
                        <div className={`p-2 mb-3 border-l-4 ${colunaCores[status]}`}>
                            <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                {status}
                                <span className="text-base bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2.5 py-0.5">{chamadosPorColuna[status].length}</span>
                            </h3>
                        </div>
                        <div className="space-y-3 h-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 400px)'}}>
                            {chamadosPorColuna[status].map(chamado => {
                                const tarefasDoChamado = tarefas.filter(t => t.chamado_id === chamado.id);
                                return <KanbanCard key={chamado.id} chamado={chamado} tarefasDoChamado={tarefasDoChamado} onClick={() => setSelectedChamado(chamado)} />
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const ListView = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Título / Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">SLA</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Prioridade</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Atendente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aberto em</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {chamadosFiltradosEOrdenados.map(chamado => (
                        <ChamadoListItem key={chamado.id} chamado={chamado} onClick={() => setSelectedChamado(chamado)} />
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-full">
            <div className="max-w-full mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Quadro de Chamados</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Visualize e gerencie o fluxo de trabalho da sua equipe.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}><LayoutGrid size={20} className="text-gray-600 dark:text-gray-300"/></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}><List size={20} className="text-gray-600 dark:text-gray-300"/></button>
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-600 shadow-sm transition-colors">
                                <Filter size={16} /> Filtros
                            </button>
                            {isFilterOpen && <FiltrosChamados filtros={filtros} setFiltros={setFiltros} atendentes={atendentes} clientes={clientes} limparFiltros={limparFiltros} />}
                        </div>
                        <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                            <PlusCircle size={20} />Novo Chamado
                        </button>
                    </div>
                </div>

                <DashboardStats chamados={chamadosFiltradosEOrdenados} tarefas={tarefas} />
                
                {loading && <div className="text-center p-8 text-gray-600 dark:text-gray-400">A carregar o quadro...</div>}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Ocorreu um erro:</strong><span className="block sm:inline"> {error}</span></div>}
                
                {!loading && !error && (viewMode === 'kanban' ? <KanbanView /> : <ListView />)}

                {isCreateModalOpen && <CreateChamadoModal onClose={() => setCreateModalOpen(false)} onChamadoCreated={() => { fetchDados(); setCreateModalOpen(false); }} />}
                {selectedChamado && <ChamadoDetailModal chamado={selectedChamado} onClose={() => setSelectedChamado(null)} onChamadoUpdated={() => { fetchDados(); setSelectedChamado(null); }} />}
            </div>
        </div>
    );
}

export default ChamadosPage;
