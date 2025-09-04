import React from 'react';

const StatusPipeline = ({ statusAtual, onStatusChange }) => {
    const etapas = ['Aberto', 'Em Andamento', 'Aguardando Cliente', 'Revisão'];
    const indiceAtual = etapas.indexOf(statusAtual);

    // Não renderiza o pipeline para status concluídos
    if (!etapas.includes(statusAtual)) {
        return null;
    }

    return (
        <div className="w-full mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
                {etapas.map((etapa, index) => {
                    const isCompleta = index < indiceAtual;
                    const isAtiva = index === indiceAtual;

                    return (
                        <React.Fragment key={etapa}>
                            <div className="flex flex-col items-center text-center cursor-pointer group" onClick={() => onStatusChange(etapa)}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110
                                        ${isCompleta ? 'bg-blue-600 border-blue-600 text-white' : ''}
                                        ${isAtiva ? 'bg-white border-blue-600 text-blue-600 scale-110 shadow-lg' : ''}
                                        ${!isCompleta && !isAtiva ? 'bg-gray-200 border-gray-300 text-gray-400' : ''}
                                    `}
                                >
                                    {index + 1}
                                </div>
                                <p className={`mt-2 text-xs font-semibold w-24 ${isAtiva ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {etapa}
                                </p>
                            </div>
                            {index < etapas.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-500 ${isCompleta ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusPipeline;