// supabase/functions/send-custom-invitation/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { Resend } from 'npm:resend';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email, fullName, role } = await req.json();
    if (!email || !fullName || !role) {
      throw new Error('Email, nome completo (fullName) e cargo (role) são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 1. Cria o utilizador e o convite no Supabase Auth
    const { data: { user }, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName, role: role },
        redirectTo: `${origin}/confirmacao`
      }
    );

    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
         return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
            status: 409,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      throw inviteError;
    }

    // 2. Obtém o link de convite para colocar no nosso e-mail
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (linkError) throw linkError;
    const inviteLink = linkData.properties.action_link;

    // 3. Envia o e-mail personalizado com o Resend
    await resend.emails.send({
      from: 'Equipa Zap Desk Pro <onboarding@resend.dev>',
      to: [email],
      subject: `Convite para se juntar à equipa no Zap Desk Pro`,
      html: `
        <h1>Olá, ${fullName}!</h1>
        <p>Foste convidado para te juntares à equipa no Zap Desk Pro como <strong>${role}</strong>.</p>
        <p>Para aceitares o convite e definires a tua senha, clica no botão abaixo:</p>
        <a href="${inviteLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Aceitar Convite e Criar Conta
        </a>
        <p>Se tiveres alguma dúvida, fala com o administrador da tua equipa.</p>
        <br>
        <p>Atenciosamente,</p>
        <p>Equipa Zap Desk Pro</p>
      `,
    });

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!' }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
