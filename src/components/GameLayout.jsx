import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import InfoPanel from './InfoPanel';

const GameLayout = ({ children }) => {
  const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Espera a que termine la verificación
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  // Manejar final del juego
  const handleGameEnd = async (gameData) => {
    console.log("[handleGameEnd] Iniciando proceso de fin de juego");
    
    if (!isAuthenticated) {
      console.error("[handleGameEnd] Usuario no autenticado, abortando");
      setError("No autenticado");
      return;
    }
  
    try {
      const token = await getAccessTokenSilently();
  
      let currentSession = sessionId;
  
      if (!currentSession) {
        console.log("[handleGameEnd] No hay sesión activa, creando nueva...");
        try {
          const sessionResponse = await axios.post(
            'http://localhost:5000/sessions/start',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          currentSession = sessionResponse.data.id_session;
          setSessionId(currentSession);
        } catch (error) {
          if (error.response?.status === 409 && error.response.data.sessionId) {
            console.log("[handleGameEnd] Sesión existente recuperada (409 Conflict)");
            currentSession = error.response.data.sessionId;
            setSessionId(currentSession);
          } else {
            console.error("[handleGameEnd] Error creando sesión:", error);
            throw error;
          }
        }
      }
  
      console.log("[handleGameEnd] Guardando datos del juego...");
      const gameResponse = await axios.post(
        'http://localhost:5000/games/create',
        { ...gameData, session_id: currentSession },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("[handleGameEnd] Actualizando sesión...");
      await axios.patch(
        `http://localhost:5000/sessions/${currentSession}/update`,
        { games_played: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[handleGameEnd] Sesión actualizada correctamente");
  
    } catch (error) {
      console.error("[handleGameEnd] Error general:", error);
      
      if (error.response) {
        console.error("[handleGameEnd] Detalles error:", {
          status: error.response.status,
          data: error.response.data
        });
      }
  
      if (error.response?.status === 403) {
        console.log("[handleGameEnd] Redirigiendo a login...");
        navigate('/login');
      } else {
        const errorMsg = error.response?.data?.message || "Error al guardar los resultados";
        console.error(`[handleGameEnd] Error manejado: ${errorMsg}`);
        setError(errorMsg);
      }
    }
  };

  // Pasar props a los hijos
  const childrenWithProps = React.Children.map(children, child => {
    return React.cloneElement(child, {
      onGameEnd: handleGameEnd,
    });
  });

  return (
    <Box
      sx={{
        minHeight: '93.34vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        position: 'relative' // <-- Añade esto
      }}
    >
      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Panel de juego (siempre renderizado) */}
        <Grid
          item
          xs={12}
          md={8}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 700,
              minHeight: { xs: 300, md: 400 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {childrenWithProps}
          </Paper>
        </Grid>

        {/* Panel informativo */}
        <Grid item xs={12} md={4}>
          <InfoPanel sessionId={sessionId} />
        </Grid>
      </Grid>

      {/* Notificaciones de error */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GameLayout;