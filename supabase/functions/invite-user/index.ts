// supabase/functions/invite-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// DEBUG: Log para verificar se a nova versão da função foi deployed
console.log('--- Função invite-user v2 (com CORS) iniciada ---');

interface InvitePayload {
  email: string;
  roles: string[];
}

Deno.serve(async (req) => {
  // DEBUG: Log para ver os detalhes de cada pedido que chega
  console.log(`Recebido pedido: ${req.method} de ${req.headers.get('Origin')}`);

  const origin = req.headers.get('Origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    console.log('Respondendo ao pedido OPTIONS com cabeçalhos:', headers);
    return new Response('ok', { headers });
  }

  try {
    const { email, roles }: InvitePayload = await req.json();
    console.log('Payload recebido:', { email, roles });

    if (!email || !roles || roles.length === 0) {
      throw new Error("E-mail e pelo menos um cargo são obrigatórios.");
    }

    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: inviteData, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw inviteError;
    const newUser = inviteData.user;

    if (!newUser) {
      throw new Error("Não foi possível criar o utilizador.");
    }

    const { data: rolesData, error: rolesError } = await adminAuthClient
      .from('roles')
      .select('id')
      .in('name', roles);
    if (rolesError) throw rolesError;

    if (!rolesData || rolesData.length === 0) {
        console.warn(`Nenhum cargo encontrado para os nomes: ${roles.join(', ')}`);
    } else {
        const userRolesData = rolesData.map(role => ({
          user_id: newUser.id,
          role_id: role.id
        }));

        const { error: userRolesError } = await adminAuthClient
          .from('user_roles')
          .insert(userRolesData);
        if (userRolesError) throw userRolesError;
    }

    console.log('Enviando resposta de sucesso...');
    return new Response(JSON.stringify({ message: `Convite enviado para ${email}` }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na função de convite:', error);
    console.log('Enviando resposta de erro...');
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
