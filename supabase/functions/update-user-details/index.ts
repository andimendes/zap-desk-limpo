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
    const { userId, name, email, role } = await req.json();
    if (!userId || !name || !email || !role) {
      throw new Error('Faltam dados obrigatórios (userId, name, email, role).');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: updatedUser, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: email,
        user_metadata: { full_name: name, role: role }
      }
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
