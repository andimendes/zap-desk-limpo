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
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('tenant_id').eq('id', user.id).single();
    const tenantId = adminProfile?.tenant_id;
    if (!tenantId) { return res.status(404).json({ error: 'Perfil do administrador ou tenant não encontrado.' }); }

    // PASSO 1: Buscar todos os perfis do tenant.
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, cargo')
      .eq('tenant_id', tenantId);
    if (profilesError) throw profilesError;

    if (profiles.length === 0) {
        return res.status(200).json({ teamMembers: [] });
    }
    const userIds = profiles.map(p => p.id);
    
    // PASSO 2: ✅ CORREÇÃO: Usar a função de admin correta para listar os usuários.
    const { data: { users: allUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Filtra a lista completa de usuários para pegar apenas os que pertencem à equipe.
    const authUsers = allUsers.filter(u => userIds.includes(u.id));

    // PASSO 3: Juntar as informações.
    const teamMembers = profiles.map(profile => {
        const authUser = authUsers.find(u => u.id === profile.id);
        return {
            id: profile.id,
            name: profile.full_name,
            role: profile.cargo,
            email: authUser?.email || '',
            status: authUser?.last_sign_in_at ? 'Aceite' : 'Pendente'
        };
    });

    return res.status(200).json({ teamMembers });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}