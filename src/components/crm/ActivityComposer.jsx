// src/components/crm/ActivityComposer.jsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Calendar, MessageSquare, Plus } from 'lucide-react';

const ActivityComposer = ({ negocioId, onActionSuccess }) => {
  const [abaAtiva, setAbaAtiva] = useState('atividade');

  // Estados para o formulário de Atividade
  const [atividadeDesc, setAtividadeDesc] = useState('');
  const [atividadeData, setAtividadeData] = useState(new Date().toISOString().slice(0, 16));

  // Estado para o formulário de Anotação
  const [notaConteudo, setNotaConteudo] = useState('');

  const TabButton = ({ aba, label, icon: Icone }) => (
    <button
      onClick={() => setAbaAtiva(aba)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 ${
        abaAtiva === aba
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icone size={16} />
      {label}
    </button>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Sessão inválida.');
      return;
    }

    let error;

    if (abaAtiva === 'atividade') {
      if (!atividadeDesc.trim() || !atividadeData) return;
      const novaAtividade = { negocio_id: negocioId, user_id: session.user.id, tipo: 'Tarefa', descricao: atividadeDesc, data_atividade: new Date(atividadeData).toISOString(), concluida: false };
      ({ error } = await supabase.from('crm_atividades').insert(novaAtividade));
      setAtividadeDesc('');
      setAtividadeData(new Date().toISOString().slice(0, 16));
    } else if (abaAtiva === 'anotacao') {
      if (!notaConteudo.trim()) return;
      const novaNota = { negocio_id: negocioId, user_id: session.user.id, conteudo: notaConteudo };
      ({ error } = await supabase.from('crm_notas').insert(novaNota));
      setNotaConteudo('');
    }

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      onActionSuccess(); // Informa o componente pai que a ação foi bem-sucedida
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
      <div className="flex border-b dark:border-gray-700">
        <TabButton aba="atividade" label="Atividade" icon={Calendar} />
        <TabButton aba="anotacao" label="Anotação" icon={MessageSquare} />
        {/* Futuramente, podemos adicionar mais abas aqui (Chamada, E-mail, etc.) */}
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {abaAtiva === 'atividade' && (
          <div className="space-y-3">
            <textarea
              value={atividadeDesc}
              onChange={e => setAtividadeDesc(e.target.value)}
              placeholder="Descreva a atividade..."
              rows="3"
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
            <div className="flex items-center gap-4">
              <label htmlFor="activity-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Data:</label>
              <input
                id="activity-date"
                type="datetime-local"
                value={atividadeData}
                onChange={e => setAtividadeData(e.target.value)}
                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
          </div>
        )}

        {abaAtiva === 'anotacao' && (
          <div className="space-y-3">
            <textarea
              value={notaConteudo}
              onChange={e => setNotaConteudo(e.target.value)}
              placeholder="Escreva uma anotação..."
              rows="4"
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityComposer;