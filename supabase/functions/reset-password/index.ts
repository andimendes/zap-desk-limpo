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
      throw new Error('O email é obrigatório.'); 
    }

    // --- MUDANÇA IMPORTANTE ---
    // Para esta operação, usamos a chave pública (anon key), pois é uma ação
    // que qualquer utilizador pode iniciar, e não uma ação de administrador.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '' // Usar a ANON_KEY aqui!
    );

    // Esta função envia o email de redefinição de senha que você personalizou no painel.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/confirmacao` // A página para onde o utilizador vai para definir a nova senha.
    });

    if (error) { throw error; }

    return new Response(
      JSON.stringify({ message: 'Se o email estiver correto, um link de recuperação foi enviado.' }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Erro na função reset-password:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
