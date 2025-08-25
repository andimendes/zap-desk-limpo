import React from 'react';
import { XCircle } from 'lucide-react';

const FiltrosChamados = ({ filtros, setFiltros, atendentes, clientes, limparFiltros }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="absolute top-14 right-0 bg-white p-4 rounded-lg shadow-lg border w-96 z-10">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Atendente</label>
                    <select name="atendente_id" value={filtros.atendente_id} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md bg-white text-sm">
                        <option value="">Todos</option>
                        {atendentes.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <select name="cliente_id" value={filtros.cliente_id} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md bg-white text-sm">
                        <option value="">Todos</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                    </select>
                </div>
                {/* **INÍCIO DA ALTERAÇÃO** - Novo filtro de SLA */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                        <select name="prioridade" value={filtros.prioridade} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md bg-white text-sm">
                            <option value="">Todas</option>
                            <option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">SLA</label>
                        <select name="sla" value={filtros.sla} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md bg-white text-sm">
                            <option value="">Todos</option>
                            <option value="Atrasado">Atrasado</option>
                            <option value="Vence hoje">Vence hoje</option>
                        </select>
                    </div>
                </div>
                {/* **FIM DA ALTERAÇÃO** */}
                <button onClick={limparFiltros} className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">
                    <XCircle size={16} /> Limpar Filtros
                </button>
            </div>
        </div>
    );
};

export default FiltrosChamados;
