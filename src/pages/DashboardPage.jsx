// src/pages/DashboardPage.jsx

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardVendedor from '@/components/crm/DashboardVendedor'; // O dashboard do vendedor
import DashboardGerente from '@/components/crm/DashboardGerente'; // O nosso novo dashboard
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Verificamos a função (role) do utilizador.
  // Se for 'ADM', mostramos o Dashboard de Gerente.
  // Caso contrário, mostramos o Dashboard de Vendedor.
  if (profile && profile.role === 'ADM') {
    return <DashboardGerente />;
  } else {
    return <DashboardVendedor />;
  }
};

export default DashboardPage;