// supabase/functions/get-team-members/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Função 'get-team-members' iniciada.");

serve(async (req) => {
  const origin = req.headers.get('origin') || '';

  // --- CORREÇÃO IMPORTANTE ---
  // Lida com a verificação de segurança (preflight) ANTES de qualquer outra coisa.
  // Se o método for OPTIONS, simplesmente retorna 'ok' com os cabeçalhos de permissão.
  if (req.method === 'OPTIONS') {
    console.log('Recebido pedido OPTIONS. A responder com permissão.');
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    console.log('A processar pedido principal...');
    // Cria um cliente especial do Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pede ao Supabase a lista de todos os utilizadores
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Erro ao listar utilizadores:', error);
      throw error;
    }

    // Formata os dados para ficarem mais fáceis de usar na aplicação
    const teamMembers = users.map(user => ({
      id: user.id,
      name: user.user_metadata?.full_name || 'Nome não preenchido',
      email: user.email,
      role: user.user_metadata?.role || 'Atendente', 
      status: user.email_confirmed_at ? 'Aceite' : 'Pendente',
      last_sign_in_at: user.last_sign_in_at,
    }));

    console.log('Equipa encontrada com sucesso. A enviar dados.');
    // Envia a lista de membros da equipa como resposta
    return new Response(
      JSON.stringify({ teamMembers }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ocorreu um erro na função:', error.message);
    // Se algo deu errado, envia uma mensagem de erro
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
