import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Skeleton,
  useTheme
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const ProgressCharts = () => {
  const [chartData, setChartData] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("neurogames_token");
      try {
        const response = await axios.get("http://localhost:5000/games/progress", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Procesar datos para MUI X Charts
        const gamesData = {};
        response.data.forEach((item) => {
          if (!gamesData[item.game_name]) {
            gamesData[item.game_name] = {};
          }
          gamesData[item.game_name][item.session_date] = item.max_score;
        });

        // Convierte los datos a formato de LineChart con fechas formateadas
        const formattedData = {};
        Object.entries(gamesData).forEach(([game, scoresByDate]) => {
          const dates = Object.keys(scoresByDate).sort();
          const formattedDates = dates.map(dateISO =>
            new Date(dateISO).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          );
          formattedData[game] = {
            x: formattedDates,
            y: dates.map(date => scoresByDate[date]),
          };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  if (!chartData)
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Progreso de Puntaje por Juego
        </Typography>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card sx={{ minHeight: 300, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Skeleton variant="rectangular" width="100%" height={200} />
                  <Skeleton width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
                      data: data.y,
                      label: "Puntaje Máximo Diario",
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
