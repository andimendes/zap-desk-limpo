// src/pages/CrmPage.jsx

import React from 'react';
import CrmBoard from '@/components/crm/CrmBoard';
import CrmDashboard from '@/components/crm/CrmDashboard'; // 1. Importamos o nosso novo componente

const CrmPage = () => {
  return (
    <div>
      {/* 2. Adicionamos o painel de indicadores no topo */}
      <CrmDashboard />

      {/* Uma linha divisória para separar visualmente as secções */}
      <hr className="border-gray-200 dark:border-gray-700" />
      
      {/* 3. O nosso quadro Kanban continua logo abaixo */}
      <CrmBoard />
    </div>
  );
};

export default CrmPage;