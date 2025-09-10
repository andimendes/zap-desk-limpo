// src/components/contatos/PaginaContatos.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import ContatoFormModal from '../crm/ContatoFormModal';
import ImportacaoContatosModal from './ImportacaoContatosModal';
import FiltrosContatos from './FiltrosContatos';
import { Plus, Edit, Trash2, Loader2, List, LayoutGrid, Upload, Download, Building, Filter as FilterIcon, XCircle, CheckCircle2, Users } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

// --- FUNÇÃO DE FORMATAÇÃO DE TELEFONE ATUALIZADA ---
const formatarTelefoneExibicao = (telefone) => {
  if (!telefone) return 'Sem telefone';
  const telefoneLimpo = String(telefone).replace(/\D/g, '');
  
  // Formato para celular com 9º dígito: (xx) x xxxx-xxxx
  if (telefoneLimpo.length === 11) {
      return telefoneLimpo.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }
  // Formato para telefone fixo ou celular antigo: (xx) xxxx-xxxx
  if (telefoneLimpo.length === 10) {
      return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  // Retorna o número original se não se encaixar nos padrões
  return telefone;
};

const ContatoCard = ({ contato, onEdit, onDelete, isSelected, onToggleSelecao }) => (
    <div 
        onClick={() => onToggleSelecao(contato.id)}
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex flex-col justify-between transition-all duration-300 ease-in-out cursor-pointer group hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'ring-2 ring-blue-500 border-transparent' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        <div className={`absolute top-3 left-3 h-6 w-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100'}`}>
            {isSelected && <CheckCircle2 size={16} className="text-white" />}
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={(e) => { e.stopPropagation(); onEdit(contato); }} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Editar"><Edit size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(contato); }} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Apagar"><Trash2 size={16} /></button>
        </div>

        <div className="flex-1">
            <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl mr-4 flex-shrink-0">
                    {contato.nome.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{contato.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{contato.cargo || 'Sem cargo'}</p>
                </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 my-3">
                <p className="truncate">{contato.email || 'Sem e-mail'}</p>
                {/* --- MÁSCARA APLICADA AQUI --- */}
                <p>{formatarTelefoneExibicao(contato.telefone)}</p>
            </div>
            {contato.empresasVinculadas && contato.empresasVinculadas.length > 0 && (
                <div className="pt-3 border-t dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                        {contato.empresasVinculadas.slice(0, 2).map(empresa => (
                            <span key={empresa.id} className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Building size={12}/> {empresa.nome_fantasia}
                            </span>
                        ))}
                        {contato.empresasVinculadas.length > 2 && (
                             <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full dark:bg-gray-600 dark:text-gray-400">
                                +{contato.empresasVinculadas.length - 2}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);

const ContatoListItem = ({ contato, onEdit, onDelete, isSelected, onToggleSelecao }) => (
     <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
        <td className="w-4 px-6 py-4"><input type="checkbox" checked={isSelected} onChange={() => onToggleSelecao(contato.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">{contato.nome.charAt(0).toUpperCase()}</div><div><div className="text-sm font-medium text-gray-900 dark:text-gray-100">{contato.nome}</div><div className="text-sm text-gray-500 dark:text-gray-400">{contato.cargo || 'Sem cargo'}</div></div></div></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contato.email}</td>
        {/* --- MÁSCARA APLICADA AQUI --- */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarTelefoneExibicao(contato.telefone)}</td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="flex flex-wrap gap-1">{contato.empresasVinculadas && contato.empresasVinculadas.map(empresa => (<span key={empresa.id} className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full dark:bg-gray-700 dark:text-gray-300">{empresa.nome_fantasia}</span>))}</div></td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => onEdit(contato)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button><button onClick={() => onDelete(contato)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button></td>
    </tr>
);

const ContatoCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
    <div className="flex items-center mb-4"><div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 mr-4"></div><div className="flex-1 space-y-2"><div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></div></div>
    <div className="space-y-2 pt-3"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div></div>
  </div>
);

const ContatoListItemSkeleton = () => (
    <tr className="animate-pulse">
        <td className="w-4 px-6 py-4"><div className="h-4 w-4 rounded bg-gray-300 dark:bg-gray-700"></div></td>
        <td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-4"></div><div className="flex-1 space-y-2"><div className="h-4 rounded bg-gray-300 dark:bg-gray-700"></div><div className="h-3 rounded bg-gray-300 dark:bg-gray-700 w-1/2"></div></div></div></td>
        <td className="px-6 py-4"><div className="h-3 rounded bg-gray-300 dark:bg-gray-700"></div></td>
        <td className="px-6 py-4"><div className="h-3 rounded bg-gray-300 dark:bg-gray-700"></div></td>
        <td className="px-6 py-4"><div className="flex gap-2"><div className="h-5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div><div className="h-5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div></div></td>
        <td className="px-6 py-4"><div className="h-6 w-12 rounded bg-gray-300 dark:bg-gray-700 ml-auto"></div></td>
    </tr>
);

export default function PaginaContatos() {
    const [contatos, setContatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedContato, setSelectedContato] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
    const [empresas, setEmpresas] = useState([]);
    const [filtros, setFiltros] = useState({ empresaId: 'todas', cargo: '' });
    const [selecionados, setSelecionados] = useState([]);

    const fetchContatos = useCallback(async () => {
        setLoading(true);
        const [contatosRes, vinculosRes, empresasRes] = await Promise.all([
            supabase.from('crm_contatos').select('*').order('nome', { ascending: true }),
            supabase.from('empresa_contato_junction').select('contato_id, empresa_id'),
            supabase.from('crm_empresas').select('id, nome_fantasia').order('nome_fantasia', { ascending: true })
        ]);

        if (contatosRes.error || vinculosRes.error || empresasRes.error) {
            console.error("Erro a buscar dados:", contatosRes.error || vinculosRes.error || empresasRes.error);
        } else {
            setEmpresas(empresasRes.data);
            const empresasMap = new Map(empresasRes.data.map(e => [e.id, e]));
            const contatosComEmpresas = contatosRes.data.map(contato => {
                const vinculosDoContato = vinculosRes.data.filter(v => v.contato_id === contato.id);
                const empresasVinculadas = vinculosDoContato.map(v => empresasMap.get(v.empresa_id)).filter(Boolean);
                return { ...contato, empresasVinculadas };
            });
            setContatos(contatosComEmpresas);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchContatos(); }, [fetchContatos]);
    
    const { contatosFiltrados, contagemFiltrosAtivos } = useMemo(() => {
        const filtrados = contatos.filter(c => {
            const buscaOk = searchTerm === '' || c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const empresaOk = filtros.empresaId === 'todas' || c.empresasVinculadas.some(emp => emp.id === filtros.empresaId);
            const cargoOk = filtros.cargo === '' || (c.cargo && c.cargo.toLowerCase().includes(filtros.cargo.toLowerCase()));
            return buscaOk && empresaOk && cargoOk;
        });
        let count = 0;
        if (filtros.empresaId !== 'todas') count++;
        if (filtros.cargo !== '') count++;
        return { contatosFiltrados: filtrados, contagemFiltrosAtivos: count };
    }, [contatos, searchTerm, filtros]);

    const handleAplicarFiltros = (novosFiltros) => setFiltros(novosFiltros);
    const handleLimparFiltros = () => {
        setFiltros({ empresaId: 'todas', cargo: '' });
        setIsFiltrosOpen(false);
    };

    const handleOpenFormModal = (contato = null) => {
        setSelectedContato(contato);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedContato(null);
    };

    const handleSave = () => {
        toast.success('Contato salvo com sucesso!');
        fetchContatos();
        handleCloseFormModal();
    };

    const handleDelete = async (contato) => {
        if (window.confirm(`Tem certeza de que deseja apagar ${contato.nome}?`)) {
            await supabase.from('empresa_contato_junction').delete().eq('contato_id', contato.id);
            const { error } = await supabase.from('crm_contatos').delete().eq('id', contato.id);
            if (error) {
                toast.error('Erro ao apagar o contato.');
            } else {
                toast.success(`Contato '${contato.nome}' apagado.`);
                fetchContatos();
            }
        }
    };

    const handleDeleteSelecionados = async () => {
        if (window.confirm(`Tem certeza de que deseja apagar ${selecionados.length} contato(s)?`)) {
            setLoading(true);
            await supabase.from('empresa_contato_junction').delete().in('contato_id', selecionados);
            const { error } = await supabase.from('crm_contatos').delete().in('id', selecionados);
            if (error) {
                toast.error('Erro ao apagar os contatos selecionados.');
            } else {
                toast.success(`${selecionados.length} contato(s) apagado(s) com sucesso.`);
                setSelecionados([]);
                fetchContatos();
            }
            setLoading(false);
        }
    };
    
    const handleToggleSelecao = (id) => setSelecionados(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const handleSelecionarTodos = (e) => setSelecionados(e.target.checked ? contatosFiltrados.map(c => c.id) : []);
    const handleLimparSelecao = () => setSelecionados([]);
    const handleImportComplete = () => { toast.success('Importação concluída!'); fetchContatos(); setIsImportModalOpen(false); };
    const handleExport = () => { /* ... */ };

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-full dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div><h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contatos</h1><p className="text-gray-500 dark:text-gray-400">Gira os seus contatos individuais.</p></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border dark:border-gray-700"><button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}><LayoutGrid size={16}/></button><button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}><List size={16}/></button></div>
                        <button onClick={() => setIsFiltrosOpen(true)} className="relative p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300"><FilterIcon size={16}/>{contagemFiltrosAtivos > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{contagemFiltrosAtivos}</span>)}</button>
                        <button onClick={() => setIsImportModalOpen(true)} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300"><Upload size={16}/></button><button onClick={handleExport} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300"><Download size={16}/></button>
                        <button onClick={() => handleOpenFormModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Novo Contato</button>
                    </div>
                </header>

                {selecionados.length > 0 && (
                    <div className="mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center justify-between shadow-sm border dark:border-gray-700">
                        <div className="flex items-center gap-4"><button onClick={handleLimparSelecao} className="p-1 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500" title="Limpar seleção"><XCircle size={20} /></button><span className="font-semibold text-gray-800 dark:text-gray-100">{selecionados.length} selecionado(s)</span></div>
                        <div className="flex items-center gap-2"><button onClick={handleDeleteSelecionados} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"><Trash2 size={16} />Apagar Selecionados</button></div>
                    </div>
                )}
                
                 <div className="mb-4"><input type="text" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"/></div>
                
                {loading ? (
                    viewMode === 'grid' ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <ContatoCardSkeleton key={i} />)}</div> ) 
                                       : ( <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700"><table className="min-w-full divide-y dark:divide-gray-700"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-3 w-4"></th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Nome</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">E-mail</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Telefone</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Empresas</th><th className="relative px-6 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y dark:divide-gray-700">{[...Array(5)].map((_, i) => <ContatoListItemSkeleton key={i} />)}</tbody></table></div> )
                ) : (
                    <>
                    {contatos.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md"><Users size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">A sua lista de contatos está vazia</h3><p className="mt-2 text-gray-500 dark:text-gray-400">Comece por adicionar o seu primeiro contato ou importar uma lista existente.</p><div className="mt-6 flex justify-center gap-4"><button onClick={() => handleOpenFormModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"><Plus size={20} className="mr-2" /> Criar Primeiro Contato</button><button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"><Upload size={16} className="mr-2"/> Importar Lista</button></div></div>
                    ) : contatosFiltrados.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-md"><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nenhum contato encontrado</h3><p className="mt-2">Tente ajustar a sua busca ou limpar os filtros aplicados.</p><button onClick={handleLimparFiltros} className="mt-4 text-blue-600 font-semibold hover:underline">Limpar filtros</button></div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{contatosFiltrados.map(c => <ContatoCard key={c.id} contato={c} onEdit={handleOpenFormModal} onDelete={handleDelete} isSelected={selecionados.includes(c.id)} onToggleSelecao={handleToggleSelecao} />)}</div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700">
                                <table className="min-w-full divide-y dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-3 w-4"><input type="checkbox" onChange={handleSelecionarTodos} checked={contatosFiltrados.length > 0 && selecionados.length === contatosFiltrados.length} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Nome</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">E-mail</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Telefone</th><th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Empresas</th><th className="relative px-6 py-3"><span className="sr-only">Ações</span></th></tr></thead>
                                    <tbody className="divide-y dark:divide-gray-700">{contatosFiltrados.map(c => <ContatoListItem key={c.id} contato={c} onEdit={handleOpenFormModal} onDelete={handleDelete} isSelected={selecionados.includes(c.id)} onToggleSelecao={handleToggleSelecao} />)}</tbody>
                                </table>
                            </div>
                        )
                    )}
                    </>
                )}
            </div>
            
            {isFormModalOpen && <ContatoFormModal isOpen={isFormModalOpen} onSave={handleSave} contato={selectedContato} onClose={handleCloseFormModal} />}
            {isImportModalOpen && <ImportacaoContatosModal onClose={() => setIsImportModalOpen(false)} onComplete={handleImportComplete} />}
            <FiltrosContatos isOpen={isFiltrosOpen} onClose={() => setIsFiltrosOpen(false)} listaDeEmpresas={empresas} filtrosAtuais={filtros} onAplicarFiltros={handleAplicarFiltros}/>
        </div>
    );
}