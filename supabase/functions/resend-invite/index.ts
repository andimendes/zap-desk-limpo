// supabase/functions/resend-invite/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// Vamos precisar do Resend novamente para enviar o e-mail
import { Resend } from 'npm:resend';

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
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 1. Gera um novo link de convite para o utilizador
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      // Redireciona para a nossa nova página de confirmação!
      options: { redirectTo: `${origin}/confirmacao` } 
    });

    if (linkError) throw linkError;

    const inviteLink = data.properties.action_link;

    // 2. Envia o e-mail personalizado com o novo link
    await resend.emails.send({
      from: 'Equipa Zap Desk Pro <onboarding@resend.dev>',
      to: [email],
      subject: `Lembrete: Convite para o Zap Desk Pro`,
      html: `
        <h1>Olá!</h1>
        <p>Estamos a reenviar o teu convite para te juntares à equipa no Zap Desk Pro.</p>
        <p>Para aceitares o convite e definires a tua senha, clica no botão abaixo:</p>
        <a href="${inviteLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Aceitar Convite
        </a>
        <p>Este link é válido por 24 horas.</p>
        <br>
        <p>Atenciosamente,</p>
        <p>Equipa Zap Desk Pro</p>
      `,
    });

    return new Response(JSON.stringify({ message: 'Convite reenviado com sucesso!' }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
