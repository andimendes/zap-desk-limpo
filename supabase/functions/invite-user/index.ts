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

    // --- MUDANÇA DE LÓGICA ---
    // Passo 1: Cria o utilizador sem senha (ele fica "à espera" de uma senha)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // Já marca o email como confirmado
      user_metadata: {
        full_name: fullName,
        role: role
      },
    });

    if (createError) {
      if (createError.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
           status: 409,
           headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
       });
     }
      throw createError;
    }

    // Passo 2: Envia um email de "recuperação de senha" que, na prática,
    // servirá para o utilizador definir a sua PRIMEIRA senha.
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`
    });

    if (resetError) {
        // Se falhar aqui, é uma boa prática apagar o utilizador que acabámos de criar
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        throw new Error(`Utilizador criado, mas falha ao enviar o email de definição de senha: ${resetError.message}`);
    }

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso! O utilizador receberá um email para definir a sua senha.' }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
