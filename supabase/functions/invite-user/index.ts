import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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

    // ✅ CORREÇÃO: Agora também esperamos o role_id e validamos
    const { email, fullName, role_id } = await req.json()
    if (!email || !fullName || !role_id) {
        throw new Error("Email, Nome Completo e ID do cargo (role_id) são obrigatórios.")
    }

    // ✅ CORREÇÃO: Incluímos o role_id nos metadados do convite
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          tenant_id: tenantId,
          full_name: fullName,
          role_id: role_id
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