// src/components/crm/CrmDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
// A importação da 'recharts' foi removida

const CrmDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Otimizado: agora buscamos apenas os negócios, pois as etapas não são mais necessárias para os cards.
        const { data: negocios, error: negociosError } = await supabase.from('crm_negocios').select('*');

        if (negociosError) throw negociosError;

        // A lógica de cálculo para os cards permanece a mesma
        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');
        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
        // A parte que calculava os dados do funil (funnelData) foi removida.

        setStats({
          totalNegociosAtivos: negociosAtivos.length,
          pipelineValue: pipelineValue,
          negociosGanhos: negociosGanhos.length,
          negociosPerdidos: negociosPerdidos.length,
          winRate: winRate,
        });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 inline-block" /></div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {stats && (
        // A secção do gráfico foi removida, mantendo apenas a grelha de cards.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Pipeline Ativo"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pipelineValue)}
            icon={<DollarSign className="text-blue-500" />}
            description={`${stats.totalNegociosAtivos} negócios em aberto`}
          />
          <StatCard 
            title="Taxa de Conversão"
            value={`${stats.winRate.toFixed(1)}%`}
            icon={<CheckCircle className="text-green-500" />}
            description={`${stats.negociosGanhos} negócios ganhos`}
          />
          <StatCard 
            title="Negócios Perdidos"
            value={stats.negociosPerdidos}
            icon={<XCircle className="text-red-500" />}
            description={`de ${stats.negociosGanhos + stats.negociosPerdidos} negócios fechados`}
          />
          <StatCard 
            title="Negócios Ativos"
            value={stats.totalNegociosAtivos}
            icon={<Target className="text-yellow-500" />}
            description="Oportunidades no funil"
          />
        </div>
      )}
    </div>
  );
};

export default CrmDashboard;