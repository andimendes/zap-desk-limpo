import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';

function CreateChamadoModal({ onClose, onChamadoCreated }) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({ titulo: '', descricao: '', cliente_id: '', prioridade: 'Normal', sla_resolucao_horas: 24 });
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.from('clientes').select('id, razao_social').order('razao_social').then(({ data }) => setClientes(data || []));
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    const { data, error: insertError } = await supabase.from('chamados').insert({ ...formData, cliente_id: formData.cliente_id || null }).select().single();
    if (insertError) {
      setError(insertError.message);
    } else {
      await supabase.from('historico_chamados').insert({
          chamado_id: data.id,
          usuario_id: profile.id, // Corrigido para usar o ID do perfil do contexto
          usuario_nome: profile.full_name,
          acao: 'Chamado criado.'
      });
      onChamadoCreated();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Abrir Novo Chamado</h3><button onClick={onClose}><X /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium">Título</label><input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium">Descrição</label><textarea name="descricao" rows="4" value={formData.descricao} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"></textarea></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium">Cliente</label><select name="cliente_id" value={formData.cliente_id} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option value="">Nenhum (Interno)</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></div>
            <div><label className="block text-sm font-medium">Prioridade</label><select name="prioridade" value={formData.prioridade} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white"><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
            <div><label className="block text-sm font-medium">Prazo (horas)</label><input type="number" name="sla_resolucao_horas" value={formData.sla_resolucao_horas} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" /></div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg font-semibold">Cancelar</button><button type="submit" disabled={loading} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-blue-300">{loading ? 'Criando...' : 'Criar Chamado'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default CreateChamadoModal;
