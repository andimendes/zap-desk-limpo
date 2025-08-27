// supabase/functions/reset-password/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Verifique se este caminho está correto no seu projeto

/**
 * Documentação da Função: `reset-password`
 * * Objetivo:
 * Esta Edge Function é responsável por iniciar o fluxo de redefinição de senha.
 * Ela é projetada para ser chamada por uma aplicação cliente (front-end) de forma pública.
 * * Fluxo de Execução:
 * 1. Responde a requisições 'OPTIONS' para pré-verificação de CORS.
 * 2. Extrai o 'email' do corpo da requisição JSON.
 * 3. Valida se o campo 'email' foi fornecido, retornando um erro 400 em caso negativo.
 * 4. Cria um cliente Supabase utilizando as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
 * 5. Invoca o método `auth.resetPasswordForEmail` do Supabase para que o e-mail de recuperação seja enviado.
 * 6. A URL de redirecionamento (`redirectTo`) é construída dinamicamente a partir do 'origin' da requisição,
 * apontando para uma rota `/update-password` no mesmo domínio. **Lembre-se de criar essa página no seu front-end!**
 * 7. Retorna uma mensagem de sucesso genérica para o cliente para evitar a enumeração de usuários.
 * 8. Em caso de qualquer erro, captura a exceção e retorna uma resposta com status 400 e a mensagem de erro.
 */
serve(async (req) => {
  // O 'origin' é o domínio de onde a requisição veio (ex: http://localhost:3000 ou https://meusite.com)
  // É fundamental para o CORS e para a construção da URL de redirecionamento.
  const origin = req.headers.get('origin') || '';

  // Etapa 1: Tratamento da requisição preflight 'OPTIONS' para CORS.
  // O navegador envia essa requisição antes da requisição POST real para verificar se o servidor permite a comunicação.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // Etapa 2: Extração e validação do e-mail.
    // O corpo da requisição deve ser um JSON como: { "email": "usuario@exemplo.com" }
    const { email } = await req.json();
    if (!email) { 
      throw new Error('O e-mail é um campo obrigatório.'); 
    }

    // Etapa 3: Criação do cliente Supabase.
    // Usamos a chave pública (ANON_KEY) porque esta é uma operação que qualquer usuário pode
    // iniciar, não sendo necessária uma permissão de administrador.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Etapa 4: Invocação da função de redefinição de senha.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Constrói a URL para a qual o usuário será redirecionado após clicar no link do e-mail.
        // Exemplo: se a requisição veio de 'https://app.zapcontabilidade.com', a URL será 'https://app.zapcontabilidade.com/update-password'
        redirectTo: `${origin}/update-password` 
    });

    // Se o Supabase retornar um erro (ex: problema de configuração), ele será lançado.
    if (error) { 
      console.error('Erro retornado pelo Supabase:', error.message);
      throw error; 
    }

    // Etapa 5: Resposta de sucesso.
    // Enviamos uma mensagem genérica por segurança, para não confirmar se um e-mail existe ou não no banco de dados.
    return new Response(
      JSON.stringify({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' }),
      { 
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    // Etapa 6: Tratamento centralizado de erros.
    // Qualquer erro lançado no bloco 'try' será capturado aqui.
    console.error("Erro na execução da função reset-password:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, // Usamos 400 para indicar uma "requisição inválida" do ponto de vista do servidor.
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } 
      }
    );
  }
});