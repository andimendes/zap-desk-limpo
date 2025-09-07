// supabase/functions/update-user-details/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { userId, name, email, role, password } = await req.json();
    if (!userId || !name || !email || !role) {
      throw new Error('Faltam dados obrigatórios (userId, name, email, role).');
    }

    // --- VERIFICAÇÃO DE SEGURANÇA MULTI-TENANT ---
    // 1. Identifica o administrador que está fazendo a chamada
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser();
    if (!adminUser) throw new Error('Administrador não autenticado.');

    // 2. Cria um cliente com permissões de super-administrador para as checagens
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Busca os perfis (e o tenant_id) tanto do admin quanto do usuário-alvo
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, tenant_id')
      .in('id', [adminUser.id, userId]);

    if (profileError) throw profileError;

    const adminProfile = profiles.find(p => p.id === adminUser.id);
    const targetProfile = profiles.find(p => p.id === userId);

    // 4. Se algum perfil não for encontrado ou se os tenant_ids forem diferentes, bloqueia a operação
    if (!adminProfile || !targetProfile || adminProfile.tenant_id !== targetProfile.tenant_id) {
      throw new Error('Permissão negada: operação não autorizada.');
    }
    // --- FIM DA VERIFICAÇÃO DE SEGURANÇA ---

    const updatePayload: { email?: string; user_metadata?: any; password?: string } = {
      user_metadata: { full_name: name, role: role }
    };
    
    // Apenas atualiza o email se ele for diferente, para evitar re-confirmações desnecessárias
    const { data: { user: currentUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (currentUser && currentUser.email !== email) {
      updatePayload.email = email;
    }

    if (password) {
      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }
      updatePayload.password = password;
    }

    const { data: updatedUser, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updatePayload
    );

    if (error) { throw error; }

    return new Response(
      JSON.stringify({ message: 'Utilizador atualizado com sucesso!', user: updatedUser }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});