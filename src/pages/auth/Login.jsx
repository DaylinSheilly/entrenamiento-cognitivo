import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Login = () => {
  const [formData, setFormData] = useState({
    correo_electronico: "",
    contraseña: "",
  });

  const [message, setMessage] = useState(""); // Estado para mensajes de error/éxito
  const [messageType, setMessageType] = useState(""); // "success" o "error"

  const navigate = useNavigate(); // Hook de navegación

  // Manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Limpiar mensaje anterior

    try {
      // Llamada al backend para iniciar sesión
      const response = await axios.post("http://localhost:5000/auth/login", formData);

      if (response.data.token) {
        localStorage.setItem("neurogames_token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        setMessage("Inicio de sesión exitoso");
        setMessageType("success");
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMessage("Error: No se recibió el token");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error desconocido en el servidor");
      setMessageType("error");
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
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="contraseña"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={formData.contraseña}
              onChange={handleChange}
            />
            {message && (
              <Alert severity={messageType === "success" ? "success" : "error"} sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
            >
              Ingresar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
