// supabase/functions/reset-password/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email } = await req.json();
    if (!email) { 
      throw new Error('O e-mail é um campo obrigatório.'); 
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password` 
    });

    if (error) { 
      console.error('Erro retornado pelo Supabase:', error.message);
      throw error; 
    }

    return new Response(
      JSON.stringify({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' }),
      { 
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error("Erro na execução da função reset-password:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } 
      }
    );
  }
});