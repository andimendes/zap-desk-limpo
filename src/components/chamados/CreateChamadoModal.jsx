import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';

function CreateChamadoModal({ onClose, onChamadoCreated }) {
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    cliente_id: '',
    prioridade: 'Normal',
    sla_resolucao_horas: 24,
    atendente_id: profile?.id || null,
    status: 'Aberto'
  });

  const [empresas, setEmpresas] = useState([]); // Renomeado para clareza
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- ALTERAÇÃO AQUI: Buscando da tabela correta ---
    supabase
      .from('crm_empresas') // <-- MUDANÇA DE 'clientes' PARA 'crm_empresas'
      .select('id, razao_social, nome_fantasia')
      .order('nome_fantasia')
      .then(({ data }) => setEmpresas(data || []));
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dadosParaInserir = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        cliente_id: formData.cliente_id === '' ? null : formData.cliente_id,
        prioridade: formData.prioridade,
        sla_resolucao_horas: formData.sla_resolucao_horas,
        atendente_id: formData.atendente_id,
        status: formData.status
    };

    console.log('Dados a serem enviados (limpos):', dadosParaInserir);

    const { data, error: insertError } = await supabase
        .from('chamados')
        .insert(dadosParaInserir)
        .select()
        .single();

    if (insertError) {
        setError(insertError.message);
        console.error('Erro do Supabase ao inserir:', insertError);
    } else {
      await supabase.from('historico_chamados').insert({
        chamado_id: data.id,
        usuario_id: profile.id,
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
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Abrir Novo Chamado</h3>
            <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Título</label>
            <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <textarea name="descricao" rows="4" value={formData.descricao} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Empresa</label> {/* Alterado de Cliente para Empresa */}
              <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                <option value="">Nenhum (Interno)</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Prioridade</label>
              <select name="prioridade" value={formData.prioridade} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                <option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Prazo (horas)</label>
              <input type="number" name="sla_resolucao_horas" value={formData.sla_resolucao_horas} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg font-semibold">Cancelar</button>
            <button type="submit" disabled={loading} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-blue-300">
                {loading ? 'Criando...' : 'Criar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChamadoModal;