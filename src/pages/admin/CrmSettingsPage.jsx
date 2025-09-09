import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, Edit } from 'lucide-react';
import FunilSettingsModal from '@/components/admin/FunilSettingsModal';

const CrmSettingsPage = () => {
  // O perfil do AuthContext é a nossa fonte da verdade para saber o tenant_id
  const { profile } = useAuth();
  const [funis, setFunis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);

  // Função para buscar os dados, agora com filtro de tenant
  const fetchFunisComEtapas = useCallback(async () => {
    if (!profile?.tenant_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('crm_funis')
        .select(`id, nome_funil, user_id, crm_etapas (id, nome_etapa, ordem)`)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const funisComEtapasOrdenadas = data.map(funil => ({
        ...funil,
        crm_etapas: funil.crm_etapas.sort((a, b) => a.ordem - b.ordem),
      }));
      setFunis(funisComEtapasOrdenadas);

    } catch (err) {
      console.error("Erro ao buscar funis:", err);
      setError('Não foi possível carregar as configurações do CRM.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchFunisComEtapas();
  }, [fetchFunisComEtapas]);

  // Função para salvar, agora tratando funis e etapas corretamente
  const handleSave = async (funisEditados) => {
    if (!profile?.tenant_id) {
        setError("Sessão inválida ou empresa não identificada. Por favor, recarregue a página.");
        return;
    }
    setError('');

    try {
      // Lógica para apagar funis que foram removidos na edição
      const originalFunisIds = funis.map(f => f.id);
      const editadosFunisIds = funisEditados.filter(f => f.id).map(f => f.id);
      const funisParaApagar = originalFunisIds.filter(id => !editadosFunisIds.includes(id));

      if (funisParaApagar.length > 0) {
        const { error: deleteError } = await supabase.from('crm_funis').delete().in('id', funisParaApagar);
        if (deleteError) throw new Error(`Erro ao apagar funis: ${deleteError.message}`);
      }
      
      for (const funil of funisEditados) {
        // Salva ou atualiza o funil principal, garantindo a inclusão do tenant_id
        const funilDataParaSalvar = {
            id: funil.id,
            nome_funil: funil.nome_funil,
            user_id: funil.user_id || profile.id,
            tenant_id: profile.tenant_id
        };
        
        const { data: savedFunil, error: funilError } = await supabase
            .from('crm_funis')
            .upsert(funilDataParaSalvar)
            .select()
            .single();

        if (funilError) throw funilError;

        // Lógica para apagar etapas que foram removidas de um funil
        const funilOriginal = funis.find(f => f.id === savedFunil.id);
        const originalEtapasIds = funilOriginal?.crm_etapas.map(e => e.id) || [];
        const editadasEtapasIds = funil.crm_etapas.filter(e => e.id).map(e => e.id);
        const etapasParaApagar = originalEtapasIds.filter(id => !editadasEtapasIds.includes(id));

        if (etapasParaApagar.length > 0) {
            const { error: deleteEtapaError } = await supabase.from('crm_etapas').delete().in('id', etapasParaApagar);
            if(deleteEtapaError) throw new Error(`Erro ao apagar etapas: ${deleteEtapaError.message}`);
        }

        // Lógica para salvar ou atualizar as etapas
        if (funil.crm_etapas?.length > 0) {
          const etapasParaSalvar = funil.crm_etapas.map((etapa, index) => {
              const novaEtapa = {
                  nome_etapa: etapa.nome_etapa,
                  funil_id: savedFunil.id,
                  ordem: index + 1,
              };
              // Apenas adiciona o 'id' se ele já existir (para atualizações)
              if (etapa.id) {
                  novaEtapa.id = etapa.id;
              }
              return novaEtapa;
          });

          const { error: etapaError } = await supabase.from('crm_etapas').upsert(etapasParaSalvar);
          if (etapaError) throw new Error(`Erro ao salvar etapas para o funil "${savedFunil.nome_funil}": ${etapaError.message}`);
        }
      }

      await fetchFunisComEtapas();
      setModalOpen(false); // Fecha o modal após salvar com sucesso
    } catch (err) {
      console.error("Erro detalhado ao salvar:", err);
      setError(err.message);
    }
  };

  return (
    <>
      <FunilSettingsModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        funis={funis}
        onSave={handleSave}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações do CRM</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Edit size={18} />
            <span>Gerir Funis</span>
          </button>
        </div>

        {loading && <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center gap-3"><AlertTriangle className="h-6 w-6" /><p>{error}</p></div>}
        
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
                        <li key={etapa.id} className="py-2 text-gray-800 dark:text-gray-200">{etapa.nome_etapa}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma etapa configurada.</p>
                  )}
                </div>
              </div>
            ))}
             {funis.length === 0 && !loading && <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhum funil criado. Clique em "Gerir Funis" para começar.</p>}
          </div>
        )}
      </div>
    </>
  );
};

export default CrmSettingsPage;