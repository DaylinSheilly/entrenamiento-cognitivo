const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// 📌 Registro de usuario
router.post('/register', async (req, res) => {
    const { nombre_usuario, correo_electronico, contraseña } = req.body;
    console.log("Datos recibidos en /register:", nombre_usuario, correo_electronico, contraseña);

    try {
        // Verificar si faltan datos
        if (!nombre_usuario || !correo_electronico || !contraseña) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT * FROM "Users" WHERE correo_electronico = $1', [correo_electronico]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        console.log("Contraseña encriptada:", hashedPassword);

        // Insertar usuario y devolver su ID
        const result = await pool.query(
            'INSERT INTO "Users" (nombre_usuario, correo_electronico, contraseña) VALUES ($1, $2, $3) RETURNING id_usuario',
            [nombre_usuario, correo_electronico, hashedPassword]
        );

        console.log("Usuario registrado con ID:", result.rows[0].id_usuario);
        res.json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// 📌 Inicio de sesión
router.post('/login', async (req, res) => {
    const { correo_electronico, contraseña } = req.body;

    try {
        // Verificar usuario
        const user = await pool.query('SELECT * FROM "Users" WHERE correo_electronico = $1', [correo_electronico]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(contraseña, user.rows[0].contraseña);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        // Crear token JWT
        const token = jwt.sign({ userId: user.rows[0].id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Enviar el token y los datos del usuario
        res.json({
            token, // ← Este es el JWT enviado al frontend
            user: {
                id_usuario: user.rows[0].id_usuario,
                nombre_usuario: user.rows[0].nombre_usuario,
                correo_electronico: user.rows[0].correo_electronico,
                fecha_registro: user.rows[0].fecha_registro,
                estado_cuenta: user.rows[0].estado_cuenta
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// 📌 Obtener datos del usuario autenticado
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Extraer token del header
        if (!token) {
            return res.status(401).json({ message: "No autorizado" });
        }

        // Verificar el token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token inválido o expirado" });
        }

        // Buscar usuario en la base de datos
        const user = await pool.query(
            'SELECT id_usuario, nombre_usuario, correo_electronico, fecha_registro, estado_cuenta FROM "Users" WHERE id_usuario = $1',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(user.rows[0]); // Enviar los datos del usuario

    } catch (error) {
        console.error("Error en /me:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// 📌 Eliminar cuenta del usuario autenticado
router.delete('/delete', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Extraer token del header
        if (!token) {
            return res.status(401).json({ message: "No autorizado" });
        }

        // Verificar el token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token inválido o expirado" });
        }

        // Eliminar el usuario de la base de datos
        const result = await pool.query(
            'DELETE FROM "Users" WHERE id_usuario = $1 RETURNING *',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "Cuenta eliminada exitosamente" });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

module.exports = router;
