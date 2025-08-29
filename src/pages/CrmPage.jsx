// src/pages/CrmPage.jsx
import React from 'react';
import CrmBoard from '@/components/crm/CrmBoard';
import MainLayout from '@/components/layout/MainLayout'; // <-- CORREÇÃO AQUI

const CrmPage = () => {
  return (
    <MainLayout> {/* <-- CORREÇÃO AQUI */}
      <CrmBoard />
    </MainLayout>
  );
};

export default CrmPage;
