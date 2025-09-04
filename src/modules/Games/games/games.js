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
  const [maxScores, setMaxScores] = useState({});
  const [sortedDomains, setSortedDomains] = useState([]);
  const [hoveredGame, setHoveredGame] = useState(null);

  useEffect(() => {
    const fetchGameStats = async () => {
      if (!isAuthenticated) return;
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: "https://api.neurosite.com" }
        });
        // Obtener máximo puntaje por juego
        const maxScoresResponse = await axios.get('http://localhost:5000/games/max-scores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const maxScoresData = maxScoresResponse.data.reduce((acc, item) => {
          acc[item.game_name] = item.max_score;
          return acc;
        }, {});
        setMaxScores(maxScoresData);
        // Obtener conteo de partidas por juego
        const playsResponse = await axios.get('http://localhost:5000/games/plays-by-game', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlaysByGame(playsResponse.data);
      } catch (error) {
        console.error('Error fetching game stats:', error);
      }
    };
    fetchGameStats();
  }, [isAuthenticated, getAccessTokenSilently]);

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
              {group.games.map((game) => {
                const isHovered = hoveredGame === game.name;
                return (
                  <Grid item xs={12} sm={6} md={4} key={game.name} sx={{ position: 'relative' }}>
                    <Box
                      onMouseEnter={() => setHoveredGame(game.name)}
                      onMouseLeave={() => setHoveredGame(null)}
                      sx={{
                        width: isHovered ? 400 : 220, // mismo ancho que la tarjeta expandida
                        height: 0,
                        paddingBottom: isHovered ? '50%' : '100%', // mismo alto que la tarjeta expandida
                        position: 'relative',
                        transition: 'width 0.3s, padding-bottom 0.3s',
                        zIndex: isHovered ? 1301 : 1,
                      }}
                    >
                      {/* Placeholder invisible solo cuando expandido */}
                      {isHovered && (
                        <Box sx={{
                          width: 220,
                          height: 0,
                          paddingBottom: '100%',
                          visibility: 'hidden',
                          pointerEvents: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }} />
                      )}
                      {/* Tarjeta real, normal o expandida */}
                      <Box
                        className="game-card"
                        sx={{
                          width: isHovered ? 676.6 : 220,
                          minWidth: 140,
                          maxWidth: 580,
                          height: isHovered ? 406 : 220, // o el alto que prefieras
                          position: 'relative',
                          boxShadow: 4,
                          borderRadius: 3,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'stretch',
                          background: '#fff',
                          transition: 'width 0.3s, height 0.3s, box-shadow 0.3s',
                          zIndex: isHovered ? 1301 : 1,
                        }}
                        onClick={() => handleStartGame(game.path)}
                      >
                        {/* Imagen */}
                        <Box
                          sx={{
                            width: isHovered ? '60%' : 220, // cambia el ancho, no el scale
                            height: isHovered ? '100%' : 220,
                            backgroundImage: `url(${game.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 0,
                            transition: 'width 0.3s',
                            minWidth: 0,
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'flex-end',
                          }}
                        >
                          <Box
                            className="game-card-overlay"
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.18)',
                              zIndex: 3,
                              transition: 'background 0.2s',
                            }}
                          />
                          {/* Texto sobre imagen solo si NO está en hover */}
                          {!isHovered && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: '100%',
                                background: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                py: 2,
                                px: 0,
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                letterSpacing: '1px',
                                textAlign: 'center',
                                textShadow: '1px 1px 4px #222',
                                zIndex: 4,
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
                                  {playsByGame[game.name]} partidas
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                        {/* Panel lateral visible solo en hover */}
                        {isHovered && (
                          <Box
                            sx={{
                              flex: '1 1 0%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'flex-start',
                              bgcolor: 'rgba(255,255,255,0.98)',
                              px: 3,
                              py: 2,
                              minWidth: 140,
                              maxWidth: 220,
                              height: '100%',
                              position: 'relative',
                              zIndex: 5,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: 'primary.dark',
                                fontWeight: 700,
                                mb: 1,
                                textAlign: 'center',
                                width: '100%',
                                whiteSpace: 'normal',
                              }}
                            >
                              {game.name}
                            </Typography>
                            {playsByGame[game.name] > 0 && (
                              <Box sx={{ width: '100%', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
                                  Partidas jugadas:
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333' }}>
                                  {playsByGame[game.name]}
                                </Typography>
                              </Box>
                            )}

                            {/* Máximo puntaje */}
                            {maxScores[game.name] && (
                              <Box sx={{ width: '100%', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
                                  Récord personal:
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: '#2e7d32',
                                    fontWeight: 700,
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {maxScores[game.name]} pts
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
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
