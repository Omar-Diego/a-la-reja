// Rutas de Gestión de Usuarios

// Importa el framework Express
const express = require("express");

// Crea un enrutador para definir las rutas
const router = express.Router();

// Importa la configuración de la base de datos
const db = require("../config/db");

// Importa bcryptjs para encriptar contraseñas
const bcrypt = require("bcryptjs");

// Importa jsonwebtoken para crear tokens de autenticación
const jwt = require("jsonwebtoken");

// POST /api/login

/**
 * Inicia sesión de usuario y devuelve un token JWT
 * 
 * @route POST /api/login
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Token JWT si las credenciales son válidas
 */
router.post("/login", (req, res) => {
  // Extrae email y password del cuerpo de la solicitud
  const { email, password } = req.body;

  // Consulta SQL para buscar usuario por email
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  // Ejecuta la consulta con el email proporcionado
  db.query(sql, [email], async (error, results) => {
    // Si hay un error en la consulta, responde con error 500
    if (error) {
      return res.status(500).json({ error: "Error del servidor" });
    }

    // Verifica si se encontró un usuario con ese email
    if (results.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Obtiene el primer resultado (el usuario encontrado)
    const usuario = results[0];

    // Compara la contraseña proporcionada con la encriptada en la base de datos
    const passwordValido = await bcrypt.compare(password, usuario.password);

    // Si la contraseña no coincide, responde con error 401
    if (!passwordValido) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generación del Token JWT
    // Crea un token JWT con el ID del usuario
    // El token expira en 1 hora (1h)
    const token = jwt.sign(
      { idUsuario: usuario.idUsuario },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Responde con el token generado
    res.json({ token });
  });
});

// POST /api/usuarios
/**
 * Registra un nuevo usuario en el sistema
 * 
 * @route POST /api/usuarios
 * @param {string} nombre - Nombre del usuario
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Mensaje de éxito y ID del nuevo usuario
 */
router.post("/usuarios", async (req, res) => {
  // Extrae los datos del cuerpo de la solicitud
  const { nombre, email, password } = req.body;

  // Encripta la contraseña usando bcrypt con 10 rounds de sal
  const hashedPassword = await bcrypt.hash(password, 10);

  // Consulta SQL para insertar un nuevo usuario
  const sql = `
    INSERT INTO usuarios (nombre, email, password)
    VALUES (?, ?, ?)
  `;

  // Ejecuta la consulta con los datos del usuario
  db.query(sql, [nombre, email, hashedPassword], (error, result) => {
    // Si hay un error en la consulta, responde con error 500
    if (error) {
      return res.status(500).json({ error: "Error al crear usuario" });
    }

    // Responde con éxito, incluyendo el ID del nuevo usuario
    res.status(201).json({
      message: "Usuario creado",
      id: result.insertId
    });
  });
});

// Exporta el enrutador para ser utilizado en index.js
module.exports = router;
