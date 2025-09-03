// src/components/crm/NegocioDetalhesModal.jsx (VERSÃO DE DEPURAÇÃO - NÍVEL 2)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { X, Loader2 } from 'lucide-react';
// Deixamos os outros imports comentados por enquanto para simplificar
// import BarraLateral from './BarraLateral';
// ... e assim por diante

// Esta é a mesma lógica completa do arquivo original
const differenceInDays = (dateLeft, dateRight) => {
    const diff = dateLeft.getTime() - dateRight.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
};
  
const NegocioDetalhesModal = ({ negocio: negocioInicial, isOpen, onClose, onDataChange, etapasDoFunil, listaDeUsers }) => {
  // =================== LÓGICA REATIVADA ===================
  const [negocio, setNegocio] = useState(negocioInicial);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true); // Começa como true

  // Usamos useCallback para evitar recriação desnecessária das funções
  const carregarContatosAssociados = useCallback(async (negocioId) => {
    // ... (esta função será chamada por carregarDadosDetalhados)
  }, []);

  const carregarArquivos = useCallback(async (negocioId) => {
     // ... (esta função será chamada por carregarDadosDetalhados)
  }, []);

  const carregarDadosDetalhados = useCallback(async () => {
    if (!negocioInicial?.id) { 
        setLoading(false); 
        return; 
    }
    console.log("DEBUG NÍVEL 2: Iniciando busca de dados detalhados...");
    setLoading(true);
    try {
      const { data: updatedNegocio } = await supabase.from('crm_negocios').select('*, responsavel:profiles(full_name)').eq('id', negocioInicial.id).single();
      setNegocio(updatedNegocio);
      
      const { data: atividadesData } = await supabase.from('crm_atividades').select('*').eq('negocio_id', negocioInicial.id).order('data_atividade', { ascending: false });
      const { data: notasData } = await supabase.from('crm_notas').select('*').eq('negocio_id', negocioInicial.id).order('created_at', { ascending: false });

      const atividadesFormatadas = (atividadesData || []).map(item => ({ tipo: 'atividade', data: new Date(item.data_atividade), conteudo: item.descricao, concluida: item.concluida, original: item }));
      const notasFormatadas = (notasData || []).map(item => ({ tipo: 'nota', data: new Date(item.created_at), conteudo: item.conteudo, original: item }));
      const historicoUnificado = [...atividadesFormatadas, ...notasFormatadas].sort((a, b) => b.data - a.data);
      
      console.log("DEBUG NÍVEL 2: Dados do histórico processados. Itens:", historicoUnificado.length);
      setHistorico(historicoUnificado);

    } catch (error) {
      console.error("ERRO na busca de dados detalhados:", error);
      alert("Ocorreu um erro ao carregar os dados do negócio. Verifique o console.");
    } finally {
      console.log("DEBUG NÍVEL 2: Busca de dados finalizada.");
      setLoading(false);
    }
  }, [negocioInicial]);

  useEffect(() => {
    if (isOpen) {
        carregarDadosDetalhados();
    }
  }, [isOpen, carregarDadosDetalhados]);
  // ====================================================================

  if (!isOpen) {
    return null;
  }

  // A parte visual (JSX) continua simplificada
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Modo de Depuração Ativo (Nível 2)</h1>
            <button onClick={onClose}><X size={24} /></button>
        </div>
        
        {loading ? (
            <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Carregando dados...</span>
            </div>
        ) : (
            <div className="bg-green-50 p-4 rounded-md">
                <p className="font-semibold">Lógica executada com sucesso!</p>
                <p>Título do Negócio: <span className="font-bold">{negocio.titulo}</span></p>
                <p>Itens no histórico: <span className="font-bold">{historico.length}</span></p>
            </div>
        )}

        <p className="mt-4 text-sm text-gray-600">
            Se você vê esta tela e os dados acima, a lógica de busca está funcionando. O erro deve estar na renderização de um componente visual (JSX).
        </p>
      </div>
    </div>
  );
};

export default NegocioDetalhesModal;