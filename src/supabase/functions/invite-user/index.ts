import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Interface para definir o formato dos dados que esperamos receber
interface InvitePayload {
  email: string;
  roles: string[]; // Ex: ['Admin', 'Gerente']
}

Deno.serve(async (req) => {
  // Lida com a requisição preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, roles }: InvitePayload = await req.json();

    // Validação básica dos dados recebidos
    if (!email || !roles || roles.length === 0) {
      throw new Error("E-mail e pelo menos um cargo são obrigatórios.");
    }

    // Cria um cliente Supabase com privilégios de administrador
    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Convidar o utilizador
    const { data: inviteData, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw inviteError;
    const newUser = inviteData.user;

    // 2. Buscar os IDs dos cargos (roles) a partir dos seus nomes
    const { data: rolesData, error: rolesError } = await adminAuthClient
      .from('roles')
      .select('id')
      .in('name', roles);
    if (rolesError) throw rolesError;

    // 3. Preparar os dados para a tabela de associação 'user_roles'
    const userRolesData = rolesData.map(role => ({
      user_id: newUser.id,
      role_id: role.id
    }));

    // 4. Inserir os cargos para o novo utilizador
    const { error: userRolesError } = await adminAuthClient
      .from('user_roles')
      .insert(userRolesData);
    if (userRolesError) throw userRolesError;

    return new Response(JSON.stringify({ message: `Convite enviado para ${email}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
