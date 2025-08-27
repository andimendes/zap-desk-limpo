import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthPage() {
    // Estados removidos: isSignUp, fullName
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

    // Função handleSignUp removida

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
                <div className="flex justify-center">
                    <img src="https://f005.backblazeb2.com/file/Zap-Contabilidade/Completo+-+Horizontal+-+Colorido.png" alt="Logo Zap Contabilidade" className="h-16 w-auto" />
                </div>
                
                {/* Título agora é estático */}
                <h2 className="text-center text-2xl font-bold text-gray-800">
                    Acesse sua Conta
                </h2>
                
                {/* Formulário agora só faz login */}
                <form className="space-y-4" onSubmit={handleLogin}>
                    {/* Campo de nome completo removido */}
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
                        {/* Texto do botão agora é estático */}
                        {loading ? 'Aguarde...' : 'Entrar'}
                    </button>
                </form>

                {/* --- MUDANÇA: Secção de "Criar conta" removida --- */}
            </div>
        </div>
    );
}
