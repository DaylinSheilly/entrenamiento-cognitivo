// games.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './games.css';

function Games() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData"));

  const handleStartGame = async (rutaJuego) => {
    try {
      const token = localStorage.getItem("neurogames_token");
      if (!token) {
        alert("Debes iniciar sesión para jugar.");
        return;
      }

      // Crear sesión en backend
      const response = await axios.post('http://localhost:5000/sessions/start', {
        id_usuario: userData.id_usuario,
        id_juego: 3
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Guardar el id de la sesión creada en localStorage
      const sessionId = response.data.id_sesion;
      localStorage.setItem("id_sesion", sessionId);

      // Redirigir al juego
      navigate(rutaJuego);
    } catch (error) {
      console.error("Error al iniciar sesión de juego:", error);
      alert(error.response?.data?.message || "Error al iniciar el juego");
    }
  };

  return (
    <div className='games-body'>
      <div className="games-container">
        <h1 className="games-container-title">Elige un Juego</h1>
        <div className="games-buttons-container">
          <button onClick={() => handleStartGame('/games/matriz-de-memoria')}>Matriz de Memoria</button>
          <button onClick={() => handleStartGame('/games/sigue-la-secuencia')}>Sigue la Secuencia</button>
          <button onClick={() => handleStartGame('/games/recuerda-los-objetos')}>Recuerda los Objetos</button>
          <button onClick={() => handleStartGame('/games/concentrarse-en-el-objetivo')}>Concentrate en el Objetivo</button>
          <button onClick={() => handleStartGame('/games/no-pierdas-los-objetos')}>No Pierdas los Objetos</button>
          <button onClick={() => handleStartGame('/games/mira-la-direccion')}>Mira la dirección</button>
          <button onClick={() => handleStartGame('/games/que-sentido-tiene')}>¿Qué sentido tiene?</button>
          <button onClick={() => handleStartGame('/games/apunta-acierta')}>¡Apunta y acierta!</button>
          <button onClick={() => handleStartGame('/games/construye-la-tuberia')}>Construye la Tubería</button>
          <button onClick={() => handleStartGame('/games/colorea-el-camino')}>Colorea el camino</button>
          <button onClick={() => handleStartGame('/games/sopa-de-letras')}>Sopa de Letras</button>
          <button onClick={() => handleStartGame('/games/a-fin')}>A Fin</button>
          <button onClick={() => handleStartGame('/games/comparacion-de-colores')}>Comparación de Colores</button>
          <button onClick={() => handleStartGame('/games/juego-de-atencion')}>Juego de Atención</button>
          <button onClick={() => handleStartGame('/games/concentrate-en-objetivo')}>No es Concentrate en el Objetivo</button>
        </div>
      </div>
    </div>
  );
}

export default Games;
