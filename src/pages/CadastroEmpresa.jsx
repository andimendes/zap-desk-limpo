// src/pages/CadastroEmpresa.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

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

  // --- FUNÇÃO DE CADASTRO TOTALMENTE REFATORADA ---
  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // Passo 1: Criar o utilizador com a função padrão da Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        // Se houver um erro aqui (ex: e-mail já existe), lança o erro
        throw signUpError;
      }
      
      // Se o utilizador for criado, mas a sessão não for iniciada, algo está errado
      if (!authData.user) {
          throw new Error("Não foi possível criar o utilizador. Tente novamente.");
      }

      // Passo 2: Chamar a nova função SQL para criar o tenant e o perfil
      const { error: rpcError } = await supabase.rpc('create_tenant_and_profile', {
        user_id: authData.user.id,
        company_name: companyName,
        company_cnpj: cnpj,
        user_name: userName,
        user_celular: celular
      });

      if (rpcError) {
        // Se a segunda parte falhar, lança o erro
        throw rpcError;
      }

      // Se tudo correu bem
      setMessage({ type: 'success', content: 'Conta criada com sucesso! A redirecionar para o login...' });
      
      // Opcional: Deslogar o utilizador para forçar um login limpo
      await supabase.auth.signOut();
      
      // Redirecionar para o login após um breve momento
      setTimeout(() => {
        navigate('/login');
      }, 2000);

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