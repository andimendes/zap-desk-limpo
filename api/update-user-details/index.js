import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Método não permitido' }); }
  try {
    const supabaseAdmin = createClient( process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY );
    // 'role' aqui é o NOME do cargo, ex: "Atendente"
    const { userId, name, email, role } = req.body; 
    if (!userId) { return res.status(400).json({ error: 'ID do usuário é obrigatório.' }); }

    // Atualiza o perfil na tabela 'profiles'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: name, cargo: role })
      .eq('id', userId);
    if (profileError) throw profileError;

    // Atualiza o email na tabela de autenticação (se for alterado)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
    if (authError) throw authError;

    // Atualiza o vínculo na tabela 'user_roles'
    const { data: roleData, error: roleError } = await supabaseAdmin.from('roles').select('id').eq('name', role).single();
    if (roleError) throw new Error(`Cargo '${role}' não encontrado.`);

    const { error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role_id: roleData.id })
      .eq('user_id', userId);
    if (userRoleError) throw userRoleError;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}