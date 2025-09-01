import React, { useState, useRef, useEffect } from 'react';
import { X, User, Settings, Camera, Mail, Lock, CheckCircle, AlertTriangle, Sun, Bell, Link as LinkIcon } from 'lucide-react'; // 1. Ícone adicionado
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// --- (Todos os seus sub-componentes como InputField, TabButton, etc. permanecem aqui sem alterações) ---
const InputField = ({ icon, label, ...props }) => ( /* ... */ );
const SectionDivider = () => <hr className="my-6 border-gray-200 dark:border-gray-700" />;
const TabButton = ({ icon, label, isActive, onClick }) => ( /* ... */ );
const ToggleSwitch = ({ checked, onChange }) => ( /* ... */ );
const PreferenceRow = ({ icon, title, description, children }) => ( /* ... */ );
const UserAvatar = ({ name, src }) => ( /* ... */ );

const SettingsModal = ({ isOpen, onClose, userProfile, userAuth }) => {
    // ... (toda a sua lógica de state e outras funções permanece a mesma)
    const { setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [fullName, setFullName] = useState(userProfile?.full_name || '');
    // ... etc.

    // --- 2. NOVA FUNÇÃO PARA CONECTAR COM A GOOGLE ---
    const handleGoogleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Pedimos permissão específica para ler e escrever na agenda
                scopes: 'https://www.googleapis.com/auth/calendar.events',
                // Redireciona de volta para a página onde o utilizador estava
                redirectTo: window.location.origin, 
            },
        });

        if (error) {
            console.error('Erro ao iniciar a autenticação com a Google:', error);
            alert('Não foi possível iniciar a conexão com a Google.');
        }
    };

    // ... (o resto das suas funções handle... permanecem aqui)

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col dark:bg-gray-800">
                {/* ... (Cabeçalho do Modal sem alterações) ... */}
                <div className="flex justify-between items-center p-4 border-b">...</div>

                <div className="flex flex-grow overflow-hidden">
                    {/* Sidebar de Navegação */}
                    <aside className="w-1/4 border-r border-gray-200 p-4 space-y-2 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/50">
                        <TabButton icon={<User size={18} />} label="Meu Perfil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <TabButton icon={<Settings size={18} />} label="Preferências" isActive={activeTab === 'system'} onClick={() => setActiveTab('system')} />
                        
                        {/* --- 3. NOVA ABA ADICIONADA AO MENU --- */}
                        <TabButton icon={<LinkIcon size={18} />} label="Integrações" isActive={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
                    </aside>

                    {/* Conteúdo Principal */}
                    <main className="w-3/4 p-6 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <div>{/* ... Conteúdo da aba Perfil ... */}</div>
                        )}
                        
                        {activeTab === 'system' && ( 
                            <form>{/* ... Conteúdo da aba Preferências ... */}</form> 
                        )}

                        {/* --- 4. NOVO CONTEÚDO PARA A ABA INTEGRAÇÕES --- */}
                        {activeTab === 'integrations' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Integrações</h3>
                                <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Conecte o Zap Desk a outras ferramentas para automatizar o seu trabalho.</p>
                                
                                <SectionDivider />

                                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">Google Calendar</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Permita que o Zap Desk crie eventos na sua agenda.</p>
                                    </div>
                                    <button 
                                        onClick={handleGoogleConnect}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold transition hover:bg-blue-700"
                                    >
                                        Conectar
                                    </button>
                                </div>
                                {/* Futuras integrações podem ser adicionadas aqui */}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};