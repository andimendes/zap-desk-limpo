import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

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

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });
        
        // <-- MUDANÇA AQUI: Ignoramos a variável 'data' que não estava a ser usada
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (error) {
            setMessage({ type: 'error', content: error.message });
        } else {
            setMessage({ type: 'success', content: 'Conta criada! Por favor, verifique o seu e-mail para ativar a conta.' });
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
                    {isSignUp ? 'Crie a sua Conta' : 'Acesse sua Conta'}
                </h2>
                
                <form className="space-y-4" onSubmit={isSignUp ? handleSignUp : handleLogin}>
                    {isSignUp && (
                        <div>
                            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Nome Completo</label>
                            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                    )}
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
                        {loading ? 'Aguarde...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                        {isSignUp ? 'Entrar' : 'Crie uma agora'}
                    </button>
                </p>
            </div>
        </div>
    );
}
