// src/components/GameLayout.js
import React from 'react';
import GameContainer from './GameContainer';
import InfoPanel from './InfoPanel';
import './GameLayout.css';

const GameLayout = ({ children }) => {
  return (
    <div className="game-layout">
      <GameContainer>
        {children}
      </GameContainer>
      <InfoPanel />
    </div>
  );
};

export default GameLayout;
