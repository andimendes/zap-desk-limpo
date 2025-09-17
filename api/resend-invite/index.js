import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Método não permitido' }); }
  try {
    const supabaseAdmin = createClient( process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY );
    const { email } = req.body;
    if (!email) { return res.status(400).json({ error: 'Email é obrigatório.' }); }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}