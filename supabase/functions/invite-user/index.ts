// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email, fullName, role } = await req.json();
    if (!email || !fullName || !role) {
      throw new Error('Email, nome completo (fullName) e cargo (role) são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- AJUSTE IMPORTANTE AQUI ---
    // Adicionamos a opção "redirectTo" para garantir que o link no e-mail de convite
    // aponte para a sua página de confirmação, onde o usuário poderá criar a senha.
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: role },
      redirectTo: `${origin}/confirmacao`, 
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
           status: 409,
           headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
       });
     }
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!', user: data.user }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
