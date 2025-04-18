import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const Dashboard = () => {
  const [chartData, setChartData] = useState(null);
  const chartRefs = useRef({});

  useEffect(() => {
      const fetchData = async () => {
          const token = localStorage.getItem('neurogames_token');
          try {
              const response = await axios.get('http://localhost:5000/games/progress', {
                  headers: { Authorization: `Bearer ${token}` }
              });
              
              // Procesar datos para Chart.js
              const gamesData = {};
              response.data.forEach(item => {
                  if (!gamesData[item.game_name]) {
                      gamesData[item.game_name] = {
                          labels: [],
                          datasets: [{
                              label: 'Puntaje Máximo Diario',
                              data: [],
                              borderColor: '#3498db',
                              tension: 0.4
                          }]
                      };
                  }
                  gamesData[item.game_name].labels.push(item.session_date);
                  gamesData[item.game_name].datasets[0].data.push(item.max_score);
              });

              setChartData(gamesData);
          } catch (error) {
              console.error('Error:', error);
          }
      };

      fetchData();
  }, []);

  // Destruir charts anteriores al desmontar
  useEffect(() => {
      return () => {
          Object.values(chartRefs.current).forEach(chart => chart.destroy());
      };
  }, []);

  if (!chartData) return <div>Cargando gráficas...</div>;

  return (
      <div className="dashboard-container">
          {Object.entries(chartData).map(([gameName, data], index) => (
              <div key={gameName} className="dashboard-wrapper">
                  <h3>{gameName}</h3>
                  <div className="dashboard-container">
                      <Line
                          data={data}
                          options={{
                              responsive: true,
                              plugins: {
                                  legend: { display: false },
                                  title: { display: false }
                              },
                              scales: {
                                  y: {
                                      title: { display: true, text: 'Puntaje Máximo' }
                                  },
                                  x: {
                                      title: { display: true, text: 'Fecha' },
                                      type: 'time',
                                      time: { unit: 'day' }
                                  }
                              }
                          }}
                          ref={(el) => chartRefs.current[gameName] = el}
                      />
                  </div>
              </div>
          ))}
      </div>
  );
};

export default Dashboard;