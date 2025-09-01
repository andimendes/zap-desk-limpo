import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js'; 
import AddNegocioModal from './AddNegocioModal.jsx';
import NegocioDetalhesModal from './NegocioDetalhesModal.jsx';
import NegocioCard from './NegocioCard.jsx';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Loader2, AlertTriangle, Users } from 'lucide-react';

const EtapaColuna = ({ etapa, negocios, onCardClick }) => { /* ...código sem alterações... */ };

const CrmBoard = () => {
  const [funis, setFunis] = useState([]);
  const [funilSelecionadoId, setFunilSelecionadoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [negocioSelecionado, setNegocioSelecionado] = useState(null);
  const [listaDeUsers, setListaDeUsers] = useState([]);
  const [filtroResponsavelId, setFiltroResponsavelId] = useState('todos');
  const [winReady, setWinReady] = useState(false);
  useEffect(() => { setWinReady(true); }, []);

  useEffect(() => { /* ...código de busca de dados sem alterações... */ }, []);
  useEffect(() => { /* ...código de busca de dados sem alterações... */ }, [funilSelecionadoId, filtroResponsavelId]);
  
  const handleOnDragEnd = async (result) => { /* ...código sem alterações... */ };
  const handleNegocioAdicionado = (novoNegocio) => { /* ...código sem alterações... */ };
  const handleNegocioUpdate = (id) => {
    setNegocios(current => current.filter(n => n.id !== id));
    setNegocioSelecionado(null);
  };

  const handleNegocioDataChange = (negocioAtualizado) => {
    setNegocios(currentNegocios => 
      currentNegocios.map(n => 
        n.id === negocioAtualizado.id ? negocioAtualizado : n
      )
    );
  };

  return (
    <>
      {winReady && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="bg-gray-50 dark:bg-gray-900/80 min-h-full p-4 sm:p-6 lg:p-8">
            {/* ... JSX do cabeçalho e filtro sem alterações ... */}
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {/* ... JSX das colunas sem alterações ... */}
            </div>
          </div>
        </DragDropContext>
      )}

      {isAddModalOpen && <AddNegocioModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} etapas={etapas} onNegocioAdicionado={handleNegocioAdicionado} />}
      {negocioSelecionado && 
        <NegocioDetalhesModal 
          isOpen={!!negocioSelecionado} 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
          onNegocioUpdate={handleNegocioUpdate}
          onDataChange={handleNegocioDataChange} // Passando a nova prop
        />}
    </>
  );
};

export default CrmBoard;