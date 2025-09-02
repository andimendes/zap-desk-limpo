// src/components/crm/DashboardGerente.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, DollarSign, Target, CheckCircle, PlusCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

const DashboardGerente = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [negociosRes, leadsRes] = await Promise.all([
            supabase.from('crm_negocios').select('valor, status, created_at'),
            supabase.from('crm_leads').select('created_at')
        ]);

        if (negociosRes.error) throw negociosRes.error;
        if (leadsRes.error) throw leadsRes.error;

        const negocios = negociosRes.data;
        const leads = leadsRes.data;
        const hoje = new Date();
        const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        const pipelineAtivo = negocios.filter(n => n.status === 'Ativo').reduce((sum, n) => sum + (n.valor || 0), 0);
        const negociosGanhosEsteMes = negocios.filter(n => n.status === 'Ganho' && new Date(n.created_at) >= primeiroDiaDoMes);
        const totalGanhosEsteMes = negociosGanhosEsteMes.reduce((sum, n) => sum + (n.valor || 0), 0);
        const novosLeadsEsteMes = leads.filter(l => new Date(l.created_at) >= primeiroDiaDoMes).length;
        const negociosFechados = negocios.filter(n => n.status === 'Ganho' || n.status === 'Perdido');
        const negociosGanhosTotal = negocios.filter(n => n.status === 'Ganho');
        const taxaDeConversao = negociosFechados.length > 0 ? (negociosGanhosTotal.length / negociosFechados.length) * 100 : 0;

        setStats({
          pipelineAtivo,
          totalGanhosEsteMes,
          contagemGanhosEsteMes: negociosGanhosEsteMes.length,
          novosLeadsEsteMes,
          taxaDeConversao
        });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard de gerente:", err);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard de Gestão da Equipa</h1>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pipeline Ativo (Equipa)" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pipelineAtivo)} icon={<DollarSign className="text-blue-500" />} description="Valor total em negócios ativos"/>
          <StatCard title="Ganhos (Este Mês)" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalGanhosEsteMes)} icon={<CheckCircle className="text-green-500" />} description={`${stats.contagemGanhosEsteMes} negócios ganhos no período`} />
          <StatCard title="Novos Leads (Este Mês)" value={stats.novosLeadsEsteMes} icon={<PlusCircle className="text-yellow-500" />} description="Leads criados no período" />
          <StatCard title="Taxa de Conversão (Geral)" value={`${stats.taxaDeConversao.toFixed(1)}%`} icon={<Target className="text-indigo-500" />} description="de todos os negócios fechados" />
        </div>
      )}
    </div>
  );
};

export default DashboardGerente;