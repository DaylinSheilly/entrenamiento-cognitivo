import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    CircularProgress,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useTheme } from '@mui/material/styles';
import { es } from 'date-fns/locale';

const PerfilUsuario = () => {
    const { user, token, logout } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const theme = useTheme();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Campos editables
    const camposEditables = {
        nombre_usuario: 'Nombre de usuario',
        fecha_nacimiento: 'Fecha de nacimiento',
        genero: 'Género',
        nivel_educativo: 'Nivel educativo',
        pais: 'País'
    };

    // Opciones para selects
    const opcionesGenero = ['Masculino', 'Femenino', 'Otro'];
    const opcionesNivelEducativo = [
        'Ninguno',
        'Primaria',
        'Secundaria',
        'Técnico',
        'Universitario',
        'Postgrado'
    ];
    const paises = [
        'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
        'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras',
        'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
        'República Dominicana', 'Uruguay', 'Venezuela'
    ];

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [perfilRes, progresoRes] = await Promise.all([
                    axios.get('http://localhost:5000/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5000/games/max-scores', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setFormData(perfilRes.data);
                setProgressData(progresoRes.data);
            } catch (error) {
                setError('Error al cargar los datos del usuario');
            } finally {
                setLoading(false);
                setStatsLoading(false);
            }
        };
        if (user) cargarDatos();
    }, [token, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                'http://localhost:5000/auth/update-profile',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditMode(false);
            setFormData(response.data.user);
        } catch (error) {
            setError(error.response?.data?.message || 'Error al actualizar el perfil');
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await axios.delete("http://localhost:5000/auth/delete", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConfirmOpen(false);
            logout();
            // Opcional: Redirige a landing page o login
            window.location.href = "/";
        } catch (error) {
            setConfirmOpen(false);
            alert(error.response?.data?.message || "Hubo un error al eliminar tu cuenta.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <LinearProgress />;

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <Typography color="primary" variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                Perfil de Usuario
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={4} alignItems="flex-start">
                {/* Columna izquierda: Información personal */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                            Información Personal
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3} direction="column">
                                {Object.entries(camposEditables).map(([campo, label]) => (
                                    <Grid item xs={12} key={campo}>
                                        {campo === 'fecha_nacimiento' ? (
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <DatePicker
                                                    label={label}
                                                    value={formData[campo] ? new Date(formData[campo]) : null}
                                                    onChange={() => { }}
                                                    disabled
                                                    renderInput={(params) =>
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            inputProps={{
                                                                ...params.inputProps,
                                                                readOnly: true,
                                                                tabIndex: -1,
                                                                style: { cursor: 'not-allowed', backgroundColor: '#f5f5f5' }
                                                            }}
                                                        />
                                                    }
                                                />
                                            </LocalizationProvider>
                                        ) : campo === 'genero' || campo === 'nivel_educativo' || campo === 'pais' ? (
                                            editMode ? (
                                                <FormControl fullWidth>
                                                    <InputLabel>{label}</InputLabel>
                                                    <Select
                                                        name={campo}
                                                        value={formData[campo] || ""}
                                                        onChange={handleChange}
                                                        label={label}
                                                    >
                                                        {(campo === 'genero'
                                                            ? opcionesGenero
                                                            : campo === 'nivel_educativo'
                                                                ? opcionesNivelEducativo
                                                                : paises).map(opcion => (
                                                                    <MenuItem key={opcion} value={opcion}>
                                                                        {opcion}
                                                                    </MenuItem>
                                                                ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <TextField
                                                    fullWidth
                                                    label={label}
                                                    value={formData[campo] || "No especificado"}
                                                    variant="filled"
                                                    InputProps={{ readOnly: true }}
                                                />
                                            )
                                        ) : (
                                            <TextField
                                                fullWidth
                                                label={label}
                                                name={campo}
                                                value={formData[campo] || ""}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                            />
                                        )}
                                    </Grid>
                                ))}
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    {editMode ? (
                                        <>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Button type="submit" variant="contained" color="primary">
                                                    Guardar Cambios
                                                </Button>
                                                <Button variant="outlined" onClick={() => setEditMode(false)}>
                                                    Cancelar
                                                </Button>
                                            </Box>
                                            {/* Botón eliminar cuenta debajo, ocupa toda la fila */}
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={() => setConfirmOpen(true)}
                                                sx={{ mt: 3 }}
                                                fullWidth
                                            >
                                                Eliminar cuenta
                                            </Button>
                                            <Dialog
                                                open={confirmOpen}
                                                onClose={() => setConfirmOpen(false)}
                                                aria-labelledby="alert-dialog-title"
                                                aria-describedby="alert-dialog-description"
                                            >
                                                <DialogTitle id="alert-dialog-title">
                                                    {"¿Estás seguro de que quieres eliminar tu cuenta?"}
                                                </DialogTitle>
                                                <DialogContent>
                                                    <DialogContentText id="alert-dialog-description">
                                                        Esta acción es <b>irreversible</b>. Todos tus datos y progreso serán eliminados permanentemente.
                                                    </DialogContentText>
                                                </DialogContent>
                                                <DialogActions>
                                                    <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
                                                        Cancelar
                                                    </Button>
                                                    <Button onClick={handleDeleteAccount} color="error" disabled={deleting} autoFocus>
                                                        {deleting ? "Eliminando..." : "Eliminar"}
                                                    </Button>
                                                </DialogActions>
                                            </Dialog>
                                        </>
                                    ) : (
                                        <Button variant="contained" onClick={() => setEditMode(true)}>
                                            Editar Perfil
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                {/* Columna derecha: Estadísticas y máximas puntuaciones */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        {/* Estadísticas globales en una fila */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Total de sesiones
                                </Typography>
                                <Typography variant="h5" color="secondary">
                                    {formData?.total_sessions ?? 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Mejor puntuación global
                                </Typography>
                                <Typography variant="h5" color="secondary">
                                    {Math.max(...progressData.map(p => p.max_score)) || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Última sesión
                                </Typography>
                                <Typography variant="h5" color="secondary">
                                    {formData?.ultima_sesion ? new Date(formData.ultima_sesion).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* Máximas puntuaciones en matriz */}
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            Máximas Puntuaciones por Juego
                        </Typography>
                        <Grid container spacing={3}>
                            {progressData.map((juego, idx) => {
                                const maxPossibleScores = {
                                    'Matriz de Memoria': 1000,
                                    'Sigue la Secuencia': 500,
                                    'Recuerda los Objetos': 750
                                    // ...otros juegos
                                };
                                const maxPossible = maxPossibleScores[juego.game_name] || 1000;
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={juego.game_name}>
                                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {juego.game_name}
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(juego.max_score / maxPossible) * 100}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 5,
                                                        backgroundColor: theme.palette.secondary.main
                                                    }
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {juego.max_score} pts
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PerfilUsuario;
