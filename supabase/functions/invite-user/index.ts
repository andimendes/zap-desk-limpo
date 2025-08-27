// supabase/functions/invite-user/index.ts

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

    // Passo 1: Cria o convite no Supabase. O utilizador fica no estado "aguardando"
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { data: { full_name: fullName, role: role } }
    );

    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
         return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
            status: 409, // Código de conflito
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      throw inviteError;
    }

    // Passo 2: Gera um link mágico para o utilizador definir a senha
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (linkError) { throw linkError; }
    const inviteLink = linkData.properties.action_link;

    // Passo 3: Envia o e-mail personalizado com o link
    await resend.emails.send({
      from: 'Equipa Zap Contabilidade <onboarding@resend.dev>',
      to: [email],
      subject: `Convite para se juntar à equipa na Zap Contabilidade`,
      html: `
        <h1>Olá, ${fullName}!</h1>
        <p>Você foi convidado para se juntar à equipa na Zap Contabilidade como <strong>${role}</strong>.</p>
        <p>Para aceitar o convite e definir a sua senha, clique no botão abaixo:</p>
        <a href="${inviteLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Aceitar Convite e Criar Conta
        </a>
        <p>Se tiver alguma dúvida, fale com o administrador da sua equipa.</p>
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
