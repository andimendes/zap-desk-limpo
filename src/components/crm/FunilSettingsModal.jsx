// src/components/crm/FunilSettingsModal.jsx
import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Trash2, PlusCircle } from 'lucide-react';

const FunilSettingsModal = ({ isOpen, onClose, funis, onConfigSave }) => {
  const [activeFunis, setActiveFunis] = useState(funis);

  const handleSave = () => {
    // A lógica para salvar as alterações será implementada aqui
    onConfigSave(activeFunis);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Configurar Funis e Etapas</h2>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {activeFunis.map((funil, funilIndex) => (
            <div key={funil.id || `funil-${funilIndex}`} className="p-4 border rounded-lg">
              <input
                type="text"
                value={funil.nome_funil}
                // onChange={(e) => handleFunilNameChange(funilIndex, e.target.value)}
                className="text-xl font-semibold w-full border-b-2 mb-4 pb-2 focus:outline-none focus:border-blue-500"
                placeholder="Nome do Funil"
              />
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-600">Etapas:</h4>
                {/* Mapeamento das etapas virá aqui */}
              </div>
               <button className="text-blue-600 hover:text-blue-800 mt-2 flex items-center">
                  <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Etapa
                </button>
            </div>
          ))}
        </div>

        <button className="text-blue-600 hover:text-blue-800 mt-4 flex items-center font-semibold">
          <PlusCircle className="w-5 h-5 mr-2" /> Adicionar Funil
        </button>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunilSettingsModal;
