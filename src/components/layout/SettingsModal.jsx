import React, { useState, useRef, useEffect } from 'react';
import { X, User, Settings, Camera, Mail, Lock, CheckCircle, AlertTriangle, Sun, Bell, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// --- (Todos os seus sub-componentes permanecem aqui sem alterações) ---
const InputField = ({ icon, label, ...props }) => ( /* ... */ );
const SectionDivider = () => <hr className="my-6" />;
const TabButton = ({ icon, label, isActive, onClick }) => ( /* ... */ );
const ToggleSwitch = ({ checked, onChange }) => ( /* ... */ );
const PreferenceRow = ({ icon, title, description, children }) => ( /* ... */ );
const UserAvatar = ({ name, src }) => ( /* ... */ );

const SettingsModal = ({ isOpen, onClose, userProfile, userAuth }) => {
    // ... (Todos os outros estados permanecem os mesmos)
    const [activeTab, setActiveTab] = useState('profile');
    
    // --- NOVO ESTADO PARA CONTROLAR A CONEXÃO ---
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [googleIdentity, setGoogleIdentity] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // ... (A sua função fetchPreferences permanece a mesma)

            // --- NOVA LÓGICA PARA VERIFICAR A CONEXÃO COM A GOOGLE ---
            const checkGoogleConnection = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const googleIdentity = session?.user?.identities?.find(
                    (identity) => identity.provider === 'google'
                );
                
                if (googleIdentity) {
                    setIsGoogleConnected(true);
                    setGoogleIdentity(googleIdentity);
                } else {
                    setIsGoogleConnected(false);
                    setGoogleIdentity(null);
                }
            };
            checkGoogleConnection();
        }
    }, [isOpen, userAuth?.id, setTheme]);

    const handleGoogleConnect = async () => { /* ... (esta função não muda) ... */ };

    // --- NOVA FUNÇÃO PARA DESCONECTAR DA GOOGLE ---
    const handleGoogleDisconnect = async () => {
        if (!googleIdentity) return;

        if (window.confirm('Tem a certeza que quer desconectar a sua conta Google? O Zap Desk perderá o acesso à sua agenda.')) {
            const { error } = await supabase.auth.unlinkIdentity(googleIdentity);

            if (error) {
                alert('Erro ao desconectar a conta Google.');
                console.error('Erro ao desvincular identidade:', error);
            } else {
                setIsGoogleConnected(false);
                setGoogleIdentity(null);
                alert('Conta Google desconectada com sucesso.');
            }
        }
    };

    // ... (O resto das suas funções handle... permanecem as mesmas)

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col dark:bg-gray-800">
                {/* ... (Cabeçalho e menu lateral não mudam) ... */}

                <main className="w-3/4 p-6 overflow-y-auto">
                    {activeTab === 'profile' && ( <div>{/* ... */}</div> )}
                    {activeTab === 'system' && ( <form>{/* ... */}</form> )}
                    
                    {activeTab === 'integrations' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Integrações</h3>
                            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Conecte o Zap Desk a outras ferramentas para automatizar o seu trabalho.</p>
                            <SectionDivider />
                            
                            {/* --- INTERFACE DINÂMICA (CONECTADO VS. DESCONECTADO) --- */}
                            {isGoogleConnected ? (
                                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                    <div>
                                        <h4 className="font-semibold text-green-800 dark:text-green-200">Google Calendar</h4>
                                        <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300">
                                            <CheckCircle size={14} /> Conectado com sucesso.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleGoogleDisconnect}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold transition hover:bg-red-700"
                                    >
                                        Desconectar
                                    </button>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;