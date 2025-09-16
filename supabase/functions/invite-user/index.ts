import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Lida com a requisição de pré-verificação CORS (padrão)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Cria um cliente Supabase com SUPERPODERES de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Descobre QUEM está enviando o convite para pegar o tenant_id dele
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado.")

    const { data: profile } = await supabaseAdmin.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) throw new Error("Perfil do administrador não encontrado.")

    const tenantId = profile.tenant_id;
    if (!tenantId) throw new Error("Administrador não está associado a uma empresa.");

    // 3. Pega os dados do novo convidado (email e nome) que vieram do seu React
    const { email, fullName } = await req.json()
    if (!email || !fullName) throw new Error("Email e Nome Completo são obrigatórios.");

    // 4. ENVIA O CONVITE usando a API de Admin, agora com o tenant_id correto!
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          tenant_id: tenantId,
          full_name: fullName
        }
      }
    )

    if (error) throw error

    return new Response(JSON.stringify(data), {
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