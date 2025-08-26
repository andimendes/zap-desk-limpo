// supabase/functions/update-user-roles/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('--- Função update-user-roles v1 (com CORS) iniciada ---');

interface UpdatePayload {
  userId: string;
  roles: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || ''
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    console.log('Respondendo ao pedido OPTIONS com cabeçalhos:', headers);
    return new Response('ok', { headers })
  }

  try {
    const { userId, roles }: UpdatePayload = await req.json()
    console.log('Payload de atualização recebido:', { userId, roles });

    if (!userId || !roles) {
      throw new Error("O ID do utilizador e os cargos são obrigatórios.");
    }

    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Apagar todos os cargos existentes para este utilizador
    const { error: deleteError } = await adminAuthClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError;
    console.log(`Cargos antigos do utilizador ${userId} apagados.`);

    // 2. Obter os IDs dos novos cargos
    const { data: rolesData, error: rolesError } = await adminAuthClient
      .from('roles')
      .select('id')
      .in('name', roles);
    if (rolesError) throw rolesError;

    // 3. Inserir os novos cargos
    if (rolesData && rolesData.length > 0) {
      const userRolesData = rolesData.map(role => ({
        user_id: userId,
        role_id: role.id
      }));

      const { error: insertError } = await adminAuthClient
        .from('user_roles')
        .insert(userRolesData)
      if (insertError) throw insertError;
      console.log(`Novos cargos para o utilizador ${userId} inseridos.`);
    } else {
      console.log(`Nenhum cargo novo para inserir para o utilizador ${userId}.`);
    }

    return new Response(JSON.stringify({ message: `Cargos do utilizador ${userId} atualizados.` }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na função de atualização de cargos:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
