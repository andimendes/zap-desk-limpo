// src/pages/CrmPage.jsx
import React from 'react';
import CrmBoard from '../components/crm/CrmBoard';
import Layout from '../components/layout/Layout'; // Verifique se este é o seu componente de Layout principal

const CrmPage = () => {
  return (
    <Layout>
      <CrmBoard />
    </Layout>
  );
};

export default CrmPage;