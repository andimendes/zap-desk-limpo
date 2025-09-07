// supabase/functions/reset-password/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    // Crie um cliente Supabase com o service_role para ter permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Solicita a redefinição de senha
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get('SITE_URL')}/update-password`, // Crie uma página para isso no seu app
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ message: 'Se o e-mail existir em nossa base, um link para redefinição de senha foi enviado.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})