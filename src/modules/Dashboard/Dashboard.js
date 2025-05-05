import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Para puntajes
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Para errores
import BoltIcon from '@mui/icons-material/Bolt'; // Para rachas
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Para conteos
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useAuth0 } from "@auth0/auth0-react";

const STAT_OPTIONS = [
  { value: "avg_score", label: "Puntaje Promedio" },
  { value: "max_score", label: "Puntaje Máximo" },
  { value: "min_score", label: "Puntaje Mínimo" },
  { value: "avg_errors", label: "Errores Promedio" },
  { value: "max_errors", label: "Errores Máximos" },
  { value: "min_errors", label: "Errores Mínimos" },
  { value: "avg_streaks", label: "Racha Promedio" },
  { value: "max_streaks", label: "Racha Máxima" },
  { value: "min_streaks", label: "Racha Mínima" },
  { value: "games_count", label: "Partidas por Día" },
];

const ProgressCharts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stat, setStat] = useState(STAT_OPTIONS[0].value);
  const theme = useTheme();
  const { isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0(); // <-- Nuevo hook

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get("http://localhost:5000/games/progress", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Procesar datos para MUI X Charts (igual que antes)
        const gamesData = {};
        response.data.forEach((item) => {
          if (!gamesData[item.game_name]) {
            gamesData[item.game_name] = {};
          }
          console.log(gamesData);
          // Si ya existe la fecha, conserva los datos previos
          if (!gamesData[item.game_name][item.session_date]) {
            gamesData[item.game_name][item.session_date] = {
              max_score: item.max_score,
              min_score: item.min_score,
              avg_score: item.avg_score,
              max_errors: item.max_errors,
              min_errors: item.min_errors,
              avg_errors: item.avg_errors,
              max_streaks: item.max_streaks,
              min_streaks: item.min_streaks,
              avg_streaks: item.avg_streaks,
              games_count: item.games_count,
            };
          }
        });

        const formattedData = {};
        Object.entries(gamesData).forEach(([game, statsByDate]) => {
          const dates = Object.keys(statsByDate).sort();
          const formattedDates = dates.map(dateISO =>
            new Date(dateISO).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          );

          formattedData[game] = {
            x: formattedDates,
            y: {
              max_score: dates.map(date => statsByDate[date].max_score),
              min_score: dates.map(date => statsByDate[date].min_score),
              avg_score: dates.map(date => statsByDate[date].avg_score),
              max_errors: dates.map(date => statsByDate[date].max_errors),
              min_errors: dates.map(date => statsByDate[date].min_errors),
              avg_errors: dates.map(date => statsByDate[date].avg_errors),
              max_streaks: dates.map(date => statsByDate[date].max_streaks),
              min_streaks: dates.map(date => statsByDate[date].min_streaks),
              avg_streaks: dates.map(date => statsByDate[date].avg_streaks),
              games_count: dates.map(date => statsByDate[date].games_count),
            }
          };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Error:", error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          loginWithRedirect();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect]);

  const getStatIcon = (statType) => {
    if (statType.includes('score')) return <EmojiEventsIcon color="primary" />;
    if (statType.includes('error')) return <ErrorOutlineIcon color="error" />;
    if (statType.includes('streak')) return <BoltIcon color="success" />;
    if (statType.includes('count')) return <CalendarTodayIcon color="info" />;
    return <TrendingUpIcon color="primary" />;
  };

  if (loading || isLoading)
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="h4" align="center" gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            letterSpacing: 1,
            mb: 4,
          }}>
          Cargando estadísticas
        </Typography>
        <LinearProgress color="primary" sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    );

  if (!chartData)
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Estadísticas de Juegos
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ mt: 3 }}>
          No hay datos para mostrar.
        </Typography>
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{
          fontWeight: 700,
          color: theme.palette.primary.main,
          letterSpacing: 1,
          mb: 4,
        }}
      >
        Estadísticas de Juegos
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <FormControl>
          <InputLabel id="stat-select-label">Estadística</InputLabel>
          <Select
            labelId="stat-select-label"
            value={stat}
            label="Estadística"
            onChange={e => setStat(e.target.value)}
            size="small"
          >
            {STAT_OPTIONS.map(option => (
              <MenuItem value={option.value} key={option.value}>
                {getStatIcon(option.value)}
                <span style={{ marginLeft: '8px' }}>{option.label}</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={3}>
        {Object.entries(chartData).map(([gameName, data]) => (
          <Grid item xs={12} sm={6} md={4} key={gameName}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 4,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 8 },
                backgroundColor: theme.palette.background.paper, // Fondo blanco del theme
              }}
            >
              <CardHeader
                avatar={getStatIcon(stat)}
                title={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: "#000",
                      textAlign: "left",
                    }}
                  >
                    {gameName}
                  </Typography>
                }
                sx={{ pb: 0 }}
              />
              <CardContent>
                <LineChart
                  xAxis={[
                    {
                      data: data.x,
                      label: "Fecha",
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 12 },
                    },
                  ]}
                  series={[{
                    data: data.y[stat],
                    label: STAT_OPTIONS.find(opt => opt.value === stat).label,
                    color: theme.palette.primary.main,
                    area: false,
                    tooltip: {
                      formatter: (value) => {
                        const index = data.y[stat].indexOf(value);
                        return `
                          ${value} ${stat.includes('score') ? 'pts' : stat.includes('errors') ? 'errores' : 'rachas'}
                          (Fecha: ${data.x[index]})
                        `;
                      }
                    }
                  }]}
                  width={420}    // Más ancho
                  height={260}   // Más alto
                  margin={{ top: 30, right: 30, bottom: 50, left: 30 }} // Más espacio para ejes
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProgressCharts;
