import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // ✅ CORREÇÃO: Usando as variáveis de ambiente corretas do servidor (sem o VITE_)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Token de usuário inválido.' });
    }
    
    const { data: profile } = await supabaseAdmin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) {
      return res.status(404).json({ error: 'Perfil do administrador não encontrado.' });
    }
    const tenantId = profile.tenant_id;

    const { email, fullName, role_id } = req.body;
    if (!email || !fullName || !role_id) {
      return res.status(400).json({ error: "Email, Nome Completo e ID do cargo (role_id) são obrigatórios." });
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          tenant_id: tenantId,
          full_name: fullName,
          role_id: role_id
        }
      }
    );

    if (error) throw error;

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}