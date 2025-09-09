import { supabase } from '../supabaseClient'; // Ajuste o caminho se necessário

/**
 * Busca todos os negócios do banco de dados com base em filtros, incluindo os nomes da empresa e do contato associado.
 * @param {object} filtros - Objeto com os filtros a serem aplicados. Ex: { status, etapaIds, responsavelId, ... }
 */
export async function getNegocios(filtros = {}) {
  // --- CORREÇÃO APLICADA AQUI ---
  let query = supabase
    .from('crm_negocios')
    .select(`
      *,
      responsavel: profiles(id, full_name, avatar_url),
      empresa: crm_empresas(id, nome_fantasia),
      contato: crm_contatos(id, nome)
    `);

  // Aplica o filtro de status (Ativo, Ganho, Perdido)
  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }

  // Se o status for 'Ativo', filtra pelas etapas do funil
  if (filtros.status === 'Ativo' && filtros.etapaIds && filtros.etapaIds.length > 0) {
    query = query.in('etapa_id', filtros.etapaIds);
  }

  // Filtra por responsável
  if (filtros.responsavelId && filtros.responsavelId !== 'todos') {
    query = query.eq('responsavel_id', filtros.responsavelId);
  }
  
  // NOVO: Filtra por ID da empresa
  if (filtros.empresaId) {
    query = query.eq('empresa_id', filtros.empresaId);
  }


  // Filtra por data de início
  if (filtros.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio);
  }

  // Filtra por data de fim
  if (filtros.dataFim) {
    query = query.lte('created_at', filtros.dataFim);
  }

  // --- CORREÇÃO APLICADA AQUI ---
  // Filtra por termo de pesquisa no título do negócio
  if (filtros.termoPesquisa) {
    query = query.ilike('nome_negocio', `%${filtros.termoPesquisa}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar negócios:', error);
  }
  return { data, error };
}


/**
 * Cria um novo negócio no banco de dados.
 * @param {object} negocioData - Os dados do negócio a ser criado (ex: { titulo, valor, empresa_id, contato_id, ... })
 */
export async function createNegocio(negocioData) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .insert([negocioData])
    .select(); // .select() retorna o registro recém-criado

  if (error) {
    console.error('Erro ao criar negócio:', error);
  }
  return { data, error };
}

/**
 * Atualiza um negócio existente.
 * @param {string} negocioId - O ID do negócio a ser atualizado.
 * @param {object} updates - Os campos a serem atualizados (ex: { etapa_id, valor })
 */
export async function updateNegocio(negocioId, updates) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .update(updates)
    .eq('id', negocioId)
    .select();

  if (error) {
    console.error('Erro ao atualizar negócio:', error);
  }
  return { data, error };
}

/**
 * Deleta um negócio do banco de dados.
 * @param {string} negocioId - O ID do negócio a ser deletado.
 */
export async function deleteNegocio(negocioId) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .delete()
    .eq('id', negocioId);

  if (error) {
    console.error('Erro ao deletar negócio:', error);
  }
  return { data, error };
}