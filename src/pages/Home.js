// Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Importación del archivo CSS

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Bienvenido a la Plataforma de Juegos</h1>
      <div className="home-buttons">
        <button onClick={() => navigate('/games')}>Games</button>
        <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>
    </div>
  );
}

export default Home;