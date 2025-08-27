// supabase/functions/_shared/cors.ts

/**
 * Lista de domínios (origens) que têm permissão para aceder às suas funções.
 * Adicione aqui todos os domínios necessários.
 */
const allowedOrigins = [
  // ✅ ADICIONADO: O seu novo domínio de produção
  'https://app.zapcontabilidade.com', 
  
  // Domínios anteriores e de desenvolvimento
  'https://zap-desk-limpo.vercel.app', 
  'http://localhost:3000',
  'http://localhost:5173',
];

/**
 * Função que gera os cabeçalhos CORS de forma segura.
 * @param origin - A origem do pedido (ex: 'https://app.zapcontabilidade.com').
 * @returns Um objeto com os cabeçalhos CORS apropriados.
 */
export function corsHeaders(origin: string) {
  // Cabeçalhos que são sempre enviados
  const headers = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // ✅ MÉTODOS ADICIONADOS
  };

  // ✅ LÓGICA CORRIGIDA:
  // Apenas adiciona o cabeçalho 'Access-Control-Allow-Origin' se a origem
  // do pedido estiver na nossa lista de permissões.
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
