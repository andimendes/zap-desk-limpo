// src/pages/CrmPage.jsx
import React from 'react';
import CrmBoard from '@/components/crm/CrmBoard';

const CrmPage = () => {
  // A página agora apenas renderiza o componente principal do CRM.
  // O Layout já é fornecido pelo App.jsx, evitando a duplicação.
  return <CrmBoard />;
};

export default CrmPage;
