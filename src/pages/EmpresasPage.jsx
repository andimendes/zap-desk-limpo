// src/pages/EmpresasPage.jsx

import React from 'react';

// 1. Importamos o nosso NOVO componente de layout completo para a Central de Empresas.
import PaginaEmpresas from '../components/clientes/PaginaEmpresas';

/**
 * DOCUMENTAÇÃO: EmpresasPage
 * * Este componente funciona como a "página" oficial para a rota '/empresas'.
 * * A sua única responsabilidade agora é renderizar o componente <PaginaEmpresas />,
 * que contém toda a estrutura e lógica da tela de Empresas (listagem, modais, busca, etc.).
 * * Manter essa estrutura de "página" que chama um "componente de layout" 
 * é uma excelente prática de organização de código.
 */
const EmpresasPage = () => {
  return (
    <PaginaEmpresas />
  );
};

export default EmpresasPage;