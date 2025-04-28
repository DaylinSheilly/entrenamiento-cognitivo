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
    const { 
        nombre_usuario, 
        correo_electronico, 
        contraseña,
        fecha_nacimiento,
        genero,
        nivel_educativo,
        pais
    } = req.body;
    
    console.log("Datos recibidos en /register:", nombre_usuario, correo_electronico);

    try {
        // Verificar todos los campos obligatorios
        if (!nombre_usuario || !correo_electronico || !contraseña || !fecha_nacimiento || 
            !genero || !nivel_educativo || !pais) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Validar formato de fecha
        const fechaNacimiento = new Date(fecha_nacimiento);
        if (isNaN(fechaNacimiento.getTime())) {
            return res.status(400).json({ message: 'Formato de fecha inválido' });
        }

        // Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT * FROM "Users" WHERE correo_electronico = $1', [correo_electronico]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Insertar usuario (la edad se calcula en la BD)
        const result = await pool.query(
            `INSERT INTO "Users" (
                nombre_usuario, 
                correo_electronico, 
                contraseña, 
                fecha_nacimiento, 
                genero, 
                nivel_educativo, 
                pais, 
                fecha_registro, 
                estado_cuenta, 
                edad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9) 
            RETURNING id_usuario`,
            [
                nombre_usuario, 
                correo_electronico, 
                hashedPassword,
                fechaNacimiento, // $4 - tipo DATE
                genero,
                nivel_educativo,
                pais,
                'Activa', // $8
                calcularEdad(fechaNacimiento) // $9 - tipo INTEGER
            ]
        );
        
        // Función para calcular la edad
        function calcularEdad(fechaNacimiento) {
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
            return edad;
        }

        console.log("Usuario registrado con ID:", result.rows[0].id_usuario);
        res.json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
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

        // Actualizar última sesión y recalcular edad
        await pool.query(
            'UPDATE "Users" SET ultima_sesion = NOW(), edad = EXTRACT(YEAR FROM AGE(NOW(), fecha_nacimiento))::integer WHERE id_usuario = $1',
            [user.rows[0].id_usuario]
        );

        // Crear token JWT
        const token = jwt.sign({ userId: user.rows[0].id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Obtener datos actualizados del usuario
        const updatedUser = await pool.query(
            'SELECT id_usuario, nombre_usuario, correo_electronico, fecha_registro, estado_cuenta, edad, fecha_nacimiento, genero, nivel_educativo, pais, ultima_sesion FROM "Users" WHERE id_usuario = $1',
            [user.rows[0].id_usuario]
        );

        // Enviar el token y los datos del usuario
        res.json({
            token,
            user: updatedUser.rows[0]
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
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

        // Actualizar edad y obtener todos los datos relevantes
        const user = await pool.query(
            'UPDATE "Users" SET edad = EXTRACT(YEAR FROM AGE(NOW(), fecha_nacimiento))::integer WHERE id_usuario = $1 RETURNING id_usuario, nombre_usuario, correo_electronico, fecha_registro, estado_cuenta, edad, fecha_nacimiento, genero, nivel_educativo, pais, ultima_sesion',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(user.rows[0]);

    } catch (error) {
        console.error("Error en /me:", error);
        res.status(500).json({ message: "Error en el servidor: " + error.message });
    }
});

// 📌 Actualizar perfil de usuario
router.put('/update-profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
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

        const { 
            nombre_usuario, 
            fecha_nacimiento, 
            genero, 
            nivel_educativo, 
            pais 
        } = req.body;

        // Verificar que todos los campos estén presentes
        if (!nombre_usuario || !fecha_nacimiento || !genero || !nivel_educativo || !pais) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        // Validar fecha
        const fechaNacimiento = new Date(fecha_nacimiento);
        if (isNaN(fechaNacimiento.getTime())) {
            return res.status(400).json({ message: 'Formato de fecha inválido' });
        }
        
        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        if (hoy.getMonth() < fechaNac.getMonth() || 
            (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        
        // Luego usar esa edad en la consulta
        const result = await pool.query(
            'UPDATE "Users" SET nombre_usuario = $1, fecha_nacimiento = $2, genero = $3, nivel_educativo = $4, pais = $5, edad = $7 WHERE id_usuario = $6 RETURNING *',
            [nombre_usuario, fechaNacimiento, genero, nivel_educativo, pais, decoded.userId, edad]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({
            message: "Perfil actualizado correctamente",
            user: {
                id_usuario: result.rows[0].id_usuario,
                nombre_usuario: result.rows[0].nombre_usuario,
                correo_electronico: result.rows[0].correo_electronico,
                fecha_registro: result.rows[0].fecha_registro,
                estado_cuenta: result.rows[0].estado_cuenta,
                edad: result.rows[0].edad,
                fecha_nacimiento: result.rows[0].fecha_nacimiento,
                genero: result.rows[0].genero,
                nivel_educativo: result.rows[0].nivel_educativo,
                pais: result.rows[0].pais,
                ultima_sesion: result.rows[0].ultima_sesion
            }
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ message: "Error en el servidor: " + error.message });
    }
});

// 📌 Eliminar cuenta del usuario autenticado
router.delete('/delete', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No autorizado" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token inválido o expirado" });
        }

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
        res.status(500).json({ message: "Error en el servidor: " + error.message });
    }
});

module.exports = router;
