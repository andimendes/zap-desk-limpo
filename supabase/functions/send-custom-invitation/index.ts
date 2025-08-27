// supabase/functions/send-custom-invitation/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { Resend } from 'npm:resend';

serve(async (req) => {
  console.log("--- Função 'send-custom-invitation' iniciada ---");
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email, fullName, role } = await req.json();
    console.log(`Dados recebidos: Email=${email}, Nome=${fullName}, Cargo=${role}`);

    if (!email || !fullName || !role) {
      throw new Error('Email, nome completo (fullName) e cargo (role) são obrigatórios.');
    }

    // --- LOG DE DIAGNÓSTICO 1: Verificar a chave da API ---
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error("ERRO CRÍTICO: A variável de ambiente RESEND_API_KEY não foi encontrada.");
      throw new Error("A chave da API do Resend não está configurada.");
    }
    console.log("Chave da API do Resend encontrada com sucesso.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(resendApiKey);

    // --- LOG DE DIAGNÓSTICO 2: Antes de criar o utilizador ---
    console.log("Passo 1: A tentar criar o convite no Supabase Auth...");
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName, role: role },
        redirectTo: `${origin}/confirmacao`
      }
    );

    if (inviteError) {
      console.error("Erro no Passo 1 (inviteUserByEmail):", inviteError.message);
      if (inviteError.message.includes('User already registered')) {
         return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
            status: 409,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      throw inviteError;
    }
    console.log("Passo 1 concluído com sucesso. Utilizador convidado:", inviteData.user.id);

    // --- LOG DE DIAGNÓSTICO 3: Antes de gerar o link ---
    console.log("Passo 2: A tentar gerar o link de convite...");
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (linkError) {
      console.error("Erro no Passo 2 (generateLink):", linkError.message);
      throw linkError;
    }
    const inviteLink = linkData.properties.action_link;
    console.log("Passo 2 concluído com sucesso. Link gerado:", inviteLink);

    // --- LOG DE DIAGNÓSTICO 4: Antes de enviar o e-mail ---
    console.log("Passo 3: A tentar enviar o e-mail personalizado com o Resend...");
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
    console.log("Passo 3 concluído com sucesso. E-mail enviado para:", email);

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!' }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("--- ERRO INESPERADO NA FUNÇÃO ---", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
