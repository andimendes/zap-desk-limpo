// Este ficheiro define os cabeçalhos CORS para permitir que o seu site Vercel
// se comunique com as suas funções do Supabase de forma segura.

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://zap-desk-limpo.vercel.app', // O seu domínio de produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
