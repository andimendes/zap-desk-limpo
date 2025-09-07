// src/components/crm/CrmDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

// 1. O componente agora também recebe 'funilId'
const CrmDashboard = ({ filtros, termoPesquisa, funilId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  // 2. O useEffect agora também depende do 'funilId'.
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Adicionamos uma verificação para não buscar dados se o funilId ainda não estiver pronto.
      if (!funilId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // 3. A busca agora é feita em duas etapas para filtrar pelo funil.
        
        // Etapa A: Buscar os IDs de todas as etapas que pertencem ao funil selecionado.
        const { data: etapas, error: etapasError } = await supabase
          .from('crm_etapas')
          .select('id')
          .eq('funil_id', funilId);

        if (etapasError) throw etapasError;

        // Se o funil não tiver etapas, não há negócios para calcular.
        if (!etapas || etapas.length === 0) {
          setStats({ totalNegociosAtivos: 0, pipelineValue: 0, negociosGanhos: 0, negociosPerdidos: 0, winRate: 0 });
          setLoading(false);
          return;
        }

        const etapaIds = etapas.map(e => e.id);

        // Etapa B: Buscar os negócios aplicando TODOS os filtros.
        let query = supabase.from('crm_negocios').select('*');
        
        // Filtra para buscar apenas negócios que pertencem às etapas do funil correto.
        query = query.in('etapa_id', etapaIds);

        if (filtros.responsavelId && filtros.responsavelId !== 'todos') query = query.eq('responsavel_id', filtros.responsavelId);
        if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio);
        if (filtros.dataFim) query = query.lte('created_at', filtros.dataFim);
        if (termoPesquisa) query = query.or(`titulo.ilike.%${termoPesquisa}%,empresa_contato.ilike.%${termoPesquisa}%`);

        const { data: negocios, error: negociosError } = await query;
        if (negociosError) throw negociosError;

        // A lógica de cálculo permanece a mesma
        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');
        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
        setStats({ totalNegociosAtivos: negociosAtivos.length, pipelineValue: pipelineValue, negociosGanhos: negociosGanhos.length, negociosPerdidos: negociosPerdidos.length, winRate: winRate });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [filtros, termoPesquisa, funilId]); // Dependências do useEffect

  if (loading) return null;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pipeline Ativo" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pipelineValue)} icon={<DollarSign className="text-blue-500" />} description={`${stats.totalNegociosAtivos} negócios em aberto`} />
          <StatCard title="Taxa de Conversão" value={`${stats.winRate.toFixed(1)}%`} icon={<CheckCircle className="text-green-500" />} description={`${stats.negociosGanhos} negócios ganhos`} />
          <StatCard title="Negócios Perdidos" value={stats.negociosPerdidos} icon={<XCircle className="text-red-500" />} description={`de ${stats.negociosGanhos + stats.negociosPerdidos} negócios fechados`} />
          <StatCard title="Negócios Ativos" value={stats.totalNegociosAtivos} icon={<Target className="text-yellow-500" />} description="Oportunidades no funil" />
        </div>
      )}
    </div>
  );
};

export default CrmDashboard;