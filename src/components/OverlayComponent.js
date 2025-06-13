import React from 'react';
import Draggable from 'react-draggable';
import styled from 'styled-components';

const OverlayItem = styled.div`
  position: absolute;
  z-index: 100;
  cursor: move;
  border: ${props => props.active ? '2px dashed #000' : 'none'};
  padding: 5px;
  background: ${props => props.type === 'text' ? 'rgba(255,255,255,0.7)' : 'transparent'};
`;

const OverlayComponent = ({ overlay, active, onClick, onStop }) => {
  return (
    <Draggable
      defaultPosition={{ x: overlay.x, y: overlay.y }}
      onStop={onStop}
    >
      <OverlayItem
        active={active}
        type={overlay.type}
        onClick={onClick}
        style={{
          width: overlay.width,
          height: overlay.height,
        }}
      >
        {overlay.type === 'text' && overlay.content}
        {overlay.type === 'image' && (
          <img 
            src={overlay.content} 
            alt="overlay" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        )}
      </OverlayItem>
    </Draggable>
  );
};

export default OverlayComponent;