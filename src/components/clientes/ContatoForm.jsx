import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Briefcase, Mail, Phone, X } from 'lucide-react';

const InputField = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
        </div>
        <input 
            {...props} 
            className="w-full p-2 pl-10 border rounded-lg transition bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

export default function ContatoForm({ onSave, initialData, onClose }) {
    const [formData, setFormData] = useState({
        nome: '',
        cargo: '',
        email: '',
        telefone: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dadosParaSalvar = {
            nome: formData.nome,
            cargo: formData.cargo,
            email: formData.email,
            telefone: formData.telefone
        };

        if (formData.id) {
            const { error } = await supabase
                .from('crm_contatos')
                .update(dadosParaSalvar)
                .eq('id', formData.id);
            if (error) {
                alert('Erro ao atualizar contato: ' + error.message);
            }
        } else {
            const { error } = await supabase
                .from('crm_contatos')
                .insert(dadosParaSalvar);
            if (error) {
                alert('Erro ao criar contato: ' + error.message);
            }
        }
        
        setLoading(false);
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{formData.id ? 'Editar Contato' : 'Novo Contato'}</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} /></button>
            </div>
            
            <InputField icon={<User size={16}/>} name="nome" value={formData.nome || ''} onChange={handleChange} placeholder="Nome completo" required />
            <InputField icon={<Briefcase size={16}/>} name="cargo" value={formData.cargo || ''} onChange={handleChange} placeholder="Cargo" />
            <InputField icon={<Mail size={16}/>} name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="E-mail" />
            <InputField icon={<Phone size={16}/>} name="telefone" value={formData.telefone || ''} onChange={handleChange} placeholder="Telefone / WhatsApp" />

            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="mr-2 py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="py-2 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                    {loading ? 'A salvar...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
}