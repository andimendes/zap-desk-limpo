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

  // 1. FUNÇÃO DE BUSCA CORRIGIDA
  const fetchFunisComEtapas = useCallback(async () => {
    // Verificação de segurança: só busca dados se o perfil (e o tenant) estiverem carregados
    if (!profile?.tenant_id) {
      setLoading(false);
      // Podemos optar por não mostrar um erro aqui, a menos que o perfil falhe em carregar
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('crm_funis')
        .select(`id, nome_funil, user_id, crm_etapas (id, nome_etapa, ordem)`)
        // A LINHA MAIS IMPORTANTE: Filtra os funis APENAS para o tenant do utilizador logado
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
  }, [profile]); // O profile é agora uma dependência para re-executar a busca se ele mudar

  useEffect(() => {
    fetchFunisComEtapas();
  }, [fetchFunisComEtapas]);


  // 2. FUNÇÃO DE SALVAMENTO CORRIGIDA
  const handleSave = async (funisEditados) => {
    // Verificação de segurança crucial antes de tentar salvar
    if (!profile?.tenant_id) {
        setError("Sessão inválida ou empresa não identificada. Por favor, recarregue a página.");
        return;
    }

    setError('');

    try {
      // A lógica para apagar funis removidos permanece a mesma
      const originalFunisIds = funis.map(f => f.id);
      const editadosFunisIds = funisEditados.filter(f => f.id).map(f => f.id);
      const funisParaApagar = originalFunisIds.filter(id => !editadosFunisIds.includes(id));

      if (funisParaApagar.length > 0) {
        const { error: deleteError } = await supabase.from('crm_funis').delete().in('id', funisParaApagar);
        if (deleteError) throw new Error(`Erro ao apagar funis: ${deleteError.message}`);
      }
      
      for (const funil of funisEditados) {
        // O PONTO CRÍTICO DA SOLUÇÃO: Adicionar o tenant_id aos dados a serem salvos
        const funilDataParaSalvar = {
            id: funil.id,
            nome_funil: funil.nome_funil,
            user_id: funil.user_id || profile.id,
            tenant_id: profile.tenant_id // <-- A CORREÇÃO ESSENCIAL
        };
        
        const { data: savedFunil, error: funilError } = await supabase
            .from('crm_funis')
            .upsert(funilDataParaSalvar)
            .select()
            .single();

        if (funilError) {
          // Se o erro for de RLS, a mensagem será mais clara agora
          if (funilError.message.includes('violates row-level security policy')) {
            throw new Error(`Erro de segurança ao salvar o funil "${funil.nome_funil}". Verifique as suas permissões.`);
          }
          throw funilError;
        }

        // A lógica para salvar etapas permanece a mesma, pois agora ela depende de um funil corretamente salvo
        if (funil.crm_etapas?.length > 0) {
          const etapasParaSalvar = funil.crm_etapas.map((etapa, index) => ({
              ...etapa,
              funil_id: savedFunil.id,
              ordem: index + 1,
          }));
          const { error: etapaError } = await supabase.from('crm_etapas').upsert(etapasParaSalvar);
          if (etapaError) throw new Error(`Erro ao salvar etapas para o funil "${savedFunil.nome_funil}": ${etapaError.message}`);
        }
      }

      await fetchFunisComEtapas();
    } catch (err) {
      console.error("Erro detalhado ao salvar:", err);
      setError(err.message);
    }
  };

  // O JSX não precisa de alterações
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