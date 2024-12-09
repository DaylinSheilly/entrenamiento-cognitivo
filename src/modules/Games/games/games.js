// games.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './games.css'; // Estilos específicos para los botones

function Games() {
  const navigate = useNavigate();

  return (
    <div className='games-body'>
      <div className="games-container">
        <h1 className="games-container-title">Elige un Juego</h1>
        <div className="games-buttons-container">
          <games-button className="games-button" onClick={() => navigate('/games/matriz-de-memoria')}>Matriz de Memoria</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/sigue-la-secuencia')}>Sigue la Secuencia</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/recuerda-los-objetos')}>Recuerda los Objetos</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/concentrate-en-el-objetivo')}>Concentrate en el Objetivo</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/no-pierdas-los-objetos')}>No Pierdas los Objetos</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/sopa-de-letras')}>Sopa de Letras</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/a-fin')}>A Fin</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/comparacion-de-colores')}>Comparación de Colores</games-button>
          <games-button className="games-button" onClick={() => navigate('/games/juego-de-atencion')}>Juego de Atención</games-button>
          {/* Añadir botones para otros juegos */}
        </div>
      </div>
    </div>
  );
}

export default Games;