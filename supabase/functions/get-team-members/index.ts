// =====================================================================================
// CÓDIGO DA EDGE FUNCTION: get-team-members
// =====================================================================================
// OBJETIVO:
// Esta função busca de forma segura todos os membros da equipe que pertencem
// à mesma empresa (tenant) do usuário que está fazendo a requisição.
//
// COMO USAR:
// 1. Siga o guia para criar uma nova Edge Function no seu painel Supabase.
// 2. Dê o nome de "get-team-members" a ela.
// 3. Copie e cole TODO este código no editor da função.
// 4. Dê "Deploy" na função.
// =====================================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Trata a requisição OPTIONS para CORS (necessário para o navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Cria um cliente Supabase com permissões de administrador para poder ler
    // os dados necessários de forma segura.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Cria um cliente Supabase para verificar a sessão do usuário que fez a chamada.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Pega os dados do usuário que está logado e fazendo a requisição.
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 2. Busca o perfil do usuário logado para descobrir a qual empresa (tenant) ele pertence.
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (adminProfileError || !adminProfile) {
      throw new Error('Não foi possível encontrar o perfil do administrador.');
    }
    
    const tenantId = adminProfile.tenant_id;
    if (!tenantId) {
      throw new Error('Administrador não está associado a nenhuma empresa.');
    }

    // 3. Busca todos os perfis que pertencem à mesma empresa (tenant).
    const { data: teamProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('tenant_id', tenantId);

    if (profilesError) throw profilesError;
    if (!teamProfiles || teamProfiles.length === 0) {
      return new Response(JSON.stringify({ teamMembers: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    const userIds = teamProfiles.map(p => p.id);

    // 4. Busca os dados de autenticação (email, status) para cada membro da equipe.
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Limite alto para buscar todos
    });
    if (authError) throw authError;

    // 5. Busca as permissões (roles) de cada membro da equipe.
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, roles(name)')
      .in('user_id', userIds);
    if (rolesError) throw rolesError;
    
    // 6. Monta o resultado final, combinando todas as informações.
    const teamMembers = teamProfiles.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      const roleInfo = userRoles.find(r => r.user_id === profile.id);
      
      return {
        id: profile.id,
        name: profile.full_name,
        email: authUser?.email || 'Email não encontrado',
        role: roleInfo?.roles?.name || 'Sem cargo',
        // O status é 'Aceite' se o usuário já fez login alguma vez.
        status: authUser?.last_sign_in_at ? 'Aceite' : 'Pendente'
      };
    });
    
    return new Response(JSON.stringify({ teamMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
