import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar,
  Grid,
  Link,
  LinearProgress,
  InputAdornment,
  IconButton
} from "@mui/material";
import {
  PersonAddAltOutlined,
  Visibility,
  VisibilityOff,
  Lock,
  Email,
  Person
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthBar from "react-password-strength-bar";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    correo_electronico: "",
    contraseña: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.nombre_usuario.trim()) {
      newErrors.nombre_usuario = "Nombre de usuario requerido";
    } else if (formData.nombre_usuario.length < 3) {
      newErrors.nombre_usuario = "Mínimo 3 caracteres";
    }

    if (!formData.correo_electronico) {
      newErrors.correo_electronico = "Email requerido";
    } else if (!emailRegex.test(formData.correo_electronico)) {
      newErrors.correo_electronico = "Email inválido";
    }

    if (!formData.contraseña) {
      newErrors.contraseña = "Contraseña requerida";
    } else if (formData.contraseña.length < 8) {
      newErrors.contraseña = "Mínimo 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/auth/register", formData);
      
      // Autologin después del registro
      const loginResponse = await axios.post("http://localhost:5000/auth/login", {
        correo_electronico: formData.correo_electronico,
        contraseña: formData.contraseña
      });

      login(loginResponse.data.token, loginResponse.data.user);
      setMessage("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => navigate("/games"), 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error en el servidor";
      setMessage(errorMessage);
      setErrors({
        server: errorMessage.includes("email") ? { correo_electronico: errorMessage } : 
                errorMessage.includes("usuario") ? { nombre_usuario: errorMessage } : 
                { general: errorMessage }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
      p: 2
    }}>
      <Paper elevation={6} sx={{ 
        p: 4, 
        width: "100%", 
        maxWidth: 500, 
        borderRadius: 3,
        position: "relative"
      }}>
        {loading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar sx={{ 
            bgcolor: "primary.main", 
            width: 56, 
            height: 56,
            mx: "auto",
            mb: 2
          }}>
            <PersonAddAltOutlined fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Crear Cuenta
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Comienza tu entrenamiento cognitivo hoy mismo
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={handleChange}
                error={!!errors.nombre_usuario}
                helperText={errors.nombre_usuario}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Correo electrónico"
                name="correo_electronico"
                type="email"
                value={formData.correo_electronico}
                onChange={handleChange}
                error={!!errors.correo_electronico}
                helperText={errors.correo_electronico}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña"
                name="contraseña"
                type={showPassword ? "text" : "password"}
                value={formData.contraseña}
                onChange={handleChange}
                error={!!errors.contraseña}
                helperText={errors.contraseña}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <PasswordStrengthBar 
                password={formData.contraseña} 
                style={{ marginTop: 8 }}
                scoreWords={['Débil', 'Débil', 'Regular', 'Buena', 'Fuerte']}
                shortScoreWord="Demasiado corta"
              />
            </Grid>
          </Grid>

          {message && (
            <Alert 
              severity={message.includes("éxito") ? "success" : "error"} 
              sx={{ mt: 3 }}
            >
              {message}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 700
            }}
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </Button>

          <Typography variant="body2" sx={{ 
            textAlign: "center", 
            mt: 2,
            color: "text.secondary"
          }}>
            ¿Ya tienes cuenta?{" "}
            <Link 
              component="button" 
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 600 }}
            >
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
