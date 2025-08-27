import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Verifique se o caminho para seu cliente supabase está correto
import { useNavigate } from 'react-router-dom';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const navigate = useNavigate();

    // Esta função é chamada quando o usuário submete o formulário com a nova senha.
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        // A mágica acontece aqui! O Supabase detecta a sessão do usuário a partir do token na URL
        // e aplica a nova senha a esse usuário.
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage({ type: 'error', content: 'Não foi possível atualizar a senha. O link pode ter expirado.' });
        } else {
            setMessage({ type: 'success', content: 'Senha atualizada com sucesso! Você será redirecionado para o login.' });
            // Aguarda um momento para o usuário ler a mensagem e o redireciona para a página de login.
            setTimeout(() => {
                navigate('/'); // ou para '/login', dependendo da sua rota de login
            }, 3000);
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
                    Crie sua Nova Senha
                </h2>
                
                <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">Nova Senha</label>
                        <input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                            className="mt-1 block w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    
                    {/* Exibe mensagens de sucesso ou erro */}
                    {message.content && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message.content}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {loading ? 'Aguarde...' : 'Salvar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
