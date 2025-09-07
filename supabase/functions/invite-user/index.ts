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

    // --- LÓGICA DE SEGURANÇA ADICIONADA ---
    // 1. Identifica o admin que está fazendo o convite através do token de acesso
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser();
    if (!adminUser) throw new Error('Administrador não autenticado.');

    // 2. Cria o cliente com permissões de super-administrador para as próximas etapas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Descobre a qual tenant o admin pertence
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', adminUser.id)
      .single();

    if (profileError) throw profileError;
    const tenantId = adminProfile.tenant_id;
    // --- FIM DA LÓGICA DE SEGURANÇA ---


    // 4. Convida o novo usuário (lógica que você já tinha)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: role },
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
    // 5. Cria o perfil do novo usuário, ligando-o ao tenant do admin
    const newUser = inviteData.user;
    const { error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        tenant_id: tenantId,
        full_name: fullName
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