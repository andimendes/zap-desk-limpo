import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crie um cliente de ADMIN que ignora as regras de segurança para poder ler todos os perfis.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Crie um cliente com o token do usuário para descobrir quem ele é.
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) throw new Error("Usuário não encontrado.")

    // Busque o perfil do usuário que fez a requisição para encontrar o tenant_id dele.
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()
    if (adminProfileError) throw adminProfileError
    
    const tenantId = adminProfile.tenant_id

    // Usando o cliente ADMIN, busque todos os perfis que pertencem ao mesmo tenant.
    // Também fazemos um "join" com a tabela auth.users para pegar o email.
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        cargo,
        users:users ( email, last_sign_in_at )
      `)
      .eq('tenant_id', tenantId)

    if (teamError) throw teamError

    // O resultado do Supabase vem um pouco aninhado, então vamos formatá-lo
    // para ficar exatamente como o seu frontend espera.
    const formattedTeamMembers = teamMembers.map(member => ({
        id: member.id,
        name: member.full_name,
        role: member.cargo, // ✅ Lendo a coluna 'cargo' e enviando como 'role'
        email: member.users.email,
        status: member.users.last_sign_in_at ? 'Aceite' : 'Pendente' // Determina o status
    }));

    return new Response(JSON.stringify({ teamMembers: formattedTeamMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})