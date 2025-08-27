// supabase/functions/delete-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';

  // Lida com a verificação de segurança (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // Extrai o ID do utilizador a ser apagado do corpo do pedido
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('O ID do utilizador (userId) é obrigatório.');
    }

    // Cria um cliente Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Apaga o utilizador usando o seu ID
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Erro ao apagar o utilizador:', error);
      throw error;
    }

    // Envia uma resposta de sucesso
    return new Response(
      JSON.stringify({ message: 'Utilizador apagado com sucesso!', data }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Se algo deu errado, envia uma mensagem de erro
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
