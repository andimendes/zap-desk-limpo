import React from 'react';
import { X } from 'lucide-react';
import ClienteForm from './ClienteForm';

const ClienteModal = ({ cliente, onClose, onSave }) => {
    const isEditing = cliente && cliente.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-30 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl my-8 animate-fade-in-up transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
                        <p className="text-sm text-gray-500">Preencha as informações abaixo.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={24} /></button>
                </div>
                {/* A correção está aqui: passamos um objeto vazio se o cliente for nulo */}
                <ClienteForm onSave={onSave} initialData={cliente || {}} />
            </div>
        </div>
    );
};

export default ClienteModal;
