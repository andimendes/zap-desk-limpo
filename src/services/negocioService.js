import { supabase } from '../supabaseClient'; // Ajuste o caminho se necessário

/**
 * Busca todos os negócios do banco de dados com base em filtros.
 */
export async function getNegocios(filtros = {}) {
  // --- CORREÇÃO APLICADA AQUI ---
  // A consulta agora também busca as atividades relacionadas a cada negócio.
  let query = supabase
    .from('crm_negocios')
    .select(`
      *,
      responsavel: profiles(id, full_name, avatar_url),
      empresa: crm_empresas(id, nome_fantasia, bairro),
      contato: crm_contatos(id, nome),
      crm_atividades(data_atividade, concluida)
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
  
  // Filtra por ID da empresa
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

  // Filtra por termo de pesquisa no nome do negócio
  if (filtros.termoPesquisa) {
    query = query.ilike('nome_negocio', `%${filtros.termoPesquisa}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar negócios:', error);
    return { data, error };
  }

  // --- LÓGICA ADICIONADA PARA ATUALIZAR O CARD ---
  // Para cada negócio, verificamos se existe alguma atividade futura não concluída.
  const negociosComStatusDeTarefa = data.map(negocio => {
    const temTarefaFutura = negocio.crm_atividades.some(atv => 
        !atv.concluida && new Date(atv.data_atividade) >= new Date()
    );
    return { ...negocio, tem_tarefa_futura: temTarefaFutura };
  });

  return { data: negociosComStatusDeTarefa, error: null };
}


/**
 * Cria um novo negócio no banco de dados.
 */
export async function createNegocio(negocioData) {
  const { data, error } = await supabase
    .from('crm_negocios')
    .insert([negocioData])
    .select();

  if (error) {
    console.error('Erro ao criar negócio:', error);
  }
  return { data, error };
}

/**
 * Atualiza um negócio existente.
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