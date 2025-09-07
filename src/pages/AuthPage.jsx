import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <-- 1. ADICIONEI A IMPORTAÇÃO AQUI
import { supabase } from '../supabaseClient';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMessage({ type: 'error', content: 'Email ou senha inválidos.' });
        }
        setLoading(false);
    };
    
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });
        
        const { data, error } = await supabase.functions.invoke('reset-password', {
            body: { email }
        });

        if (error) {
            setMessage({ type: 'error', content: error.message });
        } else {
            setMessage({ type: 'success', content: data.message });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
                <div className="flex justify-center">
                    <img src="https://f005.backblazeb2.com/file/Zap-Contabilidade/Completo+-+Horizontal+-+Colorido.png" alt="Logo Zap Contabilidade" className="h-16 w-auto" />
                </div>
                
                <h2 className="text-center text-2xl font-bold text-gray-800">
                    {isForgotPassword ? 'Recuperar Senha' : 'Acesse sua Conta'}
                </h2>
                
                {isForgotPassword ? (
                    <form className="space-y-4" onSubmit={handlePasswordReset}>
                        <p className="text-sm text-gray-600 text-center">
                            Insira o seu email e enviaremos um link para redefinir a sua senha.
                        </p>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        {message.content && (<div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.content}</div>)}
                        <button type="submit" disabled={loading} className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Aguarde...' : 'Enviar Link'}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        {message.content && (<div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.content}</div>)}
                        <button type="submit" disabled={loading} className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Aguarde...' : 'Entrar'}
                        </button>
                    </form>
                )}

                <div className="text-center text-sm space-y-2">
                    <button 
                        onClick={() => {
                            setIsForgotPassword(!isForgotPassword);
                            setMessage({ type: '', content: '' });
                            setEmail('');
                        }} 
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        {isForgotPassword ? 'Voltar para o Login' : 'Esqueceu a senha?'}
                    </button>

                    {/* --- 2. ADICIONEI O LINK DE CADASTRO AQUI --- */}
                    {!isForgotPassword && (
                        <p>
                            Não tem uma conta?{' '}
                            <Link to="/cadastro" className="font-medium text-blue-600 hover:text-blue-500">
                                Cadastre sua empresa
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}