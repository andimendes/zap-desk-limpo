// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null); // Vai guardar as nossas estatísticas calculadas
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Buscar todos os negócios e todas as etapas em paralelo
        const [negociosRes, etapasRes] = await Promise.all([
          supabase.from('crm_negocios').select('*'),
          supabase.from('crm_etapas').select('*').order('ordem')
        ]);

        if (negociosRes.error) throw negociosRes.error;
        if (etapasRes.error) throw etapasRes.error;

        const negocios = negociosRes.data || [];
        const etapas = etapasRes.data || [];

        // 2. Calcular os KPIs a partir dos dados brutos
        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');

        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
        // Dados para o gráfico de funil
        const funnelData = etapas.map(etapa => ({
          name: etapa.nome_etapa,
          value: negocios.filter(n => n.etapa_id === etapa.id).length,
        }));

        // 3. Guardar os resultados no estado
        setStats({
          totalNegociosAtivos: negociosAtivos.length,
          pipelineValue: pipelineValue,
          negociosGanhos: negociosGanhos.length,
          negociosPerdidos: negociosPerdidos.length,
          winRate: winRate,
          funnelData: funnelData
        });

      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // O array vazio [] significa que este efeito executa apenas uma vez, quando a página carrega

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }
  
  // 4. Mostrar os dados calculados de forma simples para verificação
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Dashboard de Vendas
      </h1>
      
      {stats && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="font-bold mb-4">Estatísticas (Dados Brutos para Teste):</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;