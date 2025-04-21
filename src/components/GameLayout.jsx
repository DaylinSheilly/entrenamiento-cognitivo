import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar sesión y autenticación
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/sessions/active', {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        setSessionId(response.data.id_session);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("No hay sesión activa, se creará una nueva al jugar");
        } else {
          setError("Error al cargar la sesión de juego");
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [isAuthenticated, navigate, user]);

  // Manejar final del juego
  const handleGameEnd = async (gameData) => {
    try {
      setLoading(true);
      let currentSession = sessionId;

      if (!currentSession) {
        const sessionResponse = await axios.post(
          'http://localhost:5000/sessions/start',
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        currentSession = sessionResponse.data.id_session;
        setSessionId(currentSession);
      }

      await axios.post(
        'http://localhost:5000/games/create',
        { ...gameData, session_id: currentSession },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      await axios.patch(
        `http://localhost:5000/sessions/${currentSession}/update`,
        { games_played: 1 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

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
    <Box sx={{ 
      minHeight: '100vh',
      p: 4,
      background: theme.palette.background.default
    }}>
      <Grid container spacing={3}>
        {/* Panel de juego */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={6}
            sx={{
              p: 4,
              minHeight: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {childrenWithProps}
            
            {loading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
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
