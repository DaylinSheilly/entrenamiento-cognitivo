// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 50,
  idleTimeoutMillis: 60000, 
  connectionTimeoutMillis: 10000 
});

// Listeners de conexión
pool.on('connect', () => console.log('Nueva conexión establecida'));
// pool.on('acquire', () => console.log('Conexión adquirida'));
pool.on('remove', () => console.log('Conexión removida'));

module.exports = pool;