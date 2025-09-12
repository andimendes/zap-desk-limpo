// src/pages/CadastroEmpresa.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function CadastroEmpresa() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [userName, setUserName] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        throw signUpError;
      }
      
      if (!authData.user) {
          throw new Error("Não foi possível criar o utilizador. Tente novamente.");
      }

      const { error: rpcError } = await supabase.rpc('create_tenant_and_profile', {
        p_user_id: authData.user.id,
        p_company_name: companyName,
        p_company_cnpj: cnpj,
        p_user_name: userName,
        p_user_celular: celular
      });

      if (rpcError) {
        throw rpcError;
      }

      // --- ALTERAÇÃO PRINCIPAL AQUI ---
      // Agora, em vez de redirecionar, mostramos uma mensagem clara para o utilizador.
      setMessage({ 
        type: 'success', 
        content: 'Conta criada com sucesso! Por favor, verifique a sua caixa de entrada para confirmar o seu e-mail antes de fazer o login.' 
      });

      // Limpa os campos do formulário após o sucesso
      setCompanyName('');
      setCnpj('');
      setUserName('');
      setCelular('');
      setEmail('');
      setPassword('');
      
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
            Cadastre sua Empresa
        </h2>
        
        <form className="space-y-4" onSubmit={handleSignUp}>
          <div>
            <label htmlFor="companyName" className="text-sm font-medium text-gray-700">Nome da Empresa</label>
            <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="cnpj" className="text-sm font-medium text-gray-700">CNPJ</label>
            <input id="cnpj" type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <hr/>
          <div>
            <label htmlFor="userName" className="text-sm font-medium text-gray-700">Seu Nome Completo</label>
            <input id="userName" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
           <div>
            <label htmlFor="celular" className="text-sm font-medium text-gray-700">Seu Celular</label>
            <input id="celular" type="text" value={celular} onChange={(e) => setCelular(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Seu E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Sua Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>

          {message.content && (<div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.content}</div>)}
          
          <button type="submit" disabled={loading} className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {loading ? 'Aguarde...' : 'Criar Conta'}
          </button>
        </form>

        <div className="text-center text-sm">
            <p>
                Já tem uma conta?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Faça o login
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default CadastroEmpresa;