import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Uma página simples e amigável para informar ao utilizador
 * que ele não tem permissão para aceder à rota solicitada.
 */
const AccessDeniedPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-900">
            <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Acesso Negado
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Você não tem as permissões necessárias para visualizar esta página. 
                Se acredita que isto é um erro, por favor, contacte o administrador do sistema.
            </p>
            <Link 
                to="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                Voltar ao Painel Principal
            </Link>
        </div>
    );
};

export default AccessDeniedPage;
