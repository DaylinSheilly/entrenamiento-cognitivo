const express = require('express');
const { Pool } = require('pg');
const { auth } = require('express-oauth2-jwt-bearer');

const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Middleware Auth0
const checkJwt = auth({
    audience: 'https://api.neurosite.com',
    issuerBaseURL: 'https://dev-fynybihn682z8p6r.us.auth0.com/',
    tokenSigningAlg: 'RS256'
});

// Middleware para obtener el usuario interno desde Auth0
const getInternalUser = async (req, res, next) => {
    const auth0Id = req.auth.payload.sub;
    if (!auth0Id) return res.status(401).json({ error: "No autorizado" });

    try {
        const result = await pool.query(
            'SELECT * FROM "Users" WHERE auth0_id = $1',
            [auth0Id]
        );
        if (!result.rows.length) {
            // Si el usuario no existe, puedes crear el registro aquí o pedir al frontend que complete el perfil
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        req.userDB = result.rows[0];
        next();
    } catch (error) {
        console.error("Error en getInternalUser:", error.message);
        next(error);
    }
};

// 📌 Obtener datos del usuario autenticado
router.get('/me', checkJwt, getInternalUser, (req, res, next) => {
    try {
        if (!req.userDB) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                profile_complete: false
            });
        }

        const {
            id_usuario, nombre_usuario, correo_electronico, fecha_registro, estado_cuenta,
            fecha_nacimiento, genero, nivel_educativo, pais, ultima_sesion, total_sessions
        } = req.userDB;

        // Calcular edad dinámicamente
        let edad = null;
        if (fecha_nacimiento) {
            const hoy = new Date();
            const nacimiento = new Date(fecha_nacimiento);
            edad = hoy.getFullYear() - nacimiento.getFullYear();
            const m = hoy.getMonth() - nacimiento.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
        }

        const profile_complete = !!(req.userDB.nombre_usuario &&
            req.userDB.fecha_nacimiento &&
            req.userDB.genero &&
            req.userDB.nivel_educativo &&
            req.userDB.pais);

        res.json({
            id_usuario, nombre_usuario, correo_electronico, fecha_registro, estado_cuenta,
            edad, fecha_nacimiento, genero, nivel_educativo, pais, ultima_sesion, total_sessions,
            profile_complete
        });
    }
    catch (error) {
        console.error("Error en /me:", error.message);
        next(error); // Pasar el error al middleware de manejo de errores
    }
});

router.post('/profile', checkJwt, async (req, res) => {
    const auth0UserId = req.auth.payload.sub;
    const email = req.body.correo_electronico;

    const {
        nombre_usuario,
        correo_electronico,
        fecha_nacimiento,
        genero,
        nivel_educativo,
        pais
    } = req.body;

    if (
        !nombre_usuario ||
        !correo_electronico ||
        !fecha_nacimiento ||
        !genero ||
        !nivel_educativo ||
        !pais
    ) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si ya existe el usuario
        const existingUser = await pool.query(
            'SELECT * FROM "Users" WHERE auth0_id = $1',
            [auth0UserId]
        );

        if (existingUser.rows.length > 0) {
            // Si ya existe, puedes actualizar los datos (opcional)
            await pool.query(
                `INSERT INTO "Users" (
                  auth0_id, nombre_usuario, correo_electronico,
                  fecha_nacimiento, genero, nivel_educativo, pais, fecha_registro,
                  contraseña, estado_cuenta, total_sessions
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), '', 'activo', 0)`,
                [auth0UserId, nombre_usuario, correo_electronico,
                    fecha_nacimiento, genero, nivel_educativo, pais]
            );
            return res.status(200).json({ message: "Perfil actualizado" });
        }

        // Si NO existe, crear el usuario con todos los campos requeridos
        await pool.query(
            `INSERT INTO "Users" (
          auth0_id, nombre_usuario, correo_electronico,
          fecha_nacimiento, genero, nivel_educativo, pais, fecha_registro,
          contraseña, estado_cuenta, total_sessions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), '', 'activo', 0)`,
            [auth0UserId, req.body.nombre_usuario, req.body.correo_electronico,
                req.body.fecha_nacimiento, req.body.genero,
                req.body.nivel_educativo, req.body.pais]
        );

        res.status(201).json({ message: "Usuario creado correctamente" });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al guardar perfil' });
    }
});

// 📌 Actualizar perfil de usuario
router.put('/me', checkJwt, getInternalUser, async (req, res) => {
    const { nombre_usuario, fecha_nacimiento, genero, nivel_educativo, pais } = req.body;
    if (!nombre_usuario || !fecha_nacimiento || !genero || !nivel_educativo || !pais) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Calcular edad
    const fechaNac = new Date(fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (hoy.getMonth() < fechaNac.getMonth() ||
        (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }

    try {
        const result = await pool.query(
            `UPDATE "Users"
         SET nombre_usuario = $1, fecha_nacimiento = $2, genero = $3, nivel_educativo = $4, pais = $5
         WHERE id_usuario = $6
         RETURNING *`,
            [nombre_usuario, fechaNac, genero, nivel_educativo, pais, req.userDB.id_usuario]
        );
        res.json({ message: "Perfil actualizado correctamente", user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar perfil" });
    }
});

// 📌 Eliminar cuenta del usuario autenticado
router.delete('/me', checkJwt, getInternalUser, async (req, res) => {
    try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM "Sessions" WHERE id_usuario = $1', [req.userDB.id_usuario]);
        await pool.query('DELETE FROM "Users" WHERE id_usuario = $1', [req.userDB.id_usuario]);
        await pool.query('COMMIT');
        res.json({ message: "Cuenta eliminada exitosamente" });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: "Error al eliminar cuenta" });
    }
});

module.exports = router;
