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
    const { email, fullName, role: role_id } = await req.json(); // Renomeado para role_id
    if (!email || !fullName || !role_id) {
      throw new Error('Email, nome completo (fullName) e ID do cargo (role_id) são obrigatórios.');
    }

    // --- LÓGICA DE SEGURANÇA ADICIONADA ---
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('PROJECT_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser();
    if (!adminUser) throw new Error('Administrador não autenticado.');

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('PROJECT_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', adminUser.id)
      .single();

    if (profileError) throw profileError;
    const tenantId = adminProfile.tenant_id;
    // --- FIM DA LÓGICA DE SEGURANÇA ---


    // 4. Convida o novo usuário
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, // O 'role' não precisa ir aqui
    });

    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
           status: 409,
           headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
       });
     }
      throw inviteError;
    }

    // --- PASSO CRÍTICO ADICIONADO ---
    // 5. Cria o perfil do novo usuário, ligando-o ao tenant e ao cargo
    const newUser = inviteData.user;
    const { error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        tenant_id: tenantId,
        full_name: fullName,
        role_id: role_id, // <-- ADICIONADO A ASSOCIAÇÃO DO CARGO
      });

    if (createProfileError) {
        // Se a criação do perfil falhar, apaga o usuário convidado para evitar inconsistências
        await supabaseAdmin.auth.admin.deleteUser(newUser.id);
        throw createProfileError;
    }
    // --- FIM DO PASSO CRÍTICO ---

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!', user: newUser }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});