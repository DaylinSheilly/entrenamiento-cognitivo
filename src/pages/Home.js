import React from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  Button,
  Paper,
  Avatar
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, logout } = useAuth();

  const handleLogout = async () => {
    try {
      if (isAuthenticated && user && token) {
        try {
          await axios.put('http://localhost:5000/sessions/end', {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000 // Timeout de 3 segundos para evitar bloqueos
          });
        } catch (error) {
          // No generar error si no hay sesión activa (404)
          if (error.response?.status !== 404) {
            console.error("Error en cierre de sesión:", error);
          }
        }
      }
    } finally {
      // Siempre ejecutar limpieza
      logout();
      navigate("/home");
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

          {isAuthenticated && user ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                {user.nombre_usuario}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                <strong>Correo:</strong> {user.correo_electronico}
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                Miembro desde: {new Date(user.fecha_registro).toLocaleDateString('es-ES')}
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
                  onClick={() => navigate('/register')}
                >
                  Crear cuenta
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/login')}
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
