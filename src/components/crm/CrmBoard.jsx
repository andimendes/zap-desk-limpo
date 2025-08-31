import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import AddNegocioModal from './AddNegocioModal.jsx';
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2, AlertTriangle } from 'lucide-react';

const EtapaColuna = ({ etapa, negocios, onCardClick }) => {
  // ... (Componente interno não muda)
};

const CrmBoard = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  useEffect(() => {
    const fetchFunis = async () => { /* ...código sem alterações... */ };
    fetchFunis();
  }, []);

  useEffect(() => {
    if (!funilSelecionadoId) return;
    const fetchEtapasENegocios = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: etapasData, error: etapasError } = await supabase
          .from('crm_etapas')
          .select('*')
          .eq('funil_id', funilSelecionadoId)
          .order('ordem', { ascending: true });
        if (etapasError) throw etapasError;
        setEtapas(etapasData);

        const etapaIds = etapasData.map(e => e.id);
        if (etapaIds.length > 0) {
          
          // --- ESTA É A LINHA QUE MUDOU ---
          const { data: negociosData, error: negociosError } = await supabase
            .from('crm_negocios')
            .select('*, responsavel:profiles(full_name)') // Agora também buscamos o nome do responsável
            .in('etapa_id', etapaIds)
            .eq('status', 'Ativo');

          if (negociosError) throw negociosError;
          setNegocios(negociosData);
        } else {
          setNegocios([]);
        }
      } catch (err) {
        setError(`Não foi possível carregar os dados do funil: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEtapasENegocios();
  }, [funilSelecionadoId]);
  
  const handleOnDragEnd = async (result) => { /* ...código sem alterações... */ };
  const handleNegocioAdicionado = (novo) => {
    // Para novos negócios, precisamos de recarregar para obter o nome do responsável
    // A forma mais simples por agora:
    const fetchNegocios = async () => {
        // ... (código para buscar negócios, igual ao do useEffect)
    };
    fetchNegocios(); // Recarrega a lista
    setAddModalOpen(false);
  };
  const handleNegocioUpdate = (id) => { /* ...código sem alterações... */ };

  if (loading && funis.length === 0) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  // O JSX do CrmBoard não muda
  return (
    // ... cole aqui todo o return da versão anterior ...
  );
};

export default CrmBoard;