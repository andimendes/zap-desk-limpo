// src/components/crm/EmpresaDetalhesModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { 
    Loader2, X, Building, User, Briefcase, Pencil, 
    Globe, MapPin, FileText, Fingerprint, Phone 
} from 'lucide-react';
import EmpresaFormModal from './EmpresaFormModal';

// Componente auxiliar para exibir os detalhes de forma padronizada
const DetalheItem = ({ icon, label, children }) => (
    <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {icon}
            {label}
        </label>
        <div className="text-gray-800 dark:text-gray-200 text-base break-words">
            {children || <span className="text-gray-400 italic">Não informado</span>}
        </div>
    </div>
);


const EmpresaDetalhesModal = ({ isOpen, onClose, empresa, onEmpresaUpdate }) => {
  const [contatos, setContatos] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const carregarDetalhes = async () => {
      if (!empresa?.id) return;
      setLoading(true);
      try {
        const [contatosRes, negociosRes] = await Promise.all([
          supabase.from('crm_contatos').select('*').eq('empresa_id', empresa.id),
          supabase.from('crm_negocios').select('*').eq('empresa_id', empresa.id).eq('status', 'Ativo')
        ]);
        if (contatosRes.error) throw contatosRes.error;
        if (negociosRes.error) throw negociosRes.error;
        setContatos(contatosRes.data || []);
        setNegocios(negociosRes.data || []);
      } catch (error) {
        console.error("Erro ao carregar detalhes da empresa:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) carregarDetalhes();
  }, [empresa, isOpen]);

  const handleSaveEmpresa = (empresaAtualizada) => {
    onEmpresaUpdate(empresaAtualizada);
    setIsEditModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl min-h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
          <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <div className='flex items-center gap-2'>
              <Building className="text-gray-500" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{empresa?.nome_fantasia || "Detalhes da Empresa"}</h2>
            </div>
            <div>
              <button onClick={() => setIsEditModalOpen(true)} className="text-gray-500 hover:text-blue-600 p-1" title="Editar Empresa"><Pencil size={18} /></button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"><X size={24} /></button>
            </div>
          </header>
          
          <div className="p-6 flex-grow overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
              <div className="space-y-6">
                {/* =================================== */}
                {/* === NOVA SECÇÃO: DADOS DA EMPRESA === */}
                {/* =================================== */}
                <div>
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-4">Dados da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        <DetalheItem icon={<Fingerprint size={14}/>} label="CNPJ">{empresa.cnpj}</DetalheItem>
                        <DetalheItem icon={<FileText size={14}/>} label="Razão Social">{empresa.razao_social}</DetalheItem>
                        <DetalheItem icon={<Phone size={14}/>} label="Telefone">{empresa.telefone}</DetalheItem>
                        <DetalheItem icon={<Globe size={14}/>} label="Site">
                            {empresa.site ? <a href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{empresa.site}</a> : null}
                        </DetalheItem>
                        <DetalheItem icon={<Briefcase size={14}/>} label="Segmento">{empresa.segmento}</DetalheItem>
                        <DetalheItem icon={<MapPin size={14}/>} label="Endereço">{empresa.endereco}</DetalheItem>
                    </div>
                </div>

                <hr className="dark:border-gray-700" />

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Coluna de Contatos */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><User size={20} /> Contatos ({contatos.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {contatos.length > 0 ? (
                        contatos.map(contato => (
                          <div key={contato.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{contato.nome}</p>
                            {contato.cargo && <p className="text-sm text-gray-500 dark:text-gray-300">{contato.cargo}</p>}
                            {contato.email && <p className="text-sm text-gray-600 dark:text-gray-400">{contato.email}</p>}
                            {contato.telefone && <p className="text-sm text-gray-600 dark:text-gray-400">{contato.telefone}</p>}
                          </div>
                        ))
                      ) : <p className="text-sm text-gray-500 italic">Nenhum contato encontrado.</p>}
                    </div>
                  </div>

                  {/* Coluna de Negócios */}
                  <div>
                     <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Briefcase size={20} /> Negócios Ativos ({negocios.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {negocios.length > 0 ? (
                        negocios.map(negocio => (
                          <div key={negocio.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{negocio.titulo}</p>
                            <p className="text-sm text-green-600 dark:text-green-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor || 0)}</p>
                          </div>
                        ))
                      ) : <p className="text-sm text-gray-500 italic">Nenhum negócio ativo.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmpresaFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} empresa={empresa} onSave={handleSaveEmpresa} />
    </>
  );
};

export default EmpresaDetalhesModal;