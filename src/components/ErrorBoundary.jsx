// src/components/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Você também pode logar o erro para um serviço de reporte de erros
    console.error("--- ERRO CAPTURADO PELO ERROR BOUNDARY ---");
    console.error("Erro:", error);
    console.error("Informações do Componente:", errorInfo.componentStack);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback.
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full">
                <h1 className="text-2xl font-bold text-red-500">Algo deu errado.</h1>
                <p className="mt-4 text-gray-700 dark:text-gray-300">Ocorreu um erro ao tentar renderizar esta parte da aplicação.</p>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Por favor, verifique o console do navegador para detalhes técnicos.</p>
                {this.state.error && (
                    <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 text-red-500 rounded-md text-xs overflow-auto">
                        {this.state.error.toString()}
                    </pre>
                )}
                 <button 
                    onClick={() => this.setState({ hasError: false, error: null })} 
                    className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;