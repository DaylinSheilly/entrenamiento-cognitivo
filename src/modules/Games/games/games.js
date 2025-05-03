import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth0 } from "@auth0/auth0-react";
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Lista de juegos con sus rutas
const gamesList = [
  { name: "Matriz de Memoria", path: "/games/matriz-de-memoria" },
  { name: "Sigue la Secuencia", path: "/games/sigue-la-secuencia" },
  { name: "Recuerda los Objetos", path: "/games/recuerda-los-objetos" },
  { name: "Concentrate en el Objetivo", path: "/games/concentrarse-en-el-objetivo" },
  { name: "No Pierdas los Objetos", path: "/games/no-pierdas-los-objetos" },
  { name: "Mira la dirección", path: "/games/mira-la-direccion" },
  { name: "¿Qué sentido tiene?", path: "/games/que-sentido-tiene" },
  { name: "¡Apunta y acierta!", path: "/games/apunta-acierta" },
  { name: "Construye la Tubería", path: "/games/construye-la-tuberia" },
  { name: "Colorea el camino", path: "/games/colorea-el-camino" },
  { name: "Sopa de Letras", path: "/games/sopa-de-letras" },
  { name: "A Fin", path: "/games/a-fin" },
  { name: "Comparación de Colores", path: "/games/comparacion-de-colores" },
  { name: "Juego de Atención", path: "/games/juego-de-atencion" },
];

function Games() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect
  } = useAuth0(); // Nuevo hook de Auth0
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartGame = async (path) => {
    if (!isAuthenticated) {
      loginWithRedirect(); // Redirección con Auth0
      return;
    }

    try {
      setLoading(true);
      navigate(path);
    } catch (error) {
      setError("Error al iniciar el juego");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        height: '100vh',
        alignItems: 'center'
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      p: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper elevation={6} sx={{
        p: 4,
        width: '100%',
        maxWidth: 1200,
        borderRadius: 4,
        boxShadow: 6
      }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 4,
            color: 'primary.main',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <SportsEsportsIcon fontSize="large" />
          Catálogo de Juegos
        </Typography>

        <Grid container spacing={3}>
          {gamesList.map((game, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => handleStartGame(game.path)}
                disabled={loading}
                sx={{
                  py: 3,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'text.disabled'
                  }
                }}
              >
                {game.name}
              </Button>
            </Grid>
          ))}
        </Grid>

        {loading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4
          }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
}

export default Games;
