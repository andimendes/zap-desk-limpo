// src/pages/ContatosPage.jsx

import React from 'react';

// 1. Importamos o nosso NOVO componente de layout completo para a página de Contatos.
import PaginaContatos from '../components/contatos/PaginaContatos';

/**
 * DOCUMENTAÇÃO: ContatosPage
 * * Este componente funciona como a "página" oficial para a rota '/contatos'.
 * * A sua única responsabilidade agora é renderizar o componente <PaginaContatos />,
 * que contém toda a estrutura e lógica da tela de Contatos (grelha, lista, modal, etc.).
 * * Manter essa estrutura de "página" que chama um "componente de layout" 
 * é uma excelente prática que estamos a aplicar em todo o sistema.
 */
const ContatosPage = () => {
  return (
    <PaginaContatos />
  );
};

export default ContatosPage;