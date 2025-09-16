// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- FUNÇÃO AUXILIAR PARA CRIAR O CLIENTE ADMIN ---
// Esta é a forma mais segura e recomendada de criar um cliente com privilégios de administrador.
function createAdminClient(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
// --- FIM DA FUNÇÃO AUXILIAR ---


serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { email, fullName, role: role_id } = await req.json();
    if (!email || !fullName || !role_id) {
      throw new Error('Email, nome completo (fullName) e ID do cargo (role_id) são obrigatórios.');
    }

    // --- USO DA NOVA FUNÇÃO ---
    const supabaseAdmin = createAdminClient(req);
    // -------------------------

    const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser();
    if (!adminUser) throw new Error('Administrador não autenticado.');

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', adminUser.id)
      .single();

    if (profileError) throw profileError;
    const tenantId = adminProfile.tenant_id;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está em uso.' }), {
           status: 409,
           headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
       });
     }
      throw inviteError;
    }

    const newUser = inviteData.user;
    
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', newUser.id)
        .single();

    if (!existingProfile) {
        const { error: createProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: newUser.id,
            tenant_id: tenantId,
            full_name: fullName,
            role_id: role_id,
          });

        if (createProfileError) {
            await supabaseAdmin.auth.admin.deleteUser(newUser.id);
            throw createProfileError;
        }
    }

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!', user: newUser }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ERRO DETALHADO NA FUNÇÃO:', error); 
    const errorMessage = error.details 
      ? `${error.message} | DETALHES: ${error.details}` 
      : error.message;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});