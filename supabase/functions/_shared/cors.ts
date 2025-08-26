// supabase/functions/_shared/cors.ts

// Este ficheiro define os cabeçalhos CORS para permitir que o seu site Vercel
// e o seu ambiente de desenvolvimento local se comuniquem com as suas funções.

// Lista de domínios autorizados
const allowedOrigins = [
  'https://zap-desk-limpo.vercel.app', // Domínio de produção
  'http://localhost:5173', // Domínio de desenvolvimento Vite (padrão)
  'http://localhost:3000', // Domínio de desenvolvimento (alternativo)
];

export const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Métodos permitidos
});

