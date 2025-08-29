import React, { useState } from 'react';
import Sidebar from './Sidebar';

// O MainLayout agora recebe o 'profile' para passar para a Sidebar
export default function MainLayout({ children, activePage, setActivePage, profile }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar 
                isExpanded={isExpanded} 
                setIsExpanded={setIsExpanded}
                activePage={activePage}
                setActivePage={setActivePage}
                profile={profile} // Passa o perfil para a Sidebar
            />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-20'}`}>
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
