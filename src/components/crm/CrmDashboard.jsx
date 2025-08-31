// src/components/crm/CrmDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CrmDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [negociosRes, etapasRes] = await Promise.all([
          supabase.from('crm_negocios').select('*'),
          supabase.from('crm_etapas').select('*').order('ordem')
        ]);
        if (negociosRes.error) throw negociosRes.error;
        if (etapasRes.error) throw etapasRes.error;
        
        const negocios = negociosRes.data || [];
        const etapas = etapasRes.data || [];
        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');
        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
        const funnelData = etapas
          .map(etapa => ({
            name: etapa.nome_etapa,
            Negócios: negocios.filter(n => n.etapa_id === etapa.id && n.status === 'Ativo').length,
          }))
          .filter(etapa => etapa.Negócios > 0);

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
  }, []);

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 inline-block" /></div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {stats && (
        <>
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

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Funil de Vendas Ativo
            </h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={stats.funnelData} /* ...props do gráfico... */ >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip /* ...props do tooltip... */ />
                  <Bar dataKey="Negócios" fill="#3b82f6" name="Nº de Negócios"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CrmDashboard;