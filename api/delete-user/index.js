import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  try {
    const supabaseAdmin = createClient( process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY );
    const { userId } = req.body;
    if (!userId) { return res.status(400).json({ error: 'ID do usuário é obrigatório.' }); }

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}