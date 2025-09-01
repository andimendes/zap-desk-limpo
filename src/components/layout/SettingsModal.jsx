import React, { useState, useRef, useEffect } from 'react';
import { X, User, Settings, Camera, Mail, Lock, CheckCircle, AlertTriangle, Sun, Bell, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

const InputField = ({ icon, label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">{icon}</div>
      <input {...props} className="w-full p-2 pl-10 border rounded-lg transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-600 dark:focus:ring-blue-400" />
    </div>
  </div>
);

const SectionDivider = () => <hr className="my-6 border-gray-200 dark:border-gray-700" />;

const TabButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}>
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
    <div className="flex items-center gap-3"><div className="text-gray-500 dark:text-gray-400">{icon}</div><div><h5 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h5><p className="text-sm text-gray-500 dark:text-gray-400">{description}</p></div></div>
    <div className="flex items-center">{children}</div>
  </div>
);

const UserAvatar = ({ name, src }) => ( src ? <img src={src} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm dark:border-gray-800" /> : <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl border-4 shadow-sm bg-blue-100 text-blue-700 border-white dark:bg-blue-900/50 dark:text-blue-300 dark:border-gray-800">{name ? name.charAt(0).toUpperCase() : '?'}</div>);

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

    useEffect(() => {
        if (!isOpen || !userAuth?.id) return;
        const fetchPreferences = async () => {
            const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userAuth.id).single();
            if (data) { setPreferences(data); setTheme(data.theme); } 
            else if (error && error.code !== 'PGRST116') { console.error("Erro ao carregar preferências:", error); }
        };
        fetchPreferences();
    }, [isOpen, userAuth?.id, setTheme]);
    
    const handleGoogleConnect = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/calendar.events', redirectTo: window.location.origin } }); if (error) { console.error('Erro ao iniciar a autenticação com a Google:', error); alert('Não foi possível iniciar a conexão com a Google.'); } };
    const handlePreferencesChange = (key, value) => { setPreferences(prev => ({ ...prev, [key]: value })); if (key === 'theme') { setTheme(value); } };
    const handlePreferencesSave = async (e) => { e.preventDefault(); setIsSavingPrefs(true); setPrefsMessage({ type: '', text: '' }); try { const updates = { ...preferences, user_id: userAuth.id, updated_at: new Date() }; const { error } = await supabase.from('user_preferences').upsert(updates); if (error) throw error; setPrefsMessage({ type: 'success', text: 'Preferências salvas com sucesso!' }); } catch (error) { setPrefsMessage({ type: 'error', text: 'Erro ao salvar preferências.' }); } finally { setIsSavingPrefs(false); setTimeout(() => setPrefsMessage({ type: '', text: '' }), 5000); } };
    const clearSecurityFields = () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); };
    const handleAvatarClick = () => { avatarFileRef.current.click(); };
    const handleAvatarUpload = async (event) => { try { const file = event.target.files[0]; if (!file) return; const fileName = `${userAuth.id}-${Date.now()}`; const filePath = `${fileName}`; const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file); if (uploadError) throw uploadError; const { data } = supabase.storage.from('avatars').getPublicUrl(filePath); setAvatarUrl(data.publicUrl); setProfileMessage({ type: 'success', text: 'Avatar pronto para ser salvo. Clique em "Salvar Informações".' }); } catch (error) { setProfileMessage({ type: 'error', text: 'Falha no upload do avatar: ' + error.message }); } };
    const handleProfileSave = async (e) => { e.preventDefault(); setIsSavingProfile(true); setProfileMessage({ type: '', text: '' }); try { const updates = { id: userAuth.id, full_name: fullName, cargo, telefone, avatar_url: avatarUrl, updated_at: new Date() }; const { error } = await supabase.from('profiles').upsert(updates); if (error) throw error; setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' }); } catch (error) { setProfileMessage({ type: 'error', text: 'Erro ao atualizar o perfil: ' + error.message }); } finally { setIsSavingProfile(false); setTimeout(() => setProfileMessage({ type: '', text: '' }), 5000); } };
    const handleSecuritySave = async (e) => { e.preventDefault(); setIsSavingSecurity(true); setSecurityMessage({ type: '', text: '' }); const { error: reauthError } = await supabase.auth.signInWithPassword({ email: userAuth.email, password: currentPassword }); if (reauthError) { setSecurityMessage({ type: 'error', text: 'Senha atual incorreta.' }); setIsSavingSecurity(false); return; } try { let updates = {}; let successMessage = ''; if (email && email.toLowerCase() !== userAuth.email) { updates.email = email.toLowerCase(); successMessage += 'E-mail atualizado! Verifique sua nova caixa de entrada para confirmar. '; } if (newPassword) { if (newPassword.length < 8) { throw new Error('A nova senha deve ter no mínimo 8 caracteres.'); } if (newPassword !== confirmPassword) { throw new Error('As novas senhas não coincidem.'); } updates.password = newPassword; successMessage += 'Senha atualizada com sucesso!'; } if (Object.keys(updates).length === 0) { setSecurityMessage({ type: 'info', text: 'Nenhuma alteração foi preenchida.' }); setIsSavingSecurity(false); return; } const { error } = await supabase.auth.updateUser(updates); if (error) throw error; setSecurityMessage({ type: 'success', text: successMessage.trim() }); clearSecurityFields(); } catch (error) { setSecurityMessage({ type: 'error', text: 'Erro: ' + error.message }); } finally { setIsSavingSecurity(false); setTimeout(() => setSecurityMessage({ type: '', text: '' }), 7000); } };

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
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Meu Perfil</h3>
                            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Atualize suas informações pessoais e de segurança.</p>
                            <form onSubmit={handleProfileSave}>
                                <h4 className="font-semibold text-gray-700 mb-4 dark:text-gray-300">Informações Pessoais</h4>
                                <div className="flex items-center gap-6 mb-6">
                                    <UserAvatar name={fullName} src={avatarUrl} />
                                    <input type="file" ref={avatarFileRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg" />
                                    <button type="button" onClick={handleAvatarClick} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Camera size={16} /> Alterar Foto</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField icon={<User size={16} />} label="Nome Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" /><InputField icon={<User size={16} />} label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Seu cargo na empresa" /></div>
                                <div className="mt-4"><InputField icon={<User size={16} />} label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" /></div>
                                <div className="flex justify-between items-center mt-4"><div>{profileMessage.text && (<div className={`flex items-center gap-2 text-sm ${profileMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}{profileMessage.text}</div>)}</div><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:cursor-not-allowed" disabled={isSavingProfile}>{isSavingProfile ? 'A Salvar...' : 'Salvar Informações'}</button></div>
                            </form>
                            <SectionDivider />
                            <form onSubmit={handleSecuritySave}>
                                <h4 className="font-semibold text-gray-700 mb-4 dark:text-gray-300">Segurança</h4>
                                <p className="text-xs text-gray-500 mb-4 dark:text-gray-400">Para alterar seu e-mail ou senha, por segurança, você precisa digitar sua senha atual.</p>
                                <div className="space-y-4">
                                    <InputField icon={<Lock size={16} />} label="Senha Atual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required/>
                                    <InputField icon={<Mail size={16} />} label="Alterar E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="novo@email.com" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField icon={<Lock size={16} />} label="Nova Senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                                        <InputField icon={<Lock size={16} />} label="Confirmar Nova Senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div>{securityMessage.text && (<div className={`flex items-center gap-2 text-sm ${securityMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : securityMessage.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{securityMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}{securityMessage.text}</div>)}</div>
                                    <button type="submit" className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold transition hover:bg-gray-800 disabled:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:cursor-not-allowed" disabled={isSavingSecurity}>{isSavingSecurity ? 'A Atualizar...' : 'Atualizar Segurança'}</button>
                                </div>
                            </form>
                        </div>
                        )}
                        {activeTab === 'system' && ( 
                            <form onSubmit={handlePreferencesSave}>
                                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Preferências</h3>
                                <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Personalize a sua experiência no sistema.</p>
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2 dark:text-gray-300">Aparência</h4>
                                    <PreferenceRow icon={<Sun size={20}/>} title="Tema da Interface" description="Escolha como o sistema deve parecer para si."><select value={preferences.theme} onChange={(e) => handlePreferencesChange('theme', e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Padrão do Sistema</option></select></PreferenceRow>
                                    <h4 className="font-semibold text-gray-700 mt-8 mb-2 dark:text-gray-300">Notificações por E-mail</h4>
                                    <PreferenceRow icon={<Bell size={20}/>} title="Chamado atribuído a si" description="Receber um e-mail quando um novo chamado for seu."><ToggleSwitch checked={preferences.notify_on_assignment} onChange={(e) => handlePreferencesChange('notify_on_assignment', e.target.checked)} /></PreferenceRow>
                                    <PreferenceRow icon={<Bell size={20}/>} title="Cliente respondeu" description="Receber um e-mail quando um cliente interagir num chamado seu."><ToggleSwitch checked={preferences.notify_on_reply} onChange={(e) => handlePreferencesChange('notify_on_reply', e.target.checked)} /></PreferenceRow>
                                    <PreferenceRow icon={<Bell size={20}/>} title="Resumo diário" description="Receber um e-mail por dia com as suas pendências."><ToggleSwitch checked={preferences.notify_daily_summary} onChange={(e) => handlePreferencesChange('notify_daily_summary', e.target.checked)} /></PreferenceRow>
                                </div>
                                <div className="flex justify-between items-center mt-8">
                                    <div>{prefsMessage.text && (<div className={`flex items-center gap-2 text-sm ${prefsMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{prefsMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}{prefsMessage.text}</div>)}</div>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600" disabled={isSavingPrefs}>{isSavingPrefs ? 'A Salvar...' : 'Salvar Preferências'}</button>
                                </div>
                            </form> 
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