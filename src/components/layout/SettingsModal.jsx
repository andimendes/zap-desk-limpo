import React, { useState, useRef, useEffect } from 'react';
import { X, User, Settings, Camera, Mail, Lock, CheckCircle, AlertTriangle, Sun, Bell, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// --- Componentes de UI (Completos) ---

const InputField = ({ icon, label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <input 
        {...props} 
        className="w-full p-2 pl-10 border rounded-lg transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-600 dark:focus:ring-blue-400"
      />
    </div>
  </div>
);

const SectionDivider = () => <hr className="my-6 border-gray-200 dark:border-gray-700" />;

const TabButton = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
);

const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:peer-focus:ring-blue-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
    </label>
);

const PreferenceRow = ({ icon, title, description, children }) => (
    <div className="flex items-start justify-between py-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
            <div className="text-gray-500 dark:text-gray-400">{icon}</div>
            <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
        <div className="flex items-center">{children}</div>
    </div>
);

const UserAvatar = ({ name, src }) => (
    src ? 
      <img src={src} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm dark:border-gray-800" /> :
      <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl border-4 shadow-sm bg-blue-100 text-blue-700 border-white dark:bg-blue-900/50 dark:text-blue-300 dark:border-gray-800">
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
);

// --- Componente Principal do Modal ---
const SettingsModal = ({ isOpen, onClose, userProfile, userAuth }) => {
    const { setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [fullName, setFullName] = useState(userProfile?.full_name || '');
    const [cargo, setCargo] = useState(userProfile?.cargo || '');
    const [telefone, setTelefone] = useState(userProfile?.telefone || '');
    const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState(userAuth?.email || '');
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);
    const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
    const [preferences, setPreferences] = useState({ theme: 'system', notify_on_assignment: true, notify_on_reply: true, notify_daily_summary: false });
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [prefsMessage, setPrefsMessage] = useState({ type: '', text: '' });
    const avatarFileRef = useRef(null);

    useEffect(() => { /* ...código da função... */ });
    const handlePreferencesChange = (key, value) => { /* ...código da função... */ };
    const handlePreferencesSave = async (e) => { /* ...código da função... */ };
    const clearSecurityFields = () => { /* ...código da função... */ };
    const handleAvatarClick = () => { /* ...código da função... */ };
    const handleAvatarUpload = async (event) => { /* ...código da função... */ };
    const handleProfileSave = async (e) => { /* ...código da função... */ };
    const handleSecuritySave = async (e) => { /* ...código da função... */ };
    
    // --- NOVA FUNÇÃO PARA CONECTAR COM A GOOGLE ---
    const handleGoogleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar.events',
                redirectTo: window.location.origin, 
            },
        });
        if (error) {
            console.error('Erro ao iniciar a autenticação com a Google:', error);
            alert('Não foi possível iniciar a conexão com a Google.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Configurações</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} className="text-gray-600 dark:text-gray-400" /></button>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    <aside className="w-1/4 border-r border-gray-200 p-4 space-y-2 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/50">
                        <TabButton icon={<User size={18} />} label="Meu Perfil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <TabButton icon={<Settings size={18} />} label="Preferências" isActive={activeTab === 'system'} onClick={() => setActiveTab('system')} />
                        <TabButton icon={<LinkIcon size={18} />} label="Integrações" isActive={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
                    </aside>
                    <main className="w-3/4 p-6 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <div> {/* Conteúdo completo da aba Perfil */} </div>
                        )}
                        {activeTab === 'system' && ( 
                            <form> {/* Conteúdo completo da aba Preferências */} </form> 
                        )}
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
                                    <button onClick={handleGoogleConnect} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold transition hover:bg-blue-700">
                                        Conectar
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;