// src/pages/CrmPage.jsx

import React from 'react';
import CrmBoard from '@/components/crm/CrmBoard';
import CrmDashboard from '@/components/crm/CrmDashboard';

const CrmPage = () => {
  return (
    <div>
      {/* O painel de indicadores no topo */}
      <CrmDashboard />

      {/* Uma linha divisória para separar visualmente as secções */}
      <hr className="border-gray-200 dark:border-gray-700" />
      
      {/* O nosso quadro Kanban logo abaixo */}
      <CrmBoard />
    </div>
  );
};

export default CrmPage;