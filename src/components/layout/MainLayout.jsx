import React, { useState } from 'react';
import Sidebar from './Sidebar'; // 1. Importar o nosso componente Sidebar

// O componente MainLayout agora fica muito mais simples.
// A sua única responsabilidade é organizar o layout geral da página.
export default function MainLayout({ children, activePage, setActivePage }) {
    // O estado para controlar se a sidebar está expandida ou não
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 2. Usar o componente Sidebar que criámos */}
            <Sidebar 
                isExpanded={isExpanded} 
                setIsExpanded={setIsExpanded}
                activePage={activePage}
                setActivePage={setActivePage}
            />

            {/* 3. Ajustar a margem do conteúdo principal dinamicamente */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-20'}`}>
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
