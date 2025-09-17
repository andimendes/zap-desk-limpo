import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Usa as variáveis de ambiente que já configuramos na Vercel
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Pega o token do usuário que está fazendo a requisição
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { return res.status(401).json({ error: 'Usuário não autenticado.' }); }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) { return res.status(401).json({ error: 'Token de usuário inválido.' }); }

    // Busca o tenant_id do usuário que está pedindo a lista
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = adminProfile?.tenant_id;
    if (!tenantId) { return res.status(404).json({ error: 'Perfil do administrador ou tenant não encontrado.' }); }

    // Busca todos os perfis do mesmo tenant
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, cargo, users:users ( email, last_sign_in_at )')
      .eq('tenant_id', tenantId);

    if (teamError) throw teamError;

    // Formata os dados para ficarem perfeitos para o seu frontend
    const formattedTeamMembers = teamMembers.map(member => ({
        id: member.id,
        name: member.full_name,
        role: member.cargo,
        email: member.users?.email,
        status: member.users?.last_sign_in_at ? 'Aceite' : 'Pendente'
    }));

    return res.status(200).json({ teamMembers: formattedTeamMembers });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}