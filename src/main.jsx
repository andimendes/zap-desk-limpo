import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// --- CÓDIGO PARA SILENCIAR O AVISO 'defaultProps' ---
const originalError = console.error;
console.error = (...args) => {
  if (/defaultProps/.test(args[0])) return;
  originalError(...args);
};
// --- FIM DO CÓDIGO DE CORREÇÃO ---

ReactDOM.createRoot(document.getElementById('root')).render(
  // O StrictMode foi desativado para garantir a compatibilidade com a biblioteca
  // de arrastar e soltar (@hello-pangea/dnd), que pode causar erros quando está ativo.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);