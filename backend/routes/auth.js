const express = require('express');
const { auth } = require('express-oauth2-jwt-bearer');

const router = express.Router();
const pool = require('../db');

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
            user_id, user_name, auth0_id, birthdate, gender, educational_level,
            country, registration_date, account_status, last_session, total_sessions
        } = req.userDB;

        let edad = null;
        if (birthdate) {
            const hoy = new Date();
            const nacimiento = new Date(birthdate);
            edad = hoy.getFullYear() - nacimiento.getFullYear();
            const m = hoy.getMonth() - nacimiento.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
        }

        const profile_complete = !!(user_name && birthdate && gender && educational_level && country);

        res.json({
            user_id, user_name, auth0_id, registration_date, account_status,
            edad, birthdate, gender, educational_level, country, last_session, total_sessions,
            profile_complete
        });
    }
    catch (error) {
        console.error("Error en /me:", error.message);
        next(error);
    }
});

// 📌 Crear perfil de usuario
router.post('/profile', checkJwt, async (req, res) => {
    const auth0UserId = req.auth.payload.sub;

    const {
        user_name,
        birthdate,
        gender,
        educational_level,
        country
    } = req.body;

    if (!user_name || !birthdate || !gender || !educational_level || !country) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        const existingUser = await pool.query(
            'SELECT * FROM "Users" WHERE auth0_id = $1',
            [auth0UserId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(200).json({ message: "El perfil ya existe." });
        }

        await pool.query(
            `INSERT INTO "Users" (
                auth0_id, user_name, birthdate, gender,
                educational_level, country, registration_date,
                account_status, total_sessions
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'active', 0)`,
            [auth0UserId, user_name, birthdate, gender, educational_level, country]
        );

        res.status(201).json({ message: "Usuario creado correctamente" });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al guardar perfil' });
    }
});

// 📌 Actualizar perfil de usuario
router.put('/me', checkJwt, getInternalUser, async (req, res) => {
    const { user_name, birthdate, gender, educational_level, country } = req.body;
    if (!user_name || !birthdate || !gender || !educational_level || !country) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    try {
        const result = await pool.query(
            `UPDATE "Users"
             SET user_name = $1, birthdate = $2, gender = $3,
                 educational_level = $4, country = $5
             WHERE user_id = $6
             RETURNING *`,
            [user_name, birthdate, gender, educational_level, country, req.userDB.user_id]
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
        await pool.query('DELETE FROM "Sessions" WHERE user_id = $1', [req.userDB.user_id]);
        await pool.query('DELETE FROM "Users" WHERE user_id = $1', [req.userDB.user_id]);
        await pool.query('COMMIT');
        res.json({ message: "Cuenta eliminada exitosamente" });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: "Error al eliminar cuenta" });
    }
});

module.exports = router;
