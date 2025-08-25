import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title }) => {
    const { profile, session } = useAuth();
    return (
        <header className="bg-white border-b p-4 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <div className="text-right">
                <div className="font-semibold">{profile?.full_name || session.user.email}</div>
                <div className="text-xs text-gray-500 capitalize">{profile?.role || 'Usuário'}</div>
            </div>
        </header>
    );
};

export default Header;
