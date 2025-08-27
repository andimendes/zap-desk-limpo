// src/pages/ConfirmacaoPage.jsx
import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom'; // Certifica-te de que estás a usar react-router-dom

export default function ConfirmacaoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <CheckCircle className="text-green-500 h-20 w-20 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          E-mail Confirmado!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          A tua conta foi verificada com sucesso. Agora já podes aceder ao sistema.
        </p>
        <Link
          to="/login" // Ou para a página de login da tua aplicação
          className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 shadow-lg transition-transform transform hover:scale-105"
        >
          Ir para o Login
          <ArrowRight size={20} />
        </Link>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
        Bem-vindo ao Zap Desk Pro.
      </p>
    </div>
  );
}
