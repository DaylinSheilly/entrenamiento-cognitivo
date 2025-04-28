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
  IconButton,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import {
  PersonAddAltOutlined,
  Visibility,
  VisibilityOff,
  Lock,
  Email,
  Person,
  School,
  Public,
  Wc,
  ArrowForward,
  ArrowBack
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthBar from "react-password-strength-bar";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    correo_electronico: "",
    contraseña: "",
    fecha_nacimiento: null,
    genero: "",
    nivel_educativo: "",
    pais: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const nivelesEducativos = [
    { value: "ninguno", label: "Sin estudios formales" },
    { value: "primaria", label: "Educación Primaria" },
    { value: "secundaria", label: "Educación Secundaria/Bachillerato" },
    { value: "tecnico", label: "Formación Técnica/Tecnológica" },
    { value: "universitario", label: "Educación Universitaria" },
    { value: "postgrado", label: "Postgrado/Especialización" },
    { value: "maestria", label: "Maestría" },
    { value: "doctorado", label: "Doctorado" }
  ];

  const paises = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
    "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras",
    "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
    "República Dominicana", "Uruguay", "Venezuela", "Otro"
  ];

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = "Fecha de nacimiento requerida";
    }

    if (!formData.genero) {
      newErrors.genero = "Género requerido";
    }

    if (!formData.nivel_educativo) {
      newErrors.nivel_educativo = "Nivel educativo requerido";
    }

    if (!formData.pais) {
      newErrors.pais = "País requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, fecha_nacimiento: date });
  };

  const handleNext = () => {
    if (validateStep1()) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Formato de fecha para enviar al servidor (YYYY-MM-DD)
      const formattedDate = formData.fecha_nacimiento.toISOString().split('T')[0];

      const dataToSend = {
        ...formData,
        fecha_nacimiento: formattedDate
      };

      const response = await axios.post("http://localhost:5000/auth/register", dataToSend);

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
        maxWidth: 550,
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

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Datos de acceso</StepLabel>
          </Step>
          <Step>
            <StepLabel>Datos personales</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 ? (
          <Box component="form" noValidate>
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

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={loading}
              endIcon={<ArrowForward />}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 700
              }}
            >
              Continuar
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleDateChange}
                    format="dd/MM/yyyy"
                    disableFuture
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fecha_nacimiento,
                        helperText: errors.fecha_nacimiento,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.genero}>
                  <InputLabel id="genero-label">Género</InputLabel>
                  <Select
                    labelId="genero-label"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <Wc color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                  {errors.genero && <FormHelperText>{errors.genero}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.nivel_educativo}>
                  <InputLabel id="nivel-educativo-label">Nivel educativo</InputLabel>
                  <Select
                    labelId="nivel-educativo-label"
                    name="nivel_educativo"
                    value={formData.nivel_educativo}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    }
                  >
                    {nivelesEducativos.map(nivel => (
                      <MenuItem key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.nivel_educativo && <FormHelperText>{errors.nivel_educativo}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.pais}>
                  <InputLabel id="pais-label">País</InputLabel>
                  <Select
                    labelId="pais-label"
                    name="pais"
                    value={formData.pais}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <Public color="action" />
                      </InputAdornment>
                    }
                  >
                    {paises.map(pais => (
                      <MenuItem key={pais} value={pais}>
                        {pais}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.pais && <FormHelperText>{errors.pais}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            {message && (
              <Alert
                severity={message.toLowerCase().includes("exitoso") ? "success" : "error"}
                sx={{ mt: 3 }}
              >
                {message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ px: 3 }}
              >
                Atrás
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 700
                }}
              >
                {loading ? "Registrando..." : "Completar registro"}
              </Button>
            </Box>
          </Box>
        )}

        <Typography variant="body2" sx={{
          textAlign: "center",
          mt: 4,
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
      </Paper>
    </Box>
  );
};

export default Register;
