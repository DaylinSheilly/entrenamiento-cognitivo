// games.js (backend)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const { auth } = require('express-oauth2-jwt-bearer');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const checkJwt = auth({
  audience: 'https://api.neurosite.com',
  issuerBaseURL: 'https://dev-fynybihn682z8p6r.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/create', checkJwt,
  [
    body('session_id').isUUID(4).withMessage('ID de sesión inválido'),
    body('game_name').isString().notEmpty().withMessage('El nombre del juego es obligatorio'),
    body('score').isInt({ min: 0 }).withMessage('El puntaje debe ser un número positivo'),
    body('difficulty').isString().withMessage('La dificultad debe ser texto')
  ],
  validateRequest,
  async (req, res) => {
    const {
      session_id,
      game_name,
      level,
      difficulty,
      actions_taken,
      accuracy,
      streaks,
      errors,
      score
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar juego
      const result = await client.query(
        `INSERT INTO "Games" (
          session_id, game_name, level, difficulty,
          actions_taken, accuracy, streaks, errors, score
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
          session_id, game_name, level, difficulty,
          actions_taken, accuracy, streaks, errors, score
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Juego registrado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al insertar juego:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar el juego',
        error: error.message
      });
    } finally {
      client.release();
    }
  });

// Obtener todos los juegos de una sesión
router.get('/session/:session_id', checkJwt, async (req, res) => {
  const { session_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM "Games" WHERE session_id = $1 ORDER BY game_id ASC`,
      [session_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener juegos de la sesión:', error);
    res.status(500).json({ message: 'Error al obtener los juegos.' });
  }
});

// Obtener el historial de juegos de un usuario
router.get('/user/:id_usuario', checkJwt, async (req, res) => {
  const { id_usuario } = req.params;
  const auth0UserId = req.auth.payload.sub;
  try {
    const userResult = await pool.query(
      'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
      [auth0UserId]
    );

    if (userResult.rows[0].id_usuario !== id_usuario) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const result = await pool.query(
      `SELECT g.*, s.start_time
         FROM "Games" g
         JOIN "Sessions" s ON g.session_id = s.id_session
         WHERE s.id_usuario = $1
         ORDER BY s.start_time DESC`,
      [id_usuario]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener juegos del usuario:', error);
    res.status(500).json({ message: 'Error al obtener el historial de juegos.' });
  }
});

// Obtener el progreso del usuario
router.get('/progress', checkJwt, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.game_name,
        DATE(s.start_time AT TIME ZONE 'UTC') as session_date,
        MAX(g.score) as max_score,
        MIN(g.score) as min_score,
        AVG(g.score) as avg_score,
        MAX(g.errors) as max_errors,
        MIN(g.errors) as min_errors,
        AVG(g.errors) as avg_errors,
        MAX(g.streaks) as max_streaks,
        MIN(g.streaks) as min_streaks,
        AVG(g.streaks) as avg_streaks,
        COUNT(g.score) as games_count
      FROM "Games" g
      JOIN "Sessions" s ON g.session_id = s.id_session
      JOIN "Users" u ON s.id_usuario = u.id_usuario
      WHERE u.auth0_id = $1
      GROUP BY g.game_name, DATE(s.start_time AT TIME ZONE 'UTC')
      ORDER BY g.game_name, session_date DESC
    `, [req.auth.payload.sub]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({ message: 'Error al obtener datos de progreso' });
  }
});

// Obtener el progreso máximo por juego
router.get('/max-scores', checkJwt, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.game_name,
        MAX(g.score) as max_score
      FROM "Games" g
      JOIN "Sessions" s ON g.session_id = s.id_session
      JOIN "Users" u ON s.id_usuario = u.id_usuario
      WHERE u.auth0_id = $1
      GROUP BY g.game_name
      ORDER BY MAX(g.score) DESC
    `, [req.auth.payload.sub]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener puntuaciones máximas:', error);
    res.status(500).json({ message: 'Error al obtener datos de progreso' });
  }
});

router.get('/plays-by-game', checkJwt, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.game_name, COUNT(*) as plays
      FROM "Games" g
      JOIN "Sessions" s ON g.session_id = s.id_session
      JOIN "Users" u ON s.id_usuario = u.id_usuario
      WHERE u.auth0_id = $1
      GROUP BY g.game_name
    `, [req.auth.payload.sub]);
    
    // Convertir a objeto para fácil acceso en el frontend
    const playsByGame = {};
    result.rows.forEach(row => {
      playsByGame[row.game_name] = parseInt(row.plays, 10);
    });
    
    res.json(playsByGame);
  } catch (error) {
    console.error('Error al obtener conteo de juegos:', error);
    res.status(500).json({ message: 'Error al obtener datos de juegos' });
  }
});

module.exports = router;