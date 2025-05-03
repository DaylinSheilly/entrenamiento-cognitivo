import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useAuth0 } from "@auth0/auth0-react"; // <-- Nuevo import

const STAT_OPTIONS = [
  { value: "max_score", label: "Puntaje Máximo" },
  { value: "min_score", label: "Puntaje Mínimo" },
  { value: "avg_score", label: "Puntaje Promedio" },
  { value: "games_count", label: "Partidas por Día" },
];

const ProgressCharts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stat, setStat] = useState("max_score");
  const theme = useTheme();
  const navigate = useNavigate();
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
          // Si ya existe la fecha, conserva los datos previos
          if (!gamesData[item.game_name][item.session_date]) {
            gamesData[item.game_name][item.session_date] = {
              max_score: item.max_score,
              min_score: item.min_score,
              avg_score: item.avg_score,
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
          Cargando progreso de Puntaje por Juego
        </Typography>
        <LinearProgress color="primary" sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    );

  if (!chartData)
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Progreso de Puntaje por Juego
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
        Progreso de Puntaje por Juego
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
                {option.label}
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
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, #fff 100%)`,
              }}
            >
              <CardHeader
                avatar={<TrendingUpIcon color="primary" />}
                title={
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.dark,
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
                  series={[
                    {
                      data: data.y[stat],
                      label: STAT_OPTIONS.find(opt => opt.value === stat).label,
                      color: theme.palette.primary.main,
                      area: false,
                    },
                  ]}
                  width={300}
                  height={180}
                  margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
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
