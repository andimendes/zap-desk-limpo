import React, { useState, useRef, useEffect } from 'react';
import { X, User, Settings, Camera, Mail, Lock, CheckCircle, AlertTriangle, Sun, Bell, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// --- (Componentes de UI não mudam) ---
const InputField = ({ icon, label, ...props }) => ( /* ... */ );
const SectionDivider = () => <hr className="my-6 border-gray-200 dark:border-gray-700" />;
const TabButton = ({ icon, label, isActive, onClick }) => ( /* ... */ );
const ToggleSwitch = ({ checked, onChange }) => ( /* ... */ );
const PreferenceRow = ({ icon, title, description, children }) => ( /* ... */ );
const UserAvatar = ({ name, src }) => ( /* ... */ );

const SettingsModal = ({ isOpen, onClose, userProfile, userAuth }) => {
    const { setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    
    // Usamos optional chaining para inicializar os estados de forma segura
    const [fullName, setFullName] = useState(userProfile?.full_name || '');
    const [cargo, setCargo] = useState(userProfile?.cargo || '');
    const [telefone, setTelefone] = useState(userProfile?.telefone || '');
    const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
    const [email, setEmail] = useState(userAuth?.email || '');

    // ... (outros estados não mudam)
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);
    const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
    const [preferences, setPreferences] = useState({ theme: 'system', notify_on_assignment: true, notify_on_reply: true, notify_daily_summary: false });
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [prefsMessage, setPrefsMessage] = useState({ type: '', text: '' });
    const avatarFileRef = useRef(null);

    // --- useEffect ATUALIZADO COM "GUARDAS" ---
    useEffect(() => {
        // Se o modal não estiver aberto ou não houver ID de utilizador, não faz nada.
        if (!isOpen || !userAuth?.id) return;

        const fetchPreferences = async () => {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userAuth.id) // Agora só executa se userAuth.id existir
                .single();
            
            if (data) {
                setPreferences(data);
                setTheme(data.theme);
            } else if (error && error.code !== 'PGRST116') {
                console.error("Erro ao carregar preferências:", error);
            }
        };
        fetchPreferences();
    }, [isOpen, userAuth?.id, setTheme]); // Usamos userAuth?.id na dependência

    // ... (todas as outras funções permanecem iguais)
    const handleGoogleConnect = async () => { /* ... */ };
    const handlePreferencesChange = (key, value) => { /* ... */ };
    const handlePreferencesSave = async (e) => { /* ... */ };
    const clearSecurityFields = () => { /* ... */ };
    const handleAvatarClick = () => { /* ... */ };
    const handleAvatarUpload = async (event) => { /* ... */ };
    const handleProfileSave = async (e) => { /* ... */ };
    const handleSecuritySave = async (e) => { /* ... */ };

    if (!isOpen) return null;

    return (
        // O JSX (parte visual) permanece exatamente o mesmo
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            {/* ... */}
        </div>
    );
};

export default SettingsModal;