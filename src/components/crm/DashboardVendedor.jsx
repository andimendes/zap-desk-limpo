// src/components/crm/DashboardVendedor.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext'; // Importante para filtrar por utilizador
import { Loader2, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DashboardVendedor = () => {
  const { user } = useAuth(); // Pega o utilizador logado
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return; // Não faz nada se o utilizador não estiver carregado

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Agora a query busca apenas negócios do utilizador logado
        const { data: negocios, error: negociosError } = await supabase
            .from('crm_negocios')
            .select('*')
            .eq('responsavel_id', user.id);

        if (negociosError) throw negociosError;

        // Os cálculos agora são específicos para o vendedor
        const negociosAtivos = negocios.filter(n => n.status === 'Ativo');
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho');
        const negociosPerdidos = negocios.filter(n => n.status === 'Perdido');
        const pipelineValue = negociosAtivos.reduce((sum, n) => sum + (n.valor || 0), 0);
        const totalFechados = negociosGanhos.length + negociosPerdidos.length;
        const winRate = totalFechados > 0 ? (negociosGanhos.length / totalFechados) * 100 : 0;
        
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
  }, [user]); // Executa sempre que o 'user' mudar

  if (loading) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Meu Desempenho de Vendas
      </h1>
      
      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Meu Pipeline Ativo"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pipelineValue)}
              icon={<DollarSign className="text-blue-500" />}
              description={`${stats.totalNegociosAtivos} negócios em aberto`}
            />
            <StatCard 
              title="Minha Taxa de Conversão"
              value={`${stats.winRate.toFixed(1)}%`}
              icon={<CheckCircle className="text-green-500" />}
              description={`${stats.negociosGanhos} negócios ganhos`}
            />
            {/* ... outros cards ... */}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardVendedor;