// supabase/functions/_shared/cors.ts

/**
 * Lista de domínios (origens) que têm permissão para aceder às suas funções.
 */
const allowedOrigins = [
  'https://app.zapcontabilidade.com', // O seu novo domínio de produção
  'https://zap-desk-limpo.vercel.app', // Domínio antigo (pode manter)
  'http://localhost:3000',             // Para desenvolvimento local
  'http://localhost:5173',             // Para desenvolvimento local com Vite
];

/**
 * Função que gera os cabeçalhos CORS de forma segura.
 */
export function corsHeaders(origin: string) {
  const headers = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
