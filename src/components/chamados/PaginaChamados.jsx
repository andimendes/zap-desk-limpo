import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { PlusCircle, Filter, LayoutGrid, List } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { getSlaStatus } from '../../utils/sla';
import DashboardStats from './DashboardStats';
import FiltrosChamados from './FiltrosChamados';
import KanbanCard from './KanbanCard';
import ChamadoListItem from './ChamadoListItem';
import CreateChamadoModal from './CreateChamadoModal';
import ChamadoDetailModal from './ChamadoDetailModal';

function PaginaChamados() {
    const [chamados, setChamados] = useState([]);
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedChamado, setSelectedChamado] = useState(null);
    const { profile } = useAuth();
    const [filtros, setFiltros] = useState({ atendente_id: '', cliente_id: '', prioridade: '', sla: '' });
    const [atendentes, setAtendentes] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [activeTab, setActiveTab] = useState('emAndamento');

    const fetchDados = useCallback(async (isSilent = false) => {
        if (!profile) return;
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const { data: chamadosData, error: chamadosError } = await supabase.from('chamados_com_detalhes').select('*').order('created_at', { ascending: false });
            if (chamadosError) throw chamadosError;
            
            const { data: tarefasData, error: tarefasError } = await supabase.from('tarefas').select('*');
            if (tarefasError) throw tarefasError;

            const { data: atendentesData } = await supabase.from('profiles').select('id, full_name, avatar_url').order('full_name');
            setAtendentes(atendentesData || []);
            
            const { data: empresasData } = await supabase.from('crm_empresas').select('id, razao_social, nome_fantasia').order('nome_fantasia');
            setEmpresas(empresasData || []);
            
            setChamados(chamadosData || []);
            setTarefas(tarefasData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);
    
    useEffect(() => {
        if (profile) {
            fetchDados();
            const channel = supabase.channel('postgres_changes_chamados_page')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, () => fetchDados(true))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, () => fetchDados(true))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [fetchDados, profile]);

    // --- NOVA CORREÇÃO ADICIONADA AQUI ---
    // Este useEffect sincroniza o modal aberto com os dados mais recentes.
    useEffect(() => {
        // Se houver um chamado selecionado (modal aberto)
        if (selectedChamado) {
            // Procura a versão mais recente desse chamado na lista principal
            const updatedChamado = chamados.find(c => c.id === selectedChamado.id);
            // Se encontrar, atualiza o estado do modal.
            // Se não encontrar (ex: foi excluído), fecha o modal.
            if (updatedChamado) {
                setSelectedChamado(updatedChamado);
            } else {
                setSelectedChamado(null);
            }
        }
    }, [chamados]); // Esta função executa sempre que a lista 'chamados' é alterada.
    
    const handleChamadoDeleted = async (chamadoId) => {
        try {
            const { error } = await supabase.from('chamados').delete().eq('id', chamadoId);
            if (error) throw error;
            setSelectedChamado(null);
        } catch (err) {
            console.error("Erro ao excluir chamado:", err);
            setError(err.message);
        }
    };

    const chamadosFiltrados = useMemo(() => {
        const statusAtivos = ['Aberto', 'Em Andamento', 'Aguardando Cliente', 'Revisão'];
        const statusConcluidos = ['Resolvido', 'Cancelado'];
        const baseChamados = chamados.filter(c => activeTab === 'emAndamento' ? statusAtivos.includes(c.status) : statusConcluidos.includes(c.status));
        
        return baseChamados.filter(c => {
            const slaStatus = getSlaStatus(c.created_at, c.sla_resolucao_horas).text;
            return (filtros.atendente_id ? c.atendente_id === filtros.atendente_id : true) &&
                   (filtros.cliente_id ? c.cliente_id === filtros.cliente_id : true) &&
                   (filtros.prioridade ? c.prioridade === filtros.prioridade : true) &&
                   (filtros.sla ? slaStatus.toLowerCase().includes(filtros.sla.toLowerCase()) : true);
        });
    }, [chamados, filtros, activeTab]);

    const tarefasPorChamado = useMemo(() => {
        return tarefas.reduce((acc, tarefa) => {
            if (!acc[tarefa.chamado_id]) {
                acc[tarefa.chamado_id] = [];
            }
            acc[tarefa.chamado_id].push(tarefa);
            return acc;
        }, {});
    }, [tarefas]);

    const limparFiltros = () => { setFiltros({ atendente_id: '', cliente_id: '', prioridade: '', sla: '' }); setIsFilterOpen(false); };
    
    const KanbanView = () => {
        const colunas = ['Aberto', 'Em Andamento', 'Aguardando Cliente', 'Revisão'];
        const colunaCores = { 'Aberto': 'border-blue-500', 'Em Andamento': 'border-yellow-500', 'Aguardando Cliente': 'border-purple-500', 'Revisão': 'border-orange-500' };
        
        const chamadosPorColuna = colunas.reduce((acc, status) => {
            acc[status] = chamadosFiltrados
                .filter(c => c.status === status)
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return acc;
        }, {});

        const handleDragEnd = async (result) => {
            const { destination, source, draggableId } = result;
            if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) { return; }
            
            const chamadosAtualizados = chamados.map(c => c.id === draggableId ? {...c, status: destination.droppableId} : c);
            setChamados(chamadosAtualizados);
            
            const { error } = await supabase.from('chamados').update({ status: destination.droppableId }).eq('id', draggableId);
            
            if (error) { 
                console.error("Erro ao atualizar status:", error); 
                fetchDados(); 
            }
        };

        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {colunas.map(status => (
                        <Droppable key={status} droppableId={status}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col">
                                    <div className={`p-2 mb-3 border-l-4 ${colunaCores[status]}`}>
                                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                            {status} <span className="text-base bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2.5 py-0.5">{chamadosPorColuna[status].length}</span>
                                        </h3>
                                    </div>
                                    <div className="space-y-3 h-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 400px)'}}>
                                        {chamadosPorColuna[status].map((chamado, index) => (
                                            <KanbanCard 
                                                key={chamado.id} 
                                                chamado={chamado} 
                                                tarefasDoChamado={tarefasPorChamado[chamado.id] || []} 
                                                onClick={() => setSelectedChamado(chamado)} 
                                                index={index} 
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        );
    };

    const ListView = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Título / Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">SLA</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Prioridade</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Atendente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aberto em</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {chamadosFiltrados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(chamado => (
                        <ChamadoListItem key={chamado.id} chamado={chamado} onClick={() => setSelectedChamado(chamado)} />
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
             <div className="max-w-full mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div><h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Quadro de Chamados</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Visualize e gerencie o fluxo de trabalho da sua equipe.</p></div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        {activeTab === 'emAndamento' && (<div className="flex items-center bg-gray-200 dark:bg-gray-800 p-1 rounded-lg"><button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}><LayoutGrid size={20} /></button><button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}><List size={20} /></button></div>)}
                        <div className="relative"><button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center gap-2 bg-white dark:bg-gray-800 font-semibold py-2 px-4 rounded-lg border dark:border-gray-700 shadow-sm"><Filter size={16} /> Filtros</button>{isFilterOpen && <FiltrosChamados filtros={filtros} setFiltros={setFiltros} atendentes={atendentes} clientes={empresas} limparFiltros={limparFiltros} />}</div>
                        <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm"><PlusCircle size={20} />Novo Chamado</button>
                    </div>
                </div>
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button onClick={() => setActiveTab('emAndamento')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'emAndamento' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Em Andamento</button>
                    <button onClick={() => setActiveTab('concluidos')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'concluidos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Concluídos</button>
                </div>
                {activeTab === 'emAndamento' && <DashboardStats chamados={chamadosFiltrados} />}
                
                {loading && <div className="text-center p-8">A carregar o quadro...</div>}
                {error && <div className="text-center p-8 text-red-500">Ocorreu um erro: {error}</div>}
                
                {!loading && !error && (
                    <>
                        {activeTab === 'emAndamento' && (viewMode === 'kanban' ? <KanbanView /> : <ListView />)}
                        {activeTab === 'concluidos' && <ListView />}
                    </>
                )}
                
                {isCreateModalOpen && <CreateChamadoModal onClose={() => setCreateModalOpen(false)} onChamadoCreated={fetchDados} />}
                
                {selectedChamado && <ChamadoDetailModal 
                    chamado={selectedChamado} 
                    onClose={() => setSelectedChamado(null)} 
                    onChamadoUpdated={() => fetchDados(true)} 
                    onChamadoDeleted={handleChamadoDeleted}
                />}
            </div>
        </div>
    );
}

export default PaginaChamados;