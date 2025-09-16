// =====================================================================================
// CÓDIGO DA EDGE FUNCTION: get-team-members
// =====================================================================================
// OBJETIVO:
// Esta função busca de forma segura todos os membros da equipe que pertencem
// à mesma empresa (tenant) do usuário que está fazendo a requisição,
// incluindo os que ainda têm convites pendentes.
// =====================================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição OPTIONS para CORS (necessário para o navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria um cliente Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cria um cliente Supabase para verificar a sessão do usuário que fez a chamada
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') },
        },
      }
    );

    // 1. Pega os dados do usuário logado
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) throw new Error('Utilizador não autenticado.');

    // 2. Descobre a qual empresa (tenant) o usuário logado pertence
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil do utilizador não encontrado.');
    const tenantId = profile.tenant_id;

    // 3. Busca todos os perfis que já pertencem ao tenant
    const { data: teamProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, roles(name)')
      .eq('tenant_id', tenantId);

    if (profilesError) throw profilesError;

    // 4. Busca todos os utilizadores (da autenticação)
    const { data: { users: allAuthUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 5. Mapeia os perfis existentes para o formato final
    const teamMembers = teamProfiles.map((p) => {
      const authUser = allAuthUsers.find((u) => u.id === p.id);
      return {
        id: p.id,
        name: p.full_name,
        email: authUser?.email || 'N/A',
        role: p.roles?.name || 'Sem cargo',
        status: authUser?.last_sign_in_at ? 'Aceite' : 'Pendente',
      };
    });
    
    // ✅ LÓGICA CORRIGIDA: Encontra utilizadores convidados para este tenant
    const memberIds = new Set(teamMembers.map(m => m.id));
    // Filtra utilizadores que não têm perfil E que pertencem ao tenant correto
    const invitedUsersWithoutProfile = allAuthUsers.filter(u => 
        !memberIds.has(u.id) && u.user_metadata?.tenant_id === tenantId
    );

    for (const invitedUser of invitedUsersWithoutProfile) {
        teamMembers.push({
            id: invitedUser.id,
            name: invitedUser.user_metadata?.full_name || 'Nome pendente',
            email: invitedUser.email,
            role: 'Convidado', // Temporário até o perfil ser criado
            status: 'Pendente'
        });
    }

    return new Response(JSON.stringify({ teamMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})