import React from 'react';
import { Wrench } from 'lucide-react';

// Um componente genérico para páginas em desenvolvimento
const PlaceholderPage = ({ title }) => {
    return (
        <div className="p-4 md:p-8 flex flex-col items-center justify-center text-center h-full">
            <Wrench size={64} className="text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 mt-2">Este módulo está em desenvolvimento e estará disponível em breve.</p>
        </div>
    );
};

export default PlaceholderPage;
