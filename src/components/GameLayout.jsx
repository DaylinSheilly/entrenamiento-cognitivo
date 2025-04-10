// src/components/GameLayout.js (frontend)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GameContainer from './GameContainer';
import InfoPanel from './InfoPanel';
import './GameLayout.css';

const GameLayout = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(true); // Para evitar actualizaciones en componentes desmontados

  // Verificar sesión existente al cargar el juego
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem("neurogames_token");
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/sessions/active', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.id_session && isMounted) {
          setSessionId(response.data.id_session);
        }
      } catch (error) {
        console.error("Error al verificar sesión activa:", error);
      }
    };

    checkExistingSession();
    return () => setIsMounted(false);
  }, [navigate, isMounted]);

  // Función para manejar el final del juego
  const handleGameEnd = async (gameData) => {
    try {
      const token = localStorage.getItem("neurogames_token");
      if (!token) {
        navigate('/login');
        return;
      }

      let currentSession = sessionId;
      
      // Crear sesión solo si no existe
      if (!currentSession) {
        const sessionResponse = await axios.post(
          'http://localhost:5000/sessions/start',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        currentSession = sessionResponse.data.id_session;
        setSessionId(currentSession);
      }

      // Registrar el juego
      await axios.post(
        'http://localhost:5000/games/create',
        { ...gameData, session_id: currentSession }, // Agrega session_id
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Juego registrado correctamente:", gameData, currentSession);

      // Actualizar métricas de sesión
      await axios.patch(
        `http://localhost:5000/sessions/${currentSession}/update`,
        { games_played: 1 }, // Incrementar contador de juegos
        { headers: { Authorization: `Bearer ${token}` } }
      );

    } catch (error) {
      console.error("Error al registrar el juego:", error);
      alert(error.response?.data?.errors?.map(e => e.msg).join(', ') || 'Error desconocido');
    }
  };

  // Pasar la función a los componentes hijos
  const childrenWithProps = React.Children.map(children, child => {
    return React.cloneElement(child, { onGameEnd: handleGameEnd });
  });

  return (
    <div className="game-layout">
      <GameContainer>
        {childrenWithProps}
      </GameContainer>
      <InfoPanel/>
    </div>
  );
};

export default GameLayout;
