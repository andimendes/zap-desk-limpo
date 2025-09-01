import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
// ... outros imports

const NegocioDetalhesModal = ({ negocio, isOpen, onClose, onNegocioUpdate, onDataChange }) => {
  // ... todos os useState
  
  useEffect(() => {
    if (!isOpen || !negocio?.id) return;

    const carregarDadosDoNegocio = async () => {
      console.log('--- Iniciando busca de dados para o negócio:', negocio.titulo);
      setCarregandoDados(true);
      try {
        console.log('1. Antes do Promise.all');
        const [atividadesRes, notasRes, orcamentoRes, produtosRes, usersRes] = await Promise.all([
          supabase.from('crm_atividades').select('*').eq('negocio_id', negocio.id).order('data_atividade', { ascending: false }),
          supabase.from('crm_notas').select('*').eq('negocio_id', negocio.id).order('created_at', { ascending: false }),
          supabase.from('crm_orcamentos').select('*').eq('negocio_id', negocio.id).maybeSingle(),
          supabase.from('produtos_servicos').select('*').eq('ativo', true).order('nome'),
          supabase.from('profiles').select('id, full_name').order('full_name')
        ]);
        console.log('2. Depois do Promise.all');

        if (atividadesRes.error) throw { message: 'Erro ao buscar atividades', details: atividadesRes.error };
        if (notasRes.error) throw { message: 'Erro ao buscar notas', details: notasRes.error };
        if (orcamentoRes.error) throw { message: 'Erro ao buscar orçamento', details: orcamentoRes.error };
        if (produtosRes.error) throw { message: 'Erro ao buscar produtos', details: produtosRes.error };
        if (usersRes.error) throw { message: 'Erro ao buscar utilizadores', details: usersRes.error };
        
        console.log('3. Dados brutos recebidos com sucesso. A processar itens do orçamento...');
        setAtividades(atividadesRes.data || []);
        setNotas(notasRes.data || []);
        setOrcamento(orcamentoRes.data);
        setListaDeProdutos(produtosRes.data || []);
        setListaDeUsers(usersRes.data || []);
        setResponsavelId(negocio?.responsavel_id || '');

        if (orcamentoRes.data) {
          const { data: itensData, error: itensError } = await supabase.from('crm_orcamento_itens').select('*, subtotal').eq('orcamento_id', orcamentoRes.data.id);
          if (itensError) throw { message: 'Erro ao buscar itens do orçamento', details: itensError };
          setOrcamentoItens(itensData || []);
        } else {
          setOrcamentoItens([]);
        }
        console.log('4. Processamento concluído.');

      } catch (error) {
        console.error('--- ERRO CAPTURADO ---:', error.message, error.details || error);
        alert('Não foi possível carregar os detalhes do negócio. Verifique o console.');
      } finally {
        console.log('5. Bloco "finally" executado. A remover o loading.');
        setCarregandoDados(false);
      }
    };
    carregarDadosDoNegocio();
  }, [isOpen, negocio]);

  // ... O resto do componente (funções handle e o JSX) permanece o mesmo
  
  if (!isOpen) return null;
  // ...
};

export default NegocioDetalhesModal;