// src/components/crm/AtividadeFoco.jsx

import React from 'react';
import { Calendar, User, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para formatar a data de forma inteligente
const formatarDataVencimento = (data) => {
  const dataAtividade = new Date(data);
  if (isToday(dataAtividade)) {
    return `Hoje às ${format(dataAtividade, 'HH:mm')}`;
  }
  if (isTomorrow(dataAtividade)) {
    return `Amanhã às ${format(dataAtividade, 'HH:mm')}`;
  }
  return format(dataAtividade, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
};

const AtividadeFoco = ({ atividade, onConcluir }) => {
  if (!atividade) {
    return (
      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-center">
        <p className="text-gray-600 dark:text-gray-400">Nenhuma atividade futura agendada.</p>
        <button className="mt-2 text-sm text-blue-600 font-semibold">Agendar uma</button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800 dark:text-gray-100">{atividade.descricao}</p>
          <div className="flex items-center gap-4 text-sm text-blue-800 dark:text-blue-300 mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {formatarDataVencimento(atividade.data_atividade)}
            </span>
            {/* Adicionar nome do responsável da atividade se houver */}
          </div>
        </div>
        <button 
          onClick={() => onConcluir(atividade.id, atividade.concluida)}
          className="flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-800 dark:hover:text-green-400 px-3 py-1 rounded-md bg-green-100 dark:bg-green-900/50"
        >
          <CheckCircle size={16} />
          Concluir
        </button>
      </div>
    </div>
  );
};

export default AtividadeFoco;