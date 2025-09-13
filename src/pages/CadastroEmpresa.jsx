import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function CadastroEmpresa() {
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite_token');

    const [companyName, setCompanyName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [userName, setUserName] = useState('');
    const [celular, setCelular] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [isInviteFlow, setIsInviteFlow] = useState(false);

    useEffect(() => {
        if (inviteToken) {
            setLoading(true);
            const fetchInvite = async () => {
                const { data, error } = await supabase
                    .from('invitations')
                    .select('tenant_data, user_email')
                    .eq('id', inviteToken)
                    .eq('status', 'pending')
                    .single();
                
                if (data) {
                    setCompanyName(data.tenant_data.company_name);
                    setEmail(data.user_email);
                    setIsInviteFlow(true);
                } else {
                    setMessage({ type: 'error', content: 'Link de convite inválido ou já utilizado.' });
                }
                setLoading(false);
            };
            fetchInvite();
        }
    }, [inviteToken]);

    const handleSignUp = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });
        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error("Não foi possível criar o utilizador.");

            if (isInviteFlow && inviteToken) {
                // FLUXO DE CONVITE: Reivindica o convite
                const { error: claimError } = await supabase.rpc('claim_invitation', {
                    p_invite_token: inviteToken,
                    p_user_id: authData.user.id,
                    p_user_full_name: userName
                });
                if (claimError) throw claimError;
            } else {
                // FLUXO PÚBLICO: (Se ainda quiser permitir registo público)
                const { error: rpcError } = await supabase.rpc('create_tenant_and_profile', {
                    p_user_id: authData.user.id,
                    p_company_name: companyName,
                    p_company_cnpj: cnpj,
                    p_user_name: userName,
                    p_user_celular: celular
                });
                if (rpcError) throw rpcError;
            }

            setMessage({ type: 'success', content: 'Conta criada com sucesso! Por favor, verifique o seu e-mail para confirmar antes de fazer o login.' });
            
        } catch (error) {
            console.error('Erro no cadastro:', error.message);
            setMessage({ type: 'error', content: `Erro ao cadastrar: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
                <div className="flex justify-center">
                    <img src="https://f005.backblazeb2.com/file/Zap-Contabilidade/Completo+-+Horizontal+-+Colorido.png" alt="Logo Zap Contabilidade" className="h-16 w-auto" />
                </div>
                <h2 className="text-center text-2xl font-bold text-gray-800">
                    {isInviteFlow ? 'Finalize o seu Cadastro' : 'Cadastre sua Empresa'}
                </h2>
                <form className="space-y-4" onSubmit={handleSignUp}>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required disabled={isInviteFlow} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    {/* Oculta o campo CNPJ no fluxo de convite para simplificar */}
                    {!isInviteFlow && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">CNPJ</label>
                            <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm" />
                        </div>
                    )}
                    <hr/>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Seu Nome Completo</label>
                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm" />
                    </div>
                    {!isInviteFlow && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Seu Celular</label>
                            <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm" />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Seu E-mail</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isInviteFlow} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Defina sua Senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm" />
                    </div>
                    {message.content && (<div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.content}</div>)}
                    <button type="submit" disabled={loading} className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Aguarde...' : 'Criar Conta'}
                    </button>
                </form>
                {!isInviteFlow && (
                    <div className="text-center text-sm">
                        <p>Já tem uma conta? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Faça o login</Link></p>
                    </div>
                )}
            </div>
        </div>
    );
}
