require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');
const { auth } = require('express-oauth2-jwt-bearer');

// Configura el middleware
const checkJwt = auth({
  audience: 'https://api.neurosite.com', // Tu API identifier configurado en Auth0
  issuerBaseURL: 'https://dev-fynybihn682z8p6r.us.auth0.com/', // Tu Auth0 domain
});

const app = express();

// Configuración de CORS mejorada para Auth0
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configurar conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true
});

// Listeners de conexión
pool.on('connect', () => console.log('Nueva conexión establecida'));
pool.on('acquire', () => console.log('Conexión adquirida'));
pool.on('remove', () => console.log('Conexión removida'));

// Verificar variables de entorno de Auth0
if (!process.env.AUTH0_AUDIENCE || !process.env.AUTH0_ISSUER_BASE_URL) {
  console.error('⚠️ Faltan variables de entorno de Auth0. Verifica tu archivo .env');
}

// Middleware para manejar errores de Auth0
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Token inválido o expirado',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
  next(err);
});

// Rutas
app.get('/', (req, res) => {
  res.send('Backend funcionando con Auth0 🚀');
});

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const gameRoutes = require('./routes/games');

app.use('/auth', checkJwt, authRoutes);
app.use('/sessions', checkJwt, sessionRoutes);
app.use('/games', checkJwt, gameRoutes);

// Cron job para cerrar sesiones inactivas (sin cambios)
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

// Middleware global para errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Autenticación: Auth0 (${process.env.AUTH0_ISSUER_BASE_URL})`);
});
