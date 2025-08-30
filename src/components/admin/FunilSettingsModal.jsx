import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';

const FunilSettingsModal = ({ isOpen, onClose, funis: initialFunis, onSave }) => {
  const [funis, setFunis] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialFunis) {
      setFunis(JSON.parse(JSON.stringify(initialFunis)));
    }
  }, [initialFunis, isOpen]);

  const handleFunilChange = (index, field, value) => {
    const newFunis = [...funis];
    newFunis[index][field] = value;
    setFunis(newFunis);
  };

  const handleEtapaChange = (funilIndex, etapaIndex, field, value) => {
    const newFunis = [...funis];
    newFunis[funilIndex].crm_etapas[etapaIndex][field] = value;
    setFunis(newFunis);
  };

  const addFunil = () => {
    setFunis([...funis, { nome_funil: '', crm_etapas: [] }]);
  };

  const addEtapa = (funilIndex) => {
    const newFunis = [...funis];
    const newOrder = newFunis[funilIndex].crm_etapas.length + 1;
    newFunis[funilIndex].crm_etapas.push({ nome_etapa: '', ordem: newOrder });
    setFunis(newFunis);
  };

  const removeFunil = (index) => {
    setFunis(funis.filter((_, i) => i !== index));
  };

  const removeEtapa = (funilIndex, etapaIndex) => {
    const newFunis = [...funis];
    newFunis[funilIndex].crm_etapas = newFunis[funilIndex].crm_etapas.filter((_, i) => i !== etapaIndex);
    newFunis[funilIndex].crm_etapas.forEach((etapa, index) => {
      etapa.ordem = index + 1;
    });
    setFunis(newFunis);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    await onSave(funis);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Configurar Funis e Etapas</h2>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {funis.map((funil, funilIndex) => (
            <div key={funil.id || `new-funil-${funilIndex}`} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={funil.nome_funil}
                  onChange={(e) => handleFunilChange(funilIndex, 'nome_funil', e.target.value)}
                  className="text-xl font-semibold w-full border-b-2 bg-transparent pb-1 focus:outline-none focus:border-blue-500 dark:text-gray-100"
                  placeholder="Nome do Funil"
                />
                <button onClick={() => removeFunil(funilIndex)} className="text-red-500 hover:text-red-700 ml-4 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-2 pl-4">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">ETAPAS:</h4>
                {funil.crm_etapas.map((etapa, etapaIndex) => (
                  <div key={etapa.id || `new-etapa-${etapaIndex}`} className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{etapaIndex + 1}.</span>
                    <input
                      type="text"
                      value={etapa.nome_etapa}
                      onChange={(e) => handleEtapaChange(funilIndex, etapaIndex, 'nome_etapa', e.target.value)}
                      className="w-full p-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      placeholder="Nome da Etapa"
                    />
                    <button onClick={() => removeEtapa(funilIndex, etapaIndex)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addEtapa(funilIndex)} className="text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-2 text-sm font-semibold">
                  <PlusCircle size={16} /> Adicionar Etapa
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addFunil} className="text-blue-600 hover:text-blue-800 mt-4 flex items-center font-semibold gap-2">
          <PlusCircle size={20} /> Adicionar Funil
        </button>

        <div className="flex justify-end space-x-4 mt-8">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
            Cancelar
          </button>
          <button type="button" onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:bg-blue-400">
            {isSaving && <Loader2 className="animate-spin" size={18} />}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunilSettingsModal;

