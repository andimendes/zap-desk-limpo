// =====================================================================================
// CÓDIGO DA EDGE FUNCTION: get-team-members
// =====================================================================================
// OBJETIVO:
// Esta função busca de forma segura todos os membros da equipe que pertencem
// à mesma empresa (tenant) do usuário que está fazendo a requisição.
// =====================================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição OPTIONS para CORS (necessário para o navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria um cliente Supabase com permissões de administrador para poder ler
    // os dados necessários de forma segura.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cria um cliente Supabase para verificar a sessão do usuário que fez a chamada.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          // ✅ CORREÇÃO: Removido o '!' extra que causava o erro de sintaxe.
          headers: { Authorization: req.headers.get('Authorization') },
        },
      }
    );

    // 1. Pega os dados do usuário que está logado e fazendo a requisição.
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) throw new Error('Utilizador não autenticado.');

    // 2. Busca o perfil do usuário logado para descobrir a qual empresa (tenant) ele pertence.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil do utilizador não encontrado.');
    const tenantId = profile.tenant_id;

    // 3. Busca todos os perfis do tenant, incluindo o nome do cargo associado.
    const { data: teamProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, roles(name)')
      .eq('tenant_id', tenantId);

    if (profilesError) throw profilesError;

    // 4. Busca os dados de autenticação para todos os usuários do projeto.
    //    (A filtragem para o tenant específico é feita no passo 5).
    const { data: { users: allAuthUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 5. Combina os dados dos perfis com os dados de autenticação.
    const teamMembers = teamProfiles.map((profile) => {
      const authUser = allAuthUsers.find((u) => u.id === profile.id);
      return {
        id: profile.id,
        name: profile.full_name,
        email: authUser?.email || 'Email não encontrado',
        role: profile.roles?.name || 'Sem cargo',
        // O status é 'Aceite' se o usuário já fez login alguma vez.
        status: authUser?.last_sign_in_at ? 'Aceite' : 'Pendente',
      };
    });
    
    return new Response(JSON.stringify({ teamMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      // ✅ CORREÇÃO: Adicionados os cabeçalhos de CORS à resposta de erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})