import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  // O StrictMode foi desativado para garantir a compatibilidade com a biblioteca
  // de arrastar e soltar (@hello-pangea/dnd), que pode causar erros quando está ativo.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);

