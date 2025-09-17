import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Obter o tenant_id do administrador que está convidando (como antes)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { return res.status(401).json({ error: 'Usuário não autenticado.' }); }
    const { data: { user: inviter } } = await supabaseAdmin.auth.getUser(token);
    if (!inviter) { return res.status(401).json({ error: 'Token de administrador inválido.' }); }
    const { data: profile } = await supabaseAdmin.from('profiles').select('tenant_id').eq('id', inviter.id).single();
    const tenantId = profile?.tenant_id;
    if (!tenantId) { return res.status(404).json({ error: 'Perfil do administrador ou tenant não encontrado.' }); }

    // 2. Obter os dados do novo usuário do corpo da requisição (como antes)
    const { email, fullName, role_id } = req.body;
    if (!email || !fullName || !role_id) {
      return res.status(400).json({ error: "Email, Nome Completo e ID do cargo (role_id) são obrigatórios." });
    }

    // 3. Convidar o usuário (sem metadados por enquanto)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      // Se falhar aqui (ex: usuário já existe), veremos o erro real do Supabase.
      throw inviteError;
    }
    const newUserId = inviteData.user.id;

    // 4. Buscar o nome do cargo a partir do role_id
    const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('name')
        .eq('id', role_id)
        .single();
    if (roleError || !roleData) throw new Error(`O Cargo com ID ${role_id} não foi encontrado.`);
    const roleName = roleData.name;

    // 5. Inserir o perfil na tabela 'profiles'
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: newUserId,
            full_name: fullName,
            tenant_id: tenantId,
            cargo: roleName
        });
    if (profileError) {
      // Se falhar aqui, veremos o erro real do banco de dados (ex: coluna não existe, etc).
      throw profileError;
    }

    // 6. Inserir o vínculo na tabela 'user_roles'
    const { error: userRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
            user_id: newUserId,
            role_id: role_id,
            tenant_id: tenantId
        });
    if (userRoleError) {
      // Se falhar aqui, veremos o erro real (ex: nome de coluna errada, etc).
      throw userRoleError;
    }

    return res.status(200).json({ success: true, user: inviteData.user });

  } catch (error) {
    // ESTE BLOCO AGORA VAI CAPTURAR A MENSAGEM DE ERRO REAL E DETALHADA
    return res.status(500).json({ error: `Ocorreu um erro: ${error.message}` });
  }
}