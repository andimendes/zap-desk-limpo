// src/pages/CrmPage.jsx

import React from 'react';

// 1. Importamos o nosso NOVO componente de layout completo para o CRM.
import PaginaCRM from '@/components/crm/PaginaCRM';

/**
 * DOCUMENTAÇÃO: CrmPage
 * * Este componente funciona como a "página" oficial para a rota '/crm'.
 * * A sua única responsabilidade agora é renderizar o componente <PaginaCRM />,
 * que contém toda a estrutura e lógica da nova tela do CRM (cabeçalho, 
 * dashboard e a área de trabalho com o funil).
 * * Manter essa estrutura de "página" que chama um "componente de layout" 
 * é uma excelente prática de organização de código.
 */
const CrmPage = () => {
  return (
    <PaginaCRM />
  );
};

export default CrmPage;