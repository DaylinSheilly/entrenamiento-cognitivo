import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Button, Grid, Typography, Paper, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useAuth0 } from "@auth0/auth0-react";
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Listado base de juegos por dominio
const gamesByDomain = [
  {
    domain: "Memoria",
    games: [
      { name: "Matriz de memoria", path: "/games/matriz-de-memoria" },
      { name: "Sigue la secuencia", path: "/games/sigue-la-secuencia" },
      { name: "Recuerda los objetos", path: "/games/recuerda-los-objetos" },
    ]
  },
  {
    domain: "Atención",
    games: [
      { name: "Concéntrate en el objetivo", path: "/games/concentrate-en-objetivo" },
      { name: "No pierdas los objetos", path: "/games/no-pierdas-los-objetos" },
      { name: "Observa y compara", path: "/games/observa-y-compara" },
    ]
  },
  {
    domain: "Funciones ejecutivas",
    games: [
      { name: "Comparación de colores", path: "/games/comparacion-de-colores" },
      { name: "Color y acción", path: "/games/color-y-accion" },
      { name: "Mira la dirección", path: "/games/mira-la-direccion" },
    ]
  },
  {
    domain: "Lenguaje",
    games: [
      { name: "Sopa de letras", path: "/games/sopa-de-letras" },
      { name: "A fin", path: "/games/a-fin" },
      { name: "¿Qué sentido tiene?", path: "/games/que-sentido-tiene" },
    ]
  },
  {
    domain: "Habilidades visoconstructivas",
    games: [
      { name: "Apunta y Acierta", path: "/games/apunta-acierta" },
      { name: "Construye la cañería", path: "/games/construye-la-tuberia" },
      { name: "Colorea el camino", path: "/games/colorea-el-camino" },
    ]
  },
];

function Games() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playsByGame, setPlaysByGame] = useState(null);
  const [sortedDomains, setSortedDomains] = useState([]);

  // Cargar conteo de juegos solo si está autenticado
  useEffect(() => {
    const fetchPlayCounts = async () => {
      if (!isAuthenticated) {
        setSortedDomains(gamesByDomain); // Muestra listado por defecto
        return;
      }
      try {
        setLoading(true);
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://api.neurosite.com"
          }
        });
        const response = await axios.get('http://localhost:5000/games/plays-by-game', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlaysByGame(response.data);

        // Ordenar dominios y juegos basado en conteos
        const orderedDomains = [...gamesByDomain].map(domain => {
          // Ordenar juegos dentro del dominio
          const sortedGames = [...domain.games].sort((a, b) =>
            (response.data[b.name] || 0) - (response.data[a.name] || 0)
          );
          // Calcular total de juegos por dominio
          const totalPlays = sortedGames.reduce((sum, game) =>
            sum + (response.data[game.name] || 0), 0
          );
          return { ...domain, games: sortedGames, totalPlays };
        });
        // Ordenar dominios por total de juegos
        orderedDomains.sort((a, b) => b.totalPlays - a.totalPlays);
        setSortedDomains(orderedDomains);
      } catch (err) {
        setSortedDomains(gamesByDomain);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayCounts();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Botón de jugar: si no autenticado, redirige a login
  const handleStartGame = (path) => {
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/games" } });
      return;
    }
    setLoading(true);
    navigate(path);
    setLoading(false);
  };

  if (isLoading || loading || !sortedDomains.length) {
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

        {sortedDomains.map((group, idx) => (
          <Box key={group.domain} sx={{ mb: 5 }}>
            <Typography
              variant="h5"
              sx={{
                color: 'primary.dark',
                fontWeight: 600,
                mb: 2,
                mt: idx === 0 ? 0 : 4,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {group.domain}
            </Typography>
            <Grid container spacing={3}>
              {group.games.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.name}>
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
                    {isAuthenticated && playsByGame && playsByGame[game.name] > 0 && (
                      <Typography
                        component="span"
                        sx={{ ml: 1, fontSize: '0.8rem', opacity: 0.8 }}
                      >
                        ({playsByGame[game.name]})
                      </Typography>
                    )}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

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
