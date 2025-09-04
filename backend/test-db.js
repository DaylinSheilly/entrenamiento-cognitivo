require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', res.rows[0]);
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
  } finally {
    pool.end();
  }
}

testDB();
