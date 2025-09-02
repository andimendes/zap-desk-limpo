// src/pages/DashboardPage.jsx

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardVendedor from '@/components/crm/DashboardVendedor';
import DashboardGerente from '@/components/crm/DashboardGerente';
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

  // --- CORREÇÃO IMPORTANTE ---
  // Verificamos se 'profile.role' existe e convertemos para maiúsculas
  // antes de comparar. Isto evita erros se a role estiver em minúsculas ('adm')
  // ou se o campo for nulo.
  if (profile && profile.role?.toUpperCase() === 'ADM') {
    return <DashboardGerente />;
  } else {
    return <DashboardVendedor />;
  }
};

export default DashboardPage;