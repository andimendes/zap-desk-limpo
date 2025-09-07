// supabase/functions/get-team-members/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // 1. Criar um cliente Supabase para identificar o usuário que está fazendo a chamada.
    // Desta vez, usamos a chave pública (anon key) para verificar o token de autenticação do usuário.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Obter os dados do usuário logado a partir do seu token.
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    // 3. Criar um cliente com permissões de administrador para fazer a busca segura.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 4. Descobrir a qual tenant o usuário logado pertence, buscando em 'profiles'.
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    const userTenantId = profileData.tenant_id;

    // 5. Buscar todos os perfis que pertencem ao MESMO tenant_id.
    // E juntar (JOIN) com 'auth.users' para pegar o e-mail e outras informações.
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        celular,
        users:auth.users (
          email,
          last_sign_in_at,
          email_confirmed_at
        )
      `)
      .eq('tenant_id', userTenantId);
    
    if (teamError) throw teamError;

    // 6. Formatar os dados para o frontend.
    const formattedTeam = teamMembers.map(member => ({
        id: member.id,
        name: member.full_name || 'Nome não preenchido',
        email: member.users.email,
        // Você pode adicionar a coluna 'role' na tabela 'profiles' se precisar dela aqui
        role: 'Atendente', 
        status: member.users.email_confirmed_at ? 'Aceite' : 'Pendente',
        last_sign_in_at: member.users.last_sign_in_at,
    }));

    return new Response(
      JSON.stringify({ teamMembers: formattedTeam }),
      { 
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } 
      }
    );
  }
});