// sessions.js (backend)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, param, validationResult } = require('express-validator');
const { auth } = require('express-oauth2-jwt-bearer');
const axios = require('axios');

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

const checkJwt = auth({
  audience: 'https://api.neurosite.com',
  issuerBaseURL: 'https://dev-fynybihn682z8p6r.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

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
  const { id } = req.params;

  try {
    // Necesitarás mapear el Auth0 userId (sub) a tu ID de usuario interno
    // Opción 1: Guarda el sub de Auth0 en tu tabla Users
    // Opción 2: Crea una tabla de mapeo Auth0ID -> UserID

    const userMapping = await pool.query(
      `SELECT id_usuario FROM "Users" WHERE auth0_id = $1`,
      [req.auth.payload.sub]
    );

    if (!userMapping.rows.length) {
      return res.status(403).json({ error: 'Usuario no encontrado' });
    }

    const internalUserId = userMapping.rows[0].id_usuario;

    const session = await pool.query(
      `SELECT 1 FROM "Sessions" WHERE id_session = $1 AND id_usuario = $2`,
      [id, internalUserId]
    );

    if (!session.rows.length) {
      return res.status(403).json({ error: 'No tienes acceso a esta sesión' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const getInternalUserId = async (req, res, next) => {
  try {
    const auth0UserId = req.auth.payload.sub;
    const userResult = await pool.query(
      'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
      [auth0UserId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    req.internalUserId = userResult.rows[0].id_usuario;
    next();
  } catch (error) {
    next(error);
  }
};

// Nuevo endpoint GET /sessions/active
router.get('/active', checkJwt, async (req, res, next) => {
  try {
    const auth0UserId = req.auth.payload.sub;
    const userResult = await pool.query(
      'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
      [auth0UserId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const internalUserId = userResult.rows[0].id_usuario;
    const result = await pool.query(
      `SELECT id_session FROM "Sessions"
       WHERE id_usuario = $1 AND end_time IS NULL
       ORDER BY start_time DESC LIMIT 1`,
      [internalUserId]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    next(error);
  }
});

// Nuevo endpoint PATCH /sessions/:id/update
router.patch('/:id/update',
  [
    param('id').isUUID(4).withMessage('ID de sesión inválido'),
    body('games_played').isInt({ min: 0 }).withMessage('Valor inválido para juegos jugados')
  ],
  checkJwt,
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

// Endpoint POST /start
router.post('/start', checkJwt, getInternalUserId, async (req, res) => {

  const client = await pool.connect().catch(error => {
    console.error("Error al conectar:", error);
    return res.status(500).json({ message: "Error de conexión con la base de datos" });
  });
  try {
    const auth0UserId = req.auth.payload.sub;
    const userResult = await pool.query(
      'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
      [auth0UserId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const internalUserId = userResult.rows[0].id_usuario;

    // Verificar sesión activa existente
    const activeSession = await client.query(
      `SELECT id_session 
       FROM "Sessions" 
       WHERE id_usuario = $1 AND end_time IS NULL
       ORDER BY start_time DESC 
       LIMIT 1`,
      [internalUserId]
    );

    if (activeSession.rows.length > 0) {
      return res.status(409).json({
        message: "Ya tienes una sesión activa",
        sessionId: activeSession.rows[0].id_session
      });
    }

    // Crear nueva sesión
    const newSession = await client.query(
      `INSERT INTO "Sessions" (id_usuario, start_time) 
       VALUES ($1, NOW()) 
       RETURNING id_session`,
      [internalUserId]
    );

    await client.query(
      `UPDATE "Users" 
       SET 
         total_sessions = total_sessions + 1,
         ultima_sesion = NOW()
       WHERE id_usuario = $1`,
      [internalUserId]
    );

    await client.query('COMMIT');

    res.json({
      id_session: newSession.rows[0].id_session,
      start_time: newSession.rows[0].start_time
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al iniciar sesión de juego:", error);
    res.status(500).json({
      message: "Error al iniciar sesión de juego",
      error: error.message  // Solo para ambiente de desarrollo
    });
  } finally {
    client.release();
  }
});

// Endpoint PUT /end/:id_session
router.put('/end/:id_session',
  [
    param('id_session').isUUID(4).withMessage('ID de sesión inválido'),
    body('total_games').isInt({ min: 0 }),
    body('total_trials').isInt({ min: 0 })
  ],
  checkJwt,
  validateRequest,
  async (req, res, next) => {
    const userId = req.auth.payload.sub;

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

// Endpoint GET /user-history/:id_usuario
router.get('/user-history/:id_usuario',
  [
    param('id_usuario').isUUID(4).withMessage('ID de usuario inválido')
  ],
  checkJwt,
  validateRequest,
  async (req, res, next) => {
    const userId = req.auth.payload.sub;
    const { id_usuario } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      const auth0UserId = req.auth.payload.sub;
      const userResult = await pool.query(
        'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
        [auth0UserId]
      );
      if (!userResult.rows.length || userResult.rows[0].id_usuario !== id_usuario) {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }

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

// Cerrar sesión activa
router.put('/end', checkJwt, async (req, res) => {
  const auth0UserId = req.auth.payload.sub;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cerrar sesión en la base de datos
    const userResult = await client.query(
      'SELECT id_usuario FROM "Users" WHERE auth0_id = $1',
      [auth0UserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userId = userResult.rows[0].id_usuario;

    // Cerrar TODAS las sesiones activas del usuario
    await client.query(
      `UPDATE "Sessions"
       SET end_time = NOW(),
           total_time = EXTRACT(EPOCH FROM (NOW() - start_time))
       WHERE id_usuario = $1 AND end_time IS NULL`,
      [userId]
    );

    // 2. Invalidar token de Auth0
    await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/revoke`,
      new URLSearchParams({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        token: req.auth.token
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en cierre de sesión:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Aplicar manejador de errores global
router.use(errorHandler);

module.exports = router;
