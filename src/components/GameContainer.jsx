// src/components/GameContainer.js
import React from 'react';
import './GameContainer.css';

const GameContainer = ({ children }) => {
  return (
    <div className="compo-game-container">
      {children}
    </div>
  );
};

export default GameContainer;
