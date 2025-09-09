// src/pages/PerfilPage.jsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Ajuste o caminho se necessário
import { supabase } from '@/supabaseClient'; // Ajuste o caminho se necessário
import { User, Mail, Smartphone, Building } from 'lucide-react';

// Um componente simples para exibir informações do perfil
const ProfileInfoRow = ({ icon, label, value }) => (
    <div className="flex items-center border-t border-gray-200 dark:border-gray-700 py-3">
        <div className="w-8">{icon}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 w-24">{label}</div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</div>
    </div>
);

// Componente principal da página de perfil
const PerfilPage = () => {
    // Busca o perfil do usuário que já foi carregado no login
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-center">A carregar perfil...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center text-red-500">Não foi possível carregar os dados do perfil.</div>;
    }

    // Função para lidar com a alteração de senha (exemplo)
    const handlePasswordRecovery = async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: `${window.location.origin}/update-password`, // Rota para sua página de nova senha
        });

        if (error) {
            alert("Erro ao enviar e-mail de recuperação: " + error.message);
        } else {
            alert("Enviámos um link de recuperação para o seu e-mail!");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Meu Perfil
            </h1>

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <img
                            className="h-16 w-16 rounded-full object-cover"
                            src={`https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}&background=random&color=fff`}
                            alt="Avatar"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{profile.full_name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                        Informações Pessoais
                    </h3>

                    <ProfileInfoRow
                        icon={<User size={16} className="text-gray-400" />}
                        label="Nome"
                        value={profile.full_name}
                    />
                    <ProfileInfoRow
                        icon={<Mail size={16} className="text-gray-400" />}
                        label="Email"
                        value={profile.email}
                    />
                    <ProfileInfoRow
                        icon={<Smartphone size={16} className="text-gray-400" />}
                        label="Celular"
                        value={profile.celular || 'Não informado'}
                    />
                    
                    {/* Exemplo de como mostrar a empresa (tenant). 
                        Isto assume que você adicionou a informação do tenant ao seu `profile` no AuthContext */}
                    {profile.tenant_name && (
                         <ProfileInfoRow
                            icon={<Building size={16} className="text-gray-400" />}
                            label="Empresa"
                            value={profile.tenant_name}
                        />
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 border-t dark:border-gray-700 rounded-b-lg">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-4">
                        Segurança
                    </h3>
                    <button
                        onClick={handlePasswordRecovery}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Alterar minha senha
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Será enviado um link para o seu e-mail para criar uma nova senha.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PerfilPage;