import { createClient } from '@supabase/supabase-js'

// Pega a URL e a Chave Anon das variáveis de ambiente que configuramos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente do Supabase para ser usado em outros lugares do app
export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Atualiza o status de um negócio para 'Ganho'.
 * @param {number} negocioId O ID do negócio a ser atualizado.
 */
export async function marcarNegocioComoGanho(negocioId) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .update({ status: 'Ganho' })
    .eq('id', negocioId);

  return { data, error };
}

/**
 * Atualiza o status de um negócio para 'Perdido' e adiciona o motivo.
 * @param {number} negocioId O ID do negócio a ser atualizado.
 * @param {string} motivo O motivo pelo qual o negócio foi perdido.
 */
export async function marcarNegocioComoPerdido(negocioId, motivo) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .update({ status: 'Perdido', motivo_perda: motivo })
    .eq('id', negocioId);

  return { data, error };
}

