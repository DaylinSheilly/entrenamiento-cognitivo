/*import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link
} from "@mui/material";
import { 
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff,
  Email
} from "@mui/icons-material";

const Login = () => {
  const [formData, setFormData] = useState({
    correo_electronico: "",
    contraseña: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/auth/login", formData);
      
      if (response.data.token) {
        // Verificar que todos los campos necesarios estén presentes
        const userData = response.data.user;
        const requiredFields = [
          'id_usuario', 'nombre_usuario', 'correo_electronico', 
          'fecha_registro', 'estado_cuenta', 'edad', 
          'fecha_nacimiento', 'genero', 'nivel_educativo', 
          'pais', 'ultima_sesion'
        ];
        
        // Validación opcional de campos
        const missingFields = requiredFields.filter(field => !userData.hasOwnProperty(field));
        if (missingFields.length > 0) {
          console.warn("Campos faltantes en datos de usuario:", missingFields);
        }
        
        // Actualizar estado de autenticación con todos los datos
        login(response.data.token, userData);
        setMessage("Inicio de sesión exitoso");
        setMessageType("success");
        setTimeout(() => navigate("/home"), 2000);
      } else {
        setMessage("Error: No se recibió el token");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error desconocido en el servidor");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: "100%", borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Iniciar sesión
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Correo electrónico"
              name="correo_electronico"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.correo_electronico}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="contraseña"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.contraseña}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
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
            {message && (
              <Alert severity={messageType} sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2, py: 1.2, fontSize: "1rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Ingresando...
                </>
              ) : "Ingresar"}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Link 
                href="/register" 
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                ¿No tienes cuenta? Regístrate aquí
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
*/