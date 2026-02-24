/**
 * Rutas de Autenticacion
 *
 * Responsabilidad unica: autenticacion e identidad.
 * - POST /api/login   — Autenticar usuario y emitir token JWT
 * - POST /api/usuarios — Registrar nuevo usuario
 */

const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../middlewares/dbErrorHandler");

/**
 * POST /api/login
 *
 * Autentica a un usuario y retorna un token JWT
 *
 * @route POST /api/login
 * @param {string} email - Dirección de email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Token JWT si las credenciales son válidas
 *
 * Consideraciones de seguridad:
 * - Usa consultas parametrizadas para prevenir inyección SQL
 * - Compara contraseñas usando bcrypt (resistente a timing attacks)
 * - Retorna mensajes de error genéricos (no revela si el email existe)
 * - El token JWT tiene tiempo de expiración
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    console.log("[POST /api/login] Login attempt received");
    // Extraer email y contraseña del cuerpo de la petición
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        error: "Email y contrasena son requeridos",
      });
    }

    // Consulta SQL para encontrar usuario por email
    // Usa consulta parametrizada para prevenir inyección SQL
    const sql = "SELECT * FROM USUARIOS WHERE email = ?";

    // Ejecutar consulta usando pool de conexiones
    const [results] = await pool.query(sql, [email]);

    // Verificar si se encontró el usuario
    if (results.length === 0) {
      // SEGURIDAD: Usar mismo mensaje de error que contraseña inválida
      // para prevenir ataques de enumeración de usuarios
      return res.status(401).json({
        error: "Credenciales invalidas",
      });
    }

    // Obtener el usuario de los resultados
    const usuario = results[0];

    // Comparar contraseña proporcionada con contraseña hasheada en base de datos
    // bcrypt.compare es resistente a timing attacks
    const passwordValido = await bcrypt.compare(password, usuario.password);

    // Si la contraseña no coincide, retornar error
    if (!passwordValido) {
      return res.status(401).json({
        error: "Credenciales invalidas",
      });
    }

    // Generar token JWT
    // El token contiene ID de usuario y nombre, expira en 1 hora
    const token = jwt.sign(
      {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Retornar token e información del usuario al cliente
    res.json({
      token,
      user: {
        id: usuario.idUsuario,
        nombre: usuario.nombre,
        email: usuario.email,
      },
    });
  }),
);

/**
 * POST /api/usuarios
 *
 * Registra un nuevo usuario en el sistema
 *
 * @route POST /api/usuarios
 * @param {string} nombre - Nombre del usuario
 * @param {string} email - Dirección de email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Mensaje de éxito e ID del nuevo usuario
 *
 * Consideraciones de seguridad:
 * - Contraseñas hasheadas con bcrypt (10 rondas)
 * - Usa consultas parametrizadas para prevenir inyección SQL
 * - Valida campos requeridos
 * - Maneja email duplicado de forma elegante
 */
router.post(
  "/usuarios",
  asyncHandler(async (req, res) => {
    // Extraer datos del usuario del cuerpo de la petición
    const { nombre, email, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y contrasena son requeridos",
      });
    }

    // Validar formato de email (validación básica)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Formato de email invalido",
      });
    }

    // SEGURIDAD: Validar requisitos de contraseña
    // Minimo 8 caracteres, al menos una mayuscula, una minuscula y un numero
    if (password.length < 8) {
      return res.status(400).json({
        error: "La contrasena debe tener al menos 8 caracteres",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "La contrasena debe contener al menos una mayuscula, una minuscula y un numero",
      });
    }

    // Hashear contraseña usando bcrypt con 10 rondas de salt
    // Más rondas = más seguro pero más lento
    const hashedPassword = await bcrypt.hash(password, 10);

    // Consulta SQL para insertar nuevo usuario
    // Usa consulta parametrizada para prevenir inyección SQL
    const sql = `
    INSERT INTO USUARIOS (nombre, email, password)
    VALUES (?, ?, ?)
  `;

    // Ejecutar consulta usando pool de conexiones
    const [result] = await pool.query(sql, [nombre, email, hashedPassword]);

    // Retornar respuesta de éxito con ID del nuevo usuario
    res.status(201).json({
      message: "Usuario creado exitosamente",
      id: result.insertId,
    });
  }),
);

module.exports = router;
