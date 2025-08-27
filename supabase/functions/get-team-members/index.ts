// supabase/functions/get-team-members/index.ts

// Importa ferramentas necessárias para a nossa função
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// A importação continua a mesma, mas agora usaremos como uma função
import { corsHeaders } from '../_shared/cors.ts'; 

// A função principal que será executada quando for chamada
serve(async (req) => {
  // Obtém a origem do pedido para passar para a nossa função de CORS
  const origin = req.headers.get('origin') || '';

  // Este bloco 'if' é uma verificação de segurança padrão para a web (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) }); // ATUALIZADO
  }

  try {
    // Cria um cliente especial do Supabase que tem permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pede ao Supabase a lista de todos os utilizadores registados no teu projeto
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
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

    // Se tudo correu bem, envia a lista de membros da equipa como resposta
    return new Response(
      JSON.stringify({ teamMembers }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } } // ATUALIZADO
    );
  } catch (error) {
    // Se algo deu errado no processo, envia uma mensagem de erro
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } } // ATUALIZADO
    );
  }
});
