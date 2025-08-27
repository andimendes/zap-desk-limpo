// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Função 'invite-user' (v2) iniciada.");

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email, password, fullName, role } = await req.json();
    if (!email || !password || !fullName || !role) {
      throw new Error('Email, password, fullName e role são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cria o utilizador diretamente com email e senha.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Marca o email como confirmado para login imediato
      user_metadata: {
        full_name: fullName,
        role: role
      },
    });

    if (error) { throw error; }

    return new Response(
      JSON.stringify({ message: 'Utilizador convidado com sucesso!', user: data.user }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
