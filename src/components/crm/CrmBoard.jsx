// src/components/crm/CrmBoard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import AddNegocioModal from './AddNegocioModal'; // <-- 1. IMPORTAR O NOVO MODAL

// Componente para um único card de negócio
const NegocioCard = ({ negocio }) => {
  return (
    <div className="bg-white p-4 mb-4 rounded-lg shadow-md border-l-4 border-blue-500">
      <h4 className="font-bold text-gray-800">{negocio.titulo}</h4>
      <p className="text-sm text-gray-600 mt-1">{negocio.empresa_contato}</p>
      <p className="text-sm text-gray-500 mt-2">{negocio.nome_contato}</p>
      <div className="mt-3 text-right">
        <span className="text-lg font-semibold text-gray-700">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negocio.valor)}
        </span>
      </div>
    </div>
  );
};

// Componente para uma coluna (etapa) do funil
const EtapaColuna = ({ etapa, negocios }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0">
      <h3 className="font-bold text-lg text-gray-700 mb-4 pb-2 border-b-2 border-gray-300">
        {etapa.nome_etapa}
      </h3>
      <div className="h-full overflow-y-auto">
        {negocios.map(negocio => (
          <NegocioCard key={negocio.id} negocio={negocio} />
        ))}
      </div>
    </div>
  );
};

// Componente principal do Quadro CRM
const CrmBoard = () => {
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- 2. ESTADO PARA CONTROLAR O MODAL

  // Função para buscar os dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Assume que temos apenas um funil por enquanto para simplificar
      const { data: funisData, error: funisError } = await supabase
        .from('crm_funis')
        .select('id')
        .limit(1);
      if (funisError) throw funisError;

      if (funisData.length > 0) {
        const funilId = funisData[0].id;

        const { data: etapasData, error: etapasError } = await supabase
          .from('crm_etapas')
          .select('*')
          .eq('funil_id', funilId)
          .order('ordem', { ascending: true });
        if (etapasError) throw etapasError;
        setEtapas(etapasData);

        const etapaIds = etapasData.map(e => e.id);
        const { data: negociosData, error: negociosError } = await supabase
          .from('crm_negocios')
          .select('*')
          .in('etapa_id', etapaIds);
        if (negociosError) throw negociosError;
        setNegocios(negociosData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do CRM:", error);
      setError("Não foi possível carregar os dados do CRM.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // <-- 3. FUNÇÃO PARA ATUALIZAR A LISTA DE NEGÓCIOS
  const handleNegocioAdicionado = (novoNegocio) => {
    setNegocios(currentNegocios => [...currentNegocios, novoNegocio]);
  };

  if (loading) {
    return <div className="p-8 text-center text-xl">A carregar o seu pipeline...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-xl text-red-500">{error}</div>;
  }

  return (
    <> {/* Usar Fragment para encapsular o board e o modal */}
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Central de Oportunidades</h1>
          {/* <-- 4. BOTÃO PARA ABRIR O MODAL --> */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            + Adicionar Negócio
          </button>
        </div>

        <div className="flex space-x-6 overflow-x-auto pb-4">
          {etapas.length > 0 ? (
            etapas.map(etapa => {
              const negociosDaEtapa = negocios.filter(n => n.etapa_id === etapa.id);
              return <EtapaColuna key={etapa.id} etapa={etapa} negocios={negociosDaEtapa} />;
            })
          ) : (
            <p>Nenhuma etapa encontrada. Crie um funil e etapas primeiro.</p>
          )}
        </div>
      </div>

      {/* <-- 5. RENDERIZAR O MODAL --> */}
      <AddNegocioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        etapas={etapas}
        onNegocioAdicionado={handleNegocioAdicionado}
      />
    </>
  );
};

export default CrmBoard;
