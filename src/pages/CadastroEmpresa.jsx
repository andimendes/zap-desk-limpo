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

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const { error: rpcError } = await supabase.rpc('signup_new_tenant', {
        company_name: companyName,
        company_cnpj: cnpj,
        user_name: userName,
        user_email: email,
        user_password: password,
        user_celular: celular
      });

      if (rpcError) {
        throw rpcError;
      }

      setMessage({ type: 'success', content: 'Empresa cadastrada com sucesso! Verifique seu e-mail para confirmação e depois faça o login.' });

    } catch (error) {
      console.error('Erro no cadastro:', error.message);
      setMessage({ type: 'error', content: `Erro ao cadastrar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // --- FERRAMENTA DE DIAGNÓSTICO ADICIONADA AQUI ---
  const handleSimpleSignUpTest = async () => {
    try {
      console.log("Iniciando teste de cadastro simples...");
      // IMPORTANTE: Mude o e-mail abaixo para um que NUNCA foi usado antes no seu sistema.
      let { data, error } = await supabase.auth.signUp({
        email: 'teste-definitivo-12345@exemplo.com', // <-- MUDE ESTE E-MAIL
        password: 'password-de-teste-123'
      });

      if (error) {
        console.error('ERRO NO TESTE DE CADASTRO SIMPLES:', error);
        alert('O teste de cadastro simples FALHOU. O problema está na configuração do Supabase. Verifique a consola para o erro.');
      } else {
        console.log('SUCESSO NO TESTE DE CADASTRO SIMPLES:', data);
        alert('O teste de cadastro simples FUNCIONOU! O problema está na nossa função SQL "signup_new_tenant".');
      }
    } catch (e) {
        console.error('ERRO INESPERADO:', e);
    }
  };
  // --- FIM DA FERRAMENTA DE DIAGNÓSTICO ---


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
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        {/* --- BOTÃO DE DIAGNÓSTICO ADICIONADO AQUI --- */}
        <div className="mt-4 border-t pt-4">
            <button 
                type="button" 
                onClick={handleSimpleSignUpTest} 
                className="w-full justify-center py-2 px-4 border rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600"
            >
                Teste de Cadastro Simples (Diagnóstico)
            </button>
        </div>
        {/* --- FIM DO BOTÃO DE DIAGNÓSTICO --- */}

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