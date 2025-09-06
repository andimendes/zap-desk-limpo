// src/pages/ChamadosPage.jsx - CÓDIGO REFATORADO

import React from 'react';

// 1. Importamos o nosso NOVO componente de layout completo para Chamados.
import PaginaChamados from '@/components/chamados/PaginaChamados';

/**
 * DOCUMENTAÇÃO: ChamadosPage
 * * Este componente funciona como a "página" oficial para a rota '/chamados'.
 * * A sua única responsabilidade agora é renderizar o componente <PaginaChamados />,
 * que contém toda a estrutura e lógica da tela de Chamados (kanban, lista, modais, etc.).
 * * Manter essa estrutura de "página" que chama um "componente de layout" 
 * é uma excelente prática de organização de código.
 */
const ChamadosPage = () => {
  return (
    <PaginaChamados />
  );
};

export default ChamadosPage;