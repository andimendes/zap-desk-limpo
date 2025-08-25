import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface InvitePayload {
  email: string;
  roles: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const { email, roles }: InvitePayload = await req.json();

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
        // Se nenhum cargo for encontrado, podemos decidir se isso é um erro ou não.
        // Por agora, vamos apenas registar e continuar.
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

    return new Response(JSON.stringify({ message: `Convite enviado para ${email}` }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na função de convite:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500, // Usar 500 para erros internos do servidor
    });
  }
});
