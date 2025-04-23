import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import InfoPanel from './InfoPanel';

const GameLayout = ({ children }) => {
  const { isAuthenticated, user, token } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar sesión y autenticación
  useEffect(() => {
    if (!isAuthenticated) return; // Solo verifica autenticación

    const checkSession = async () => {
      try {
        setLoading(false);
      } catch (error) {
        setError("Error de conexión");
      }
    };

    checkSession();
  }, [isAuthenticated]); // Solo depende de isAuthenticated

  // Manejar final del juego
  const handleGameEnd = async (gameData) => {
    if (!token) { // <--- Cambia aquí
      setError("No hay token de autenticación");
      return;
    }
    try {
      setLoading(true);
      let currentSession = sessionId;
  
      if (!currentSession) {
        const sessionResponse = await axios.post(
          'http://localhost:5000/sessions/start',
          {},
          { headers: { Authorization: `Bearer ${token}` } } // <--- Cambia aquí
        );
        currentSession = sessionResponse.data.id_session;
        setSessionId(currentSession);
        console.log("Sesión iniciada:", currentSession);
      }
  
      await axios.post(
        'http://localhost:5000/games/create',
        { ...gameData, session_id: currentSession },
        { headers: { Authorization: `Bearer ${token}` } } // <--- Cambia aquí
      );
      console.log("Datos del juego guardados:");
  
      await axios.patch(
        `http://localhost:5000/sessions/${currentSession}/update`,
        { games_played: 1 },
        { headers: { Authorization: `Bearer ${token}` } } // <--- Cambia aquí
      );
      console.log("Sesión actualizada:", currentSession);
  
    } catch (error) {
      setError(error.response?.data?.message || "Error al guardar los resultados");
    } finally {
      setLoading(false);
    }
  };

  // Pasar props a los hijos
  const childrenWithProps = React.Children.map(children, child => {
    return React.cloneElement(child, {
      onGameEnd: handleGameEnd,
      disabled: loading
    });
  });

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '93.34vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
      }}
    >
      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Panel de juego */}
        <Grid
          item
          xs={12}
          md={8}
          display="flex"
          alignItems="center"
          justifyContent="center">
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 700,
              minHeight: { xs: 300, md: 400 }, // Ajusta según tu contenido
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {childrenWithProps}

            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress />
              </Box>
            )}
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
