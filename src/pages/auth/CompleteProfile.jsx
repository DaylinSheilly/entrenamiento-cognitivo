import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, TextField, Typography, Alert, Paper,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";

const CompleteProfile = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    fecha_nacimiento: "",
    correo_electronico: "",
    genero: "",
    nivel_educativo: "",
    pais: ""
  });
  const [error, setError] = useState("");

  // Opciones para los dropdowns
  const nivelesEducativos = [
    { value: "Ninguno", label: "Sin estudios formales" },
    { value: "Primaria", label: "Educación Primaria" },
    { value: "Secundaria", label: "Educación Secundaria/Bachillerato" },
    { value: "Tecnico", label: "Formación Técnica/Tecnológica" },
    { value: "Universitario", label: "Educación Universitaria" },
    { value: "Postgrado", label: "Postgrado/Especialización" },
    { value: "Maestria", label: "Maestría" },
    { value: "Doctorado", label: "Doctorado" }
  ];

  const paises = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
    "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras",
    "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
    "República Dominicana", "Uruguay", "Venezuela", "Otro"
  ];

  // Géneros disponibles
  const generos = ["Masculino", "Femenino", "No binario", "Prefiero no decir"];

  useEffect(() => {
    const checkUserProfile = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const token = await getAccessTokenSilently();
          const response = await axios.get('http://localhost:5000/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.profile_complete) {
            navigate('/home');
          }
        } catch (error) {
          if (error.response?.status !== 404) {
            setError("Error al verificar perfil");
          }
          // Si es 404, el usuario no existe, así que debe completar el perfil
        } finally {
          setLoading(false);
        }
      }
    };
    checkUserProfile();
  }, [isAuthenticated, getAccessTokenSilently, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const token = await getAccessTokenSilently();
      const payload = {
        ...formData,
        fecha_nacimiento: new Date(formData.fecha_nacimiento).toISOString(),
      };
      await axios.post(
        'http://localhost:5000/auth/profile',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      navigate('/home');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Error al guardar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: "100%" }}>
        <Typography variant="h5" gutterBottom align="center">
          Completa tu perfil
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre de usuario"
            name="nombre_usuario"
            value={formData.nombre_usuario}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Correo electrónico"
            name="correo_electronico"
            type="email"
            value={formData.correo_electronico}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Fecha de nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="genero-label">Género</InputLabel>
            <Select
              labelId="genero-label"
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              label="Género"
            >
              {generos.map((genero) => (
                <MenuItem key={genero} value={genero}>
                  {genero}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="nivel-educativo-label">Nivel educativo</InputLabel>
            <Select
              labelId="nivel-educativo-label"
              name="nivel_educativo"
              value={formData.nivel_educativo}
              onChange={handleChange}
              label="Nivel educativo"
            >
              {nivelesEducativos.map((nivel) => (
                <MenuItem key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="pais-label">País</InputLabel>
            <Select
              labelId="pais-label"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              label="País"
            >
              {paises.map((pais) => (
                <MenuItem key={pais} value={pais}>
                  {pais}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            Guardar perfil
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CompleteProfile;
