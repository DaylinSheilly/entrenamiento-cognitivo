// games.js (backend)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 2. Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post('/create',
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

    if (!session_id || !game_name) {
      return res.status(400).json({ message: 'session_id y game_name son obligatorios.' });
    }

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
router.get('/session/:session_id', async (req, res) => {
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
router.get('/user/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;

  try {
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
router.get('/progress', authenticateToken, async (req, res) => {
  try {
      const userId = req.user.userId;
      
      const result = await pool.query(`
          SELECT 
              g.game_name,
              DATE(s.start_time AT TIME ZONE 'UTC') as session_date,
              MAX(g.score) as max_score
          FROM "Games" g
          JOIN "Sessions" s ON g.session_id = s.id_session
          WHERE s.id_usuario = $1
          GROUP BY g.game_name, DATE(s.start_time AT TIME ZONE 'UTC')
          ORDER BY DATE(s.start_time AT TIME ZONE 'UTC')
      `, [userId]);

      res.json(result.rows);
  } catch (error) {
      console.error('Error al obtener progreso:', error);
      res.status(500).json({ message: 'Error al obtener datos de progreso' });
  }
});

module.exports = router;