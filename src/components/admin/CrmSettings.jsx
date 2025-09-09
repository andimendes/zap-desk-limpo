// src/pages/admin/CrmSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, Edit } from 'lucide-react';
import FunilSettingsModal from '@/components/admin/FunilSettingsModal';

const CrmSettingsPage = () => {
  // Acesso ao perfil para obter o tenant_id
  const { profile } = useAuth(); 
  const [funis, setFunis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);

  const fetchFunisComEtapas = useCallback(async () => {
    // 1. VERIFICAÇÃO INICIAL: Só prossegue se tivermos o perfil com o tenant_id
    if (!profile?.tenant_id) {
      setLoading(false);
      setError("Não foi possível identificar a sua empresa. Recarregue a página.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('crm_funis')
        .select(`id, nome_funil, user_id, tenant_id, crm_etapas (id, nome_etapa, ordem)`)
        // 2. FILTRO ADICIONADO: Busca apenas funis do tenant correto
        .eq('tenant_id', profile.tenant_id) 
        .order('created_at', { ascending: true });

      if (error) throw error;
      const funisComEtapasOrdenadas = data.map(funil => ({
        ...funil,
        crm_etapas: funil.crm_etapas.sort((a, b) => a.ordem - b.ordem),
      }));
      setFunis(funisComEtapasOrdenadas);
    } catch (err) {
      setError('Não foi possível carregar as configurações do CRM.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile]); // Adicionado `profile` como dependência

  useEffect(() => {
    fetchFunisComEtapas();
  }, [fetchFunisComEtapas]);

  const handleSave = async (funisEditados) => {
    setError('');
    // 3. VERIFICAÇÃO DE SEGURANÇA: Garante que temos o tenant_id para salvar
    if (!profile?.tenant_id) {
        setError("Sessão inválida ou empresa não identificada. Por favor, recarregue a página.");
        return;
    }
    const tenantId = profile.tenant_id;

    try {
      // Lógica para apagar funis removidos (não muda)
      const originalFunisIds = funis.map(f => f.id);
      const editadosFunisIds = funisEditados.filter(f => f.id).map(f => f.id);
      const funisParaApagar = originalFunisIds.filter(id => !editadosFunisIds.includes(id));

      if (funisParaApagar.length > 0) {
        const { error: deleteError } = await supabase.from('crm_funis').delete().in('id', funisParaApagar);
        if (deleteError) throw new Error(`Erro ao apagar funis: ${deleteError.message}`);
      }
      
      for (const funil of funisEditados) {
        const funilDataParaSalvar = {
            id: funil.id,
            nome_funil: funil.nome_funil,
            user_id: funil.user_id || profile.id,
            // 4. DADO ESSENCIAL ADICIONADO: Injeta o tenant_id no objeto a ser salvo
            tenant_id: tenantId, 
        };
        
        const { data: savedFunil, error: funilError } = await supabase.from('crm_funis').upsert(funilDataParaSalvar).select().single();
        if (funilError) throw new Error(`Erro ao salvar funil "${funil.nome_funil}": ${funilError.message}`);
        
        // A lógica para salvar e apagar etapas continua a mesma,
        // pois elas estão ligadas ao `funil_id` que agora pertence ao tenant correto.
        const originalEtapasIds = funis.find(f => f.id === savedFunil.id)?.crm_etapas.map(e => e.id) || [];
        const editadasEtapasIds = funil.crm_etapas.filter(e => e.id).map(e => e.id);
        const etapasParaApagar = originalEtapasIds.filter(id => !editadasEtapasIds.includes(id));

        if (etapasParaApagar.length > 0) {
            const { error: deleteEtapaError } = await supabase.from('crm_etapas').delete().in('id', etapasParaApagar);
            if(deleteEtapaError) throw new Error(`Erro ao apagar etapas: ${deleteEtapaError.message}`);
        }

        if (funil.crm_etapas.length > 0) {
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
      setError(err.message);
      console.error(err);
    }
  };

  // O resto do componente (JSX) não precisa de alterações.
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
             {funis.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhum funil criado. Clique em "Gerir Funis" para começar.</p>}
          </div>
        )}
      </div>
    </>
  );
};

export default CrmSettingsPage;