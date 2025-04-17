require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar conexión a Supabase (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const sessionRoutes = require('./routes/sessions');
app.use('/sessions', sessionRoutes);

const gameRoutes = require('./routes/games');
app.use('/games', gameRoutes);

// Ejecutar cada día a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE "Sessions"
       SET end_time = NOW()
       WHERE end_time IS NULL 
         AND start_time < NOW() - INTERVAL '24 hours'`
    );
    console.log('Sesiones inactivas cerradas:', result.rowCount);
  } catch (error) {
    console.error('Error al cerrar sesiones:', error);
  } finally {
    client.release();
  }
});