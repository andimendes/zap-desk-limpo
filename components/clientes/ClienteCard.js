import React from 'react';
import { MapPin, Hash, CheckCircle, XCircle } from 'lucide-react';

const ClienteCard = ({ cliente, onClick }) => {
    const getInitials = (name = '') => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const statusConfig = {
        'Ativo': { icon: <CheckCircle size={14} />, color: 'bg-green-100 text-green-700' },
        'Inativo': { icon: <XCircle size={14} />, color: 'bg-gray-100 text-gray-600' }
    };

    const currentStatus = statusConfig[cliente.status] || statusConfig['Inativo'];

    return (
        <div onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-500 transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer group">
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                            {getInitials(cliente.razao_social)}
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-gray-800 group-hover:text-blue-600 transition-colors">{cliente.razao_social}</h3>
                            <p className="text-sm text-gray-500">{cliente.nome_fantasia || 'Sem nome fantasia'}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.color}`}>
                        {currentStatus.icon}
                        {cliente.status}
                    </div>
                </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600 border-t pt-3 mt-3">
                <div className="flex items-center gap-2">
                    <Hash size={14} className="text-gray-400" />
                    <span>{cliente.cnpj}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{cliente.cidade} / {cliente.estado}</span>
                </div>
            </div>
        </div>
    );
};

export default ClienteCard;
