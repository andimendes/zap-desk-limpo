// supabase/functions/get-team-members/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Importa a nossa função partilhada de CORS do ficheiro que criámos
import { corsHeaders } from '../_shared/cors.ts';

console.log("Função 'get-team-members' iniciada.");

serve(async (req) => {
  // Obtém a origem do pedido para a verificação de CORS
  const origin = req.headers.get('origin') || '';

  // --- CORREÇÃO CRÍTICA PARA CORS ---
  // O navegador envia um pedido 'OPTIONS' antes do pedido real (GET, POST, etc.)
  // para verificar se tem permissão. Temos de responder a este pedido primeiro.
  if (req.method === 'OPTIONS') {
    console.log('Recebido pedido OPTIONS. A responder com permissão.');
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    console.log('A processar pedido principal...');
    // Cria um cliente especial do Supabase com permissões de administrador
    // para poder listar todos os utilizadores.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pede ao Supabase a lista de todos os utilizadores do seu projeto
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Erro ao listar utilizadores:', error);
      throw error; // Lança o erro para ser apanhado pelo bloco catch
    }

    // Formata os dados para ficarem mais fáceis de usar na sua aplicação front-end
    const teamMembers = users.map(user => ({
      id: user.id,
      name: user.user_metadata?.full_name || 'Nome não preenchido',
      email: user.email,
      role: user.user_metadata?.role || 'Atendente', 
      status: user.email_confirmed_at ? 'Aceite' : 'Pendente',
      last_sign_in_at: user.last_sign_in_at,
    }));

    console.log('Equipa encontrada com sucesso. A enviar dados.');
    // Envia a lista de membros da equipa como resposta,
    // incluindo os cabeçalhos de CORS para que o navegador aceite a resposta.
    return new Response(
      JSON.stringify({ teamMembers }),
      { 
        headers: { 
          ...corsHeaders(origin), // Nossos cabeçalhos de CORS
          'Content-Type': 'application/json' 
        },
        status: 200 // Código de sucesso
      }
    );
  } catch (error) {
    console.error('Ocorreu um erro na função:', error.message);
    // Se algo deu errado, envia uma mensagem de erro clara
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, // Código de erro do servidor
        headers: { 
          ...corsHeaders(origin), // Nossos cabeçalhos de CORS
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
