// sessions.js (backend)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// 1. Configuración mejorada del Pool de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

// 3. Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 4. Middleware de manejo de errores global
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
};

// 5. Middleware para verificar la propiedad de la sesión
const checkSessionOwnership = async (req, res, next) => {
  const { id } = req.params; // Usa "id" (nombre del parámetro en la ruta)
  const userId = req.user.userId;

  try {
    const session = await pool.query(
      `SELECT 1 FROM "Sessions" 
       WHERE id_session = $1 AND id_usuario = $2`,
      [id, userId]
    );

    if (!session.rows.length) {
      return res.status(403).json({ error: 'No tienes acceso a esta sesión' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Nuevo endpoint GET /sessions/active
router.get('/active', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id_session FROM "Sessions"
       WHERE id_usuario = $1 AND end_time IS NULL
       ORDER BY start_time DESC LIMIT 1`,
      [req.user.userId]
    );
    
    res.json(result.rows[0] || {});
  } catch (error) {
    next(error);
  }
});

// Nuevo endpoint PATCH /sessions/:id/update
router.patch(
  '/:id/update',
  [
    param('id').isUUID(4).withMessage('ID de sesión inválido'),
    body('games_played').isInt({ min: 0 }).withMessage('Valor inválido para juegos jugados')
  ],
  authenticateToken,
  checkSessionOwnership,
  validateRequest,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      const { games_played } = req.body;

      const result = await client.query(
        `UPDATE "Sessions"
         SET total_games = total_games + $1
         WHERE id_session = $2
         RETURNING total_games`,
        [games_played, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

// Endpoint POST /start mejorado
router.post(
  '/start',
  authenticateToken,
  async (req, res, next) => {
    try {
      const userId = req.user.userId;

      const activeSession = await pool.query(
        `SELECT id_session 
         FROM "Sessions" 
         WHERE id_usuario = $1 AND end_time IS NULL
         ORDER BY start_time DESC
         LIMIT 1`,
        [userId]
      );

      if (activeSession.rows.length > 0) {
        return res.json({ 
          id_session: activeSession.rows[0].id_session,
          is_new: false
        });
      }

      const newSession = await pool.query(
        `INSERT INTO "Sessions" (id_usuario) 
         VALUES ($1) 
         RETURNING id_session, start_time`,
        [userId]
      );

      res.status(201).json({
        id_session: newSession.rows[0].id_session,
        is_new: true
      });
    } catch (error) {
      next(error);
    }
  }
);

// Endpoint PUT /end/:id_session mejorado
router.put(
  '/end/:id_session',
  [
    param('id_session').isUUID(4).withMessage('ID de sesión inválido'),
    body('total_games').isInt({ min: 0 }),
    body('total_trials').isInt({ min: 0 })
  ],
  authenticateToken,
  validateRequest,
  async (req, res, next) => {
    const { id_session } = req.params;
    const { total_games, total_trials } = req.body;

    try {
      const result = await pool.query(
        `UPDATE "Sessions"
         SET 
           end_time = NOW(),
           total_time = EXTRACT(EPOCH FROM (NOW() - start_time)),
           total_games = $1,
           total_trials = $2
         WHERE id_session = $3
         RETURNING *`,
        [total_games, total_trials, id_session]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Endpoint GET /user-history/:id_usuario mejorado
router.get(
  '/user-history/:id_usuario',
  [
    param('id_usuario').isUUID(4).withMessage('ID de usuario inválido')
  ],
  authenticateToken,
  validateRequest,
  async (req, res, next) => {
    const { id_usuario } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      const offset = (page - 1) * limit;
      
      const result = await pool.query(
        `SELECT 
          id_session, 
          start_time, 
          end_time,
          total_time,
          total_games,
          total_trials
         FROM "Sessions" 
         WHERE id_usuario = $1 
         ORDER BY start_time DESC
         LIMIT $2 OFFSET $3`,
        [id_usuario, limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM "Sessions" WHERE id_usuario = $1',
        [id_usuario]
      );

      res.status(200).json({
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

// Aplicar manejador de errores global
router.use(errorHandler, checkSessionOwnership);

module.exports = router;
