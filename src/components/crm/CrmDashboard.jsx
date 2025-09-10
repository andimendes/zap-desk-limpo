// src/components/crm/CrmDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, DollarSign, Target, CheckCircle, XCircle, Trophy } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

const CrmDashboard = ({ funilId, dataVersion }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const initialStats = {
        totalNegociosAtivos: 0,
        pipelineValue: 0,
        negociosGanhosCount: 0,
        negociosPerdidosCount: 0,
        winRate: 0,
        valorGanhos: 0
      };
      
      if (!funilId) {
        setLoading(false);
        setStats(initialStats);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const { data: etapas, error: etapasError } = await supabase
          .from('crm_etapas')
          .select('id')
          .eq('funil_id', funilId);

        if (etapasError) throw etapasError;

        if (!etapas || etapas.length === 0) {
          setStats(initialStats);
          setLoading(false);
          return;
        }

        const etapaIds = etapas.map(e => e.id);

        const { data: negocios, error: negociosError } = await supabase
          .from('crm_negocios')
          .select('status, valor')
          .in('etapa_id', etapaIds);

        if (negociosError) throw negociosError;

        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');
        
        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const valorGanhos = negociosGanhos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
        setStats({
          totalNegociosAtivos: negociosAtivos.length,
          pipelineValue: pipelineValue,
          negociosGanhosCount: negociosGanhos.length,
          negociosPerdidosCount: negociosPerdidos.length,
          winRate: winRate,
          valorGanhos: valorGanhos
        });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [funilId, dataVersion]);

  if (loading) return <div className="p-4 sm:p-6 lg:p-8"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8 text-red-500">{error}</div>;
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* --- ALTERAÇÃO NA ORDEM --- */}
          {/* Card "Valor Ganho" agora é o primeiro */}
          <StatCard 
            title="Valor Ganho" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.valorGanhos)} 
            icon={<Trophy className="text-green-500" />} 
            description={`${stats.negociosGanhosCount} negócios ganhos`} 
          />
          {/* Card "Pipeline Ativo" agora é o segundo */}
          <StatCard 
            title="Pipeline Ativo" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pipelineValue)} 
            icon={<DollarSign className="text-blue-500" />} 
            description={`${stats.totalNegociosAtivos} negócios em aberto`} 
          />
          <StatCard 
            title="Taxa de Conversão" 
            value={`${stats.winRate.toFixed(1)}%`} 
            icon={<CheckCircle className="text-teal-500" />} 
            description={`de ${stats.negociosGanhosCount + stats.negociosPerdidosCount} negócios fechados`} 
          />
          <StatCard 
            title="Negócios Perdidos" 
            value={stats.negociosPerdidosCount} 
            icon={<XCircle className="text-red-500" />} 
            description="Oportunidades perdidas" 
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