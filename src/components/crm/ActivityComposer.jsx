// src/components/crm/ActivityComposer.jsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, FileText, CalendarPlus } from 'lucide-react';

const ActivityComposer = ({ negocioId, onActionSuccess }) => {
  // Estado para controlar qual aba interna está ativa ('nota' ou 'atividade')
  const [activeTab, setActiveTab] = useState('nota');
  
  // Estado para o conteúdo da anotação
  const [notaConteudo, setNotaConteudo] = useState('');

  // Estados para os campos do formulário de atividade
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [atividadeTipo, setAtividadeTipo] = useState('Tarefa'); // Valor padrão
  const [atividadeData, setAtividadeData] = useState('');
  const [atividadeHora, setAtividadeHora] = useState('');

  // Estado para controlar o carregamento durante o salvamento
  const [isSaving, setIsSaving] = useState(false);

  // Função para salvar uma nova anotação
  const handleSaveNota = async () => {
    if (!notaConteudo.trim()) {
      alert('Por favor, escreva algo na anotação.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('crm_notas')
        .insert({
          conteudo: notaConteudo,
          negocio_id: negocioId,
        });

      if (error) throw error;

      // Limpa o formulário, avisa o componente pai para recarregar os dados
      setNotaConteudo('');
      onActionSuccess();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Não foi possível salvar a anotação.');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para agendar uma nova atividade
  const handleSaveAtividade = async () => {
    if (!atividadeDescricao.trim() || !atividadeData || !atividadeHora) {
      alert('Por favor, preencha a descrição, data e hora da atividade.');
      return;
    }
    
    setIsSaving(true);
    try {
      // Combina data e hora em um único formato que o Supabase entende
      const dataAtividadeISO = new Date(`${atividadeData}T${atividadeHora}`).toISOString();

      const { error } = await supabase
        .from('crm_atividades')
        .insert({
          descricao: atividadeDescricao,
          tipo: atividadeTipo,
          data_atividade: dataAtividadeISO,
          negocio_id: negocioId,
          concluida: false, // Novas atividades nunca começam concluídas
        });

      if (error) throw error;
      
      // Limpa o formulário e recarrega os dados do modal
      setAtividadeDescricao('');
      setAtividadeTipo('Tarefa');
      setAtividadeData('');
      setAtividadeHora('');
      onActionSuccess();

    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      alert('Não foi possível salvar a atividade.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Navegação das Abas Internas */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('nota')}
          className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors ${
            activeTab === 'nota'
              ? 'text-blue-600 bg-blue-50 dark:bg-gray-700/50 border-b-2 border-blue-600'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileText size={16} />
          Anotação
        </button>
        <button
          onClick={() => setActiveTab('atividade')}
          className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors ${
            activeTab === 'atividade'
              ? 'text-blue-600 bg-blue-50 dark:bg-gray-700/50 border-b-2 border-blue-600'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CalendarPlus size={16} />
          Atividade
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="p-4">
        {activeTab === 'nota' && (
          // Formulário da Aba de Anotação
          <div className="space-y-3">
            <textarea
              value={notaConteudo}
              onChange={(e) => setNotaConteudo(e.target.value)}
              placeholder="Escreva uma anotação sobre este negócio..."
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
            <div className="text-right">
              <button
                onClick={handleSaveNota}
                disabled={isSaving || !notaConteudo.trim()}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center ml-auto"
              >
                {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                Salvar Nota
              </button>
            </div>
          </div>
        )}

        {activeTab === 'atividade' && (
          // Formulário da Aba de Atividade
          <div className="space-y-4">
            <textarea
              value={atividadeDescricao}
              onChange={(e) => setAtividadeDescricao(e.target.value)}
              placeholder="Descrição da atividade (Ex: Ligar para o cliente para follow-up)"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select 
                  value={atividadeTipo}
                  onChange={(e) => setAtividadeTipo(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option>Tarefa</option>
                  <option>Ligação</option>
                  <option>Reunião</option>
                  <option>E-mail</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input 
                  type="date"
                  value={atividadeData}
                  onChange={(e) => setAtividadeData(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                <input 
                  type="time"
                  value={atividadeHora}
                  onChange={(e) => setAtividadeHora(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={handleSaveAtividade}
                disabled={isSaving || !atividadeDescricao.trim() || !atividadeData || !atividadeHora}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center ml-auto"
              >
                {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                Salvar Atividade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityComposer;