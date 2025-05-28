import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Grid, Typography, Paper, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useAuth0 } from "@auth0/auth0-react";
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

import matrizImg from './assets/matriz-de-memoria.png';
import sigueImg from './assets/sigue-la-secuencia.png';
import recuerdaImg from './assets/recuerda-objetos.png';

import concentrateImg from './assets/concentrate-en-objetivo.png';
import noPierdasImg from './assets/no-pierdas-objetos.png';
import observaImg from './assets/observa-y-compara.png';

import comparacionImg from './assets/comparacion-de-colores.png';
import colorAccionImg from './assets/color-accion.png';
import miraDireccionImg from './assets/mira-la-direccion.png';

import sopaImg from './assets/sopa-de-letras.png';
import afinImg from './assets/a-fin.png';
import sentidoImg from './assets/que-sentido-tiene.png';

import apuntaImg from './assets/apunta-acierta.png';
import caneriaImg from './assets/construye-la-cañeria.png';
import coloreaImg from './assets/colorea-el-camino.png';

// Listado base de juegos por dominio con imágenes
const gamesByDomain = [
  {
    domain: "Memoria",
    games: [
      {
        name: "Matriz de memoria",
        path: "/games/matriz-de-memoria",
        image: matrizImg
      },
      {
        name: "Sigue la secuencia",
        path: "/games/sigue-la-secuencia",
        image: sigueImg
      },
      {
        name: "Recuerda los objetos",
        path: "/games/recuerda-los-objetos",
        image: recuerdaImg
      },
    ]
  },
  {
    domain: "Atención",
    games: [
      {
        name: "Concéntrate en el objetivo",
        path: "/games/concentrate-en-objetivo",
        image: concentrateImg
      },
      {
        name: "No pierdas los objetos",
        path: "/games/no-pierdas-los-objetos",
        image: noPierdasImg
      },
      {
        name: "Observa y compara",
        path: "/games/observa-y-compara",
        image: observaImg
      },
    ]
  },
  {
    domain: "Funciones ejecutivas",
    games: [
      {
        name: "Comparación de colores",
        path: "/games/comparacion-de-colores",
        image: comparacionImg
      },
      {
        name: "Color y acción",
        path: "/games/color-y-accion",
        image: colorAccionImg
      },
      {
        name: "Mira la dirección",
        path: "/games/mira-la-direccion",
        image: miraDireccionImg
      },
    ]
  },
  {
    domain: "Lenguaje",
    games: [
      {
        name: "Sopa de letras",
        path: "/games/sopa-de-letras",
        image: sopaImg
      },
      {
        name: "A fin",
        path: "/games/a-fin",
        image: afinImg
      },
      {
        name: "¿Qué sentido tiene?",
        path: "/games/que-sentido-tiene",
        image: sentidoImg
      },
    ]
  },
  {
    domain: "Habilidades visoconstructivas",
    games: [
      {
        name: "Apunta y acierta",
        path: "/games/apunta-acierta",
        image: apuntaImg
      },
      {
        name: "Construye la cañería",
        path: "/games/construye-la-tuberia",
        image: caneriaImg
      },
      {
        name: "Colorea el camino",
        path: "/games/colorea-el-camino",
        image: coloreaImg
      },
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
        setSortedDomains(gamesByDomain);
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

        const orderedDomains = [...gamesByDomain].map(domain => {
          const sortedGames = [...domain.games].sort((a, b) =>
            (response.data[b.name] || 0) - (response.data[a.name] || 0)
          );
          const totalPlays = sortedGames.reduce((sum, game) =>
            sum + (response.data[game.name] || 0), 0
          );
          return { ...domain, games: sortedGames, totalPlays };
        });
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
                  <Box
                    className="game-card"
                    onClick={() => handleStartGame(game.path)}
                    sx={{
                      width: '100%',
                      maxWidth: 340,
                      minWidth: 200,
                      height: 0,
                      paddingBottom: '100%', // cuadrado responsivo
                      position: 'relative',
                      backgroundImage: `url(${game.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 3,
                      boxShadow: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 8,
                      }
                    }}
                  >
                    <Box
                      className="game-card-overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.18)',
                        zIndex: 1,
                        transition: 'background 0.2s',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width: '100%',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center', // <-- centra horizontalmente
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.55)',
                        color: '#fff',
                        py: 2,
                        px: 0,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        letterSpacing: '1px',
                        textAlign: 'center',
                        textShadow: '1px 1px 4px #222',
                        zIndex: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1.2,
                        mb: 0.5,
                        width: '100%',
                        textAlign: 'center',
                      }}>
                        {game.name}
                      </Typography>
                      {isAuthenticated && playsByGame && playsByGame[game.name] > 0 && (
                        <Typography variant="body2" sx={{
                          fontSize: '0.85rem',
                          opacity: 0.9,
                          textAlign: 'center',
                          width: '100%',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                        }}>
                          ({playsByGame[game.name]} partidas)
                        </Typography>
                      )}
                    </Box>
                  </Box>
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
