// supabase/functions/resend-invite/index.ts

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
    if (!email) throw new Error('O e-mail é obrigatório.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (error) throw error;

    // NOTA: Este método não envia o email. Ele apenas gera o link.
    // A sua aplicação front-end deve dizer "Convite reenviado" e o utilizador
    // deve procurar o email original ou o administrador pode partilhar o link (data.properties.action_link).
    // Se quiser reenviar um email personalizado, precisará de integrar um serviço como o Resend aqui.

    return new Response(
      JSON.stringify({ message: 'Novo link de convite gerado com sucesso!', link: data.properties.action_link }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
