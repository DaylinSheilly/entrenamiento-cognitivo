import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth0 } from "@auth0/auth0-react"; // Nuevo import
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

function Home() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user: auth0User,
    logout,
    getAccessTokenSilently,
    loginWithRedirect
  } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Obtener datos del usuario desde tu backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const token = await getAccessTokenSilently();
          const response = await axios.get('http://localhost:5000/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(response.data);
        } catch (error) {
          console.error("Error obteniendo datos del usuario:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        await axios.put('http://localhost:5000/sessions/end', {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 3000
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error en cierre de sesión:", error);
      }
    } finally {
      // Logout de Auth0
      logout({
        logoutParams: {
          returnTo: window.location.origin + "/home"
        }
      });
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
    }}>
      <Paper elevation={6} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Avatar sx={{
            bgcolor: 'primary.main',
            width: 60,
            height: 60,
            mb: 2,
            mx: 'auto'
          }}>
            <SportsEsportsIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Bienvenido a NeuroSite
          </Typography>

          {loading ? (
            <Box sx={{ mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : isAuthenticated && userData ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                {userData.user_name}
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                Miembro desde: {new Date(userData.registration_date).toLocaleDateString('es-ES')}
              </Typography>

              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/games')}
                >
                  Jugar ahora
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Ver estadísticas
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 4 }}>
              <Typography variant="body1" paragraph>
                Únete a nuestra plataforma para mejorar tus habilidades cognitivas
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => loginWithRedirect({ screen_hint: "signup" })}
                >
                  Crear cuenta
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => loginWithRedirect()}
                >
                  Iniciar sesión
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Home;
