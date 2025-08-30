import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, AlertTriangle, PlusCircle } from 'lucide-react';

// Futuramente, podemos mover o FunilSettingsModal para cá para edição
// import FunilSettingsModal from '@/components/crm/FunilSettingsModal';

const CrmSettingsPage = () => {
  const [funis, setFunis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [isModalOpen, setModalOpen] = useState(false);
  // const [selectedFunil, setSelectedFunil] = useState(null);

  const fetchFunisComEtapas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('crm_funis')
        .select(`
          id,
          nome_funil,
          crm_etapas (
            id,
            nome_etapa,
            ordem
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Ordena as etapas dentro de cada funil
      const funisComEtapasOrdenadas = data.map(funil => ({
        ...funil,
        crm_etapas: funil.crm_etapas.sort((a, b) => a.ordem - b.ordem),
      }));

      setFunis(funisComEtapasOrdenadas);
    } catch (err) {
      console.error("Erro ao buscar funis e etapas:", err);
      setError('Não foi possível carregar as configurações do CRM. Verifique a sua ligação e as permissões da base de dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunisComEtapas();
  }, [fetchFunisComEtapas]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações do CRM</h1>
        <button
          // onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:bg-blue-300"
          disabled // Desativado até a funcionalidade de edição estar pronta
        >
          <PlusCircle size={20} />
          <span>Novo Funil</span>
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {funis.map(funil => (
            <div key={funil.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{funil.nome_funil}</h2>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Etapas do Funil</h3>
                {funil.crm_etapas.length > 0 ? (
                  <ul className="divide-y dark:divide-gray-700">
                    {funil.crm_etapas.map(etapa => (
                      <li key={etapa.id} className="py-2 flex justify-between items-center">
                        <span className="text-gray-800 dark:text-gray-200">{etapa.nome_etapa}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ordem: {etapa.ordem}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma etapa configurada para este funil.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrmSettingsPage;