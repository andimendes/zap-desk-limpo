import React, { useState } from 'react';
// CORREÇÃO: Importado de um CDN para resolver o problema de dependência.
import { Draggable } from 'https://esm.sh/react-beautiful-dnd@13.1.1';
// CORREÇÃO: O caminho para o ficheiro supabaseClient foi ajustado para usar o alias do projeto.
import { marcarNegocioComoGanho, marcarNegocioComoPerdido } from '@/supabaseClient.js';

// --- Estilos para o componente (pode mover para um ficheiro CSS) ---

const cardStyles = {
  userSelect: 'none',
  padding: '16px',
  margin: '0 0 8px 0',
  minHeight: '50px',
  backgroundColor: '#fff',
  color: '#4d4d4d',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  display: 'flex',
  flexDirection: 'column',
};

const cardFooterStyles = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
  borderTop: '1px solid #eee',
  paddingTop: '8px',
};

const buttonStyles = {
  border: 'none',
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  color: 'white',
};

const winButtonStyles = { ...buttonStyles, backgroundColor: '#28a745' };
const loseButtonStyles = { ...buttonStyles, backgroundColor: '#dc3545' };

// --- Estilos para o Modal (pode criar um componente de Modal reutilizável) ---

const modalOverlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyles = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
};

const modalButtonContainerStyles = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '20px',
};

// --- Componente Principal ---

// onNegocioUpdate é a função que virá do CrmBoard.jsx para atualizar a UI
function NegocioCard({ negocio, index, onNegocioUpdate }) {
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para lidar com o clique em "Ganhou"
  const handleGanhouClick = async () => {
    // Usamos um confirm simples por agora, mas pode ser substituído por um modal mais elegante
    if (window.confirm(`Tem a certeza que quer marcar o negócio "${negocio.titulo}" como GANHO?`)) {
      const { error } = await marcarNegocioComoGanho(negocio.id);
      if (error) {
        // Usamos console.error para logs de erro, que é uma prática melhor
        console.error('Erro ao marcar negócio como ganho:', error);
        alert('Erro ao marcar negócio como ganho: ' + error.message);
      } else {
        alert('Negócio marcado como ganho com sucesso!');
        onNegocioUpdate(negocio.id); // Avisa o CrmBoard para remover o card da vista
      }
    }
  };

  // Função para submeter o motivo da perda
  const handleSubmitPerda = async (e) => {
    e.preventDefault();
    if (!motivoPerda.trim()) {
      alert('Por favor, preencha o motivo da perda.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await marcarNegocioComoPerdido(negocio.id, motivoPerda);

    if (error) {
      console.error('Erro ao marcar negócio como perdido:', error);
      alert('Erro ao marcar negócio como perdido: ' + error.message);
    } else {
      alert('Negócio marcado como perdido.');
      onNegocioUpdate(negocio.id); // Avisa o CrmBoard para remover o card
    }

    // Limpeza após submissão
    setIsSubmitting(false);
    setIsLostModalOpen(false);
    setMotivoPerda('');
  };

  return (
    <>
      <Draggable draggableId={String(negocio.id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...cardStyles,
              backgroundColor: snapshot.isDragging ? '#e6f7ff' : '#fff',
              ...provided.draggableProps.style,
            }}
          >
            <h4 style={{ margin: '0 0 8px 0' }}>{negocio.titulo}</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>{negocio.empresa_contato || 'Empresa não informada'}</p>
            {/* Pode adicionar mais detalhes do negócio aqui */}
            
            <div style={cardFooterStyles}>
              <button onClick={handleGanhouClick} style={winButtonStyles}>Ganhou</button>
              <button onClick={() => setIsLostModalOpen(true)} style={loseButtonStyles}>Perdeu</button>
            </div>
          </div>
        )}
      </Draggable>

      {/* --- Modal para Motivo da Perda --- */}
      {isLostModalOpen && (
        <div style={modalOverlayStyles}>
          <div style={modalContentStyles}>
            <h3>Perdeu o Negócio "{negocio.titulo}"?</h3>
            <p>Descreva o motivo da perda. Esta informação é importante para futuras estratégias.</p>
            <form onSubmit={handleSubmitPerda}>
              <textarea
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                placeholder="Ex: Preço muito alto, concorrência ofereceu mais vantagens, etc."
                rows="4"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
              <div style={modalButtonContainerStyles}>
                <button type="button" onClick={() => setIsLostModalOpen(false)} style={{...buttonStyles, backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{...buttonStyles, backgroundColor: '#007bff'}}>
                  {isSubmitting ? 'A Guardar...' : 'Confirmar Perda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default NegocioCard;