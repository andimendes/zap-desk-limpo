// src/pages/ConfirmacaoPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ConfirmacaoPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [session, setSession] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // O Supabase JS client deteta automaticamente o token de convite/recuperação
        // na URL e cria uma sessão temporária para o utilizador.
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setSession(session);
            }
        });
    }, []);

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        if (password.length < 6) {
            setMessage({ type: 'error', content: 'A senha deve ter pelo menos 6 caracteres.' });
            setLoading(false);
            return;
        }

        // Usa a sessão temporária para atualizar os dados do utilizador (definir a senha)
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage({ type: 'error', content: `Erro ao definir a senha: ${error.message}` });
        } else {
            setMessage({ type: 'success', content: 'Conta confirmada e senha definida com sucesso! A redirecionar...' });
            setTimeout(() => {
                navigate('/'); // Redireciona para a página principal
            }, 2000);
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
                    Complete o seu Cadastro
                </h2>
                
                {session ? (
                    <form className="space-y-4" onSubmit={handleSetPassword}>
                        <p className="text-sm text-center text-gray-600">
                            Bem-vindo(a), {session.user.email}! Por favor, defina uma senha para aceder à sua conta.
                        </p>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">Nova Senha</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        {message.content && (<div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.content}</div>)}
                        <button type="submit" disabled={loading} className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Aguarde...' : 'Salvar Senha e Entrar'}
                        </button>
                    </form>
                ) : (
                     <div className="text-center">
                        <p className="mt-4 text-gray-600">A verificar o seu convite...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
