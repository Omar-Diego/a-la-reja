/**
 * Rutas de Gestion de Usuarios
 *
 * Este módulo maneja autenticación y registro de usuarios.
 * Características:
 * - Registro de usuario con hash de contraseñas
 * - Login de usuario con generación de token JWT
 * - Consultas de base de datos async/await con pool de conexiones
 * - Manejo de errores seguro
 */

// Importar framework Express
const express = require("express");

// Crear router para definir rutas
const router = express.Router();

// Importar el pool de conexiones de base de datos
const { pool } = require("../config/db");

// Importar bcryptjs para hash de contraseñas
const bcrypt = require("bcryptjs");

// Importar jsonwebtoken para tokens de autenticación
const jwt = require("jsonwebtoken");

// Importar manejador asíncrono para manejo de errores
const { asyncHandler } = require("../middlewares/dbErrorHandler");

// Importar middleware de autenticación JWT
const auth = require("../middlewares/auth");

// Importar middleware de autenticación para administradores
const adminAuth = require("../middlewares/adminAuth");

// Log para verificar que el archivo se cargó
console.log("[Routes] Usuarios routes loaded with profile endpoints");

/**
 * GET /api/usuarios
 *
 * Obtiene la lista de todos los usuarios (solo admin)
 *
 * @route GET /api/usuarios
 * @returns {Array} Lista de usuarios
 */
router.get(
  "/usuarios",
  adminAuth,
  asyncHandler(async (req, res) => {
    console.log("[GET /api/usuarios] Request received");
    const sql = `
      SELECT idUsuario, nombre, email, telefono,
             (SELECT COUNT(*) FROM RESERVACIONES WHERE USUARIOS_idUsuario = u.idUsuario) as totalReservaciones
      FROM USUARIOS u
      ORDER BY nombre ASC
    `;

    const [results] = await pool.query(sql);
    res.json(results);
  }),
);

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

/**
 * GET /api/usuarios/me
 *
 * Obtiene el perfil del usuario autenticado
 *
 * @route GET /api/usuarios/me
 * @header Authorization: Bearer <token>
 * @returns {Object} Datos del perfil del usuario
 */
router.get(
  "/usuarios/me",
  auth,
  asyncHandler(async (req, res) => {
    const idUsuario = req.usuario.idUsuario;

    const sql = `
      SELECT idUsuario, nombre, email, telefono
      FROM USUARIOS
      WHERE idUsuario = ?
    `;

    const [results] = await pool.query(sql, [idUsuario]);

    if (results.length === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(results[0]);
  }),
);

/**
 * PUT /api/usuarios/me
 *
 * Actualiza el perfil del usuario autenticado
 *
 * @route PUT /api/usuarios/me
 * @header Authorization: Bearer <token>
 * @param {string} nombre - Nuevo nombre del usuario
 * @param {string} telefono - Nuevo teléfono del usuario (opcional)
 * @returns {Object} Mensaje de éxito
 */
router.put(
  "/usuarios/me",
  auth,
  asyncHandler(async (req, res) => {
    const idUsuario = req.usuario.idUsuario;
    const { nombre, telefono } = req.body;

    // Validar que al menos un campo esté presente
    if (!nombre && telefono === undefined) {
      return res.status(400).json({
        error: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    // Validar nombre si se proporciona
    if (nombre !== undefined && nombre.trim().length < 2) {
      return res.status(400).json({
        error: "El nombre debe tener al menos 2 caracteres",
      });
    }

    // Validar formato de teléfono si se proporciona
    if (telefono !== undefined && telefono !== null && telefono !== "") {
      const phoneRegex = /^[+]?[\d\s-]{8,20}$/;
      if (!phoneRegex.test(telefono)) {
        return res.status(400).json({
          error: "Formato de telefono invalido",
        });
      }
    }

    // Construir consulta de actualización dinámica
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre.trim());
    }

    if (telefono !== undefined) {
      updates.push("telefono = ?");
      values.push(telefono === "" ? null : telefono);
    }

    values.push(idUsuario);

    const sql = `UPDATE USUARIOS SET ${updates.join(", ")} WHERE idUsuario = ?`;

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Obtener datos actualizados del usuario
    const [updated] = await pool.query(
      "SELECT idUsuario, nombre, email, telefono FROM USUARIOS WHERE idUsuario = ?",
      [idUsuario],
    );

    res.json({
      message: "Perfil actualizado exitosamente",
      user: updated[0],
    });
  }),
);

/**
 * GET /api/usuarios/me/stats
 *
 * Obtiene estadísticas del usuario autenticado
 *
 * @route GET /api/usuarios/me/stats
 * @header Authorization: Bearer <token>
 * @returns {Object} Estadísticas del usuario
 */
router.get(
  "/usuarios/me/stats",
  auth,
  asyncHandler(async (req, res) => {
    const idUsuario = req.usuario.idUsuario;

    // Obtener total de reservaciones
    const [totalResult] = await pool.query(
      "SELECT COUNT(*) as total FROM RESERVACIONES WHERE USUARIOS_idUsuario = ?",
      [idUsuario],
    );

    // Obtener reservaciones completadas (fecha pasada)
    const [completedResult] = await pool.query(
      `SELECT COUNT(*) as completed FROM RESERVACIONES
       WHERE USUARIOS_idUsuario = ? AND fecha < CURDATE()`,
      [idUsuario],
    );

    // Obtener reservaciones próximas
    const [upcomingResult] = await pool.query(
      `SELECT COUNT(*) as upcoming FROM RESERVACIONES
       WHERE USUARIOS_idUsuario = ? AND fecha >= CURDATE()`,
      [idUsuario],
    );

    res.json({
      total: totalResult[0].total,
      completed: completedResult[0].completed,
      upcoming: upcomingResult[0].upcoming,
    });
  }),
);

/**
 * GET /api/usuarios/me/activity
 *
 * Obtiene la actividad reciente del usuario autenticado
 *
 * @route GET /api/usuarios/me/activity
 * @header Authorization: Bearer <token>
 * @returns {Array} Lista de reservaciones recientes
 */
router.get(
  "/usuarios/me/activity",
  auth,
  asyncHandler(async (req, res) => {
    const idUsuario = req.usuario.idUsuario;

    const sql = `
      SELECT r.idReservacion, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
             r.hora_inicio, r.hora_fin,
             c.nombre AS cancha,
             CASE
               WHEN r.fecha >= CURDATE() THEN 'upcoming'
               ELSE 'completed'
             END AS status
      FROM RESERVACIONES r
      JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
      WHERE r.USUARIOS_idUsuario = ?
      ORDER BY r.fecha DESC, r.hora_inicio DESC
      LIMIT 5
    `;

    const [results] = await pool.query(sql, [idUsuario]);
    res.json(results);
  }),
);

/**
 * GET /api/usuarios/:id
 *
 * Obtiene un usuario específico por ID
 *
 * @route GET /api/usuarios/:id
 * @param {number} id - ID del usuario
 * @returns {Object} Datos del usuario
 */
router.get(
  "/usuarios/:id",
  adminAuth,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de usuario invalido" });
    }

    const sql = `
      SELECT idUsuario, nombre, email, telefono
      FROM USUARIOS
      WHERE idUsuario = ?
    `;

    const [results] = await pool.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(results[0]);
  }),
);

/**
 * PUT /api/usuarios/:id
 *
 * Actualiza un usuario específico (solo admin)
 *
 * @route PUT /api/usuarios/:id
 * @param {number} id - ID del usuario
 * @param {string} nombre - Nuevo nombre del usuario
 * @param {string} email - Nuevo email del usuario
 * @param {string} telefono - Nuevo teléfono del usuario
 * @returns {Object} Mensaje de éxito
 */
router.put(
  "/usuarios/:id",
  adminAuth,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de usuario invalido" });
    }
    const { nombre, email, telefono } = req.body;

    // Validar que al menos un campo esté presente
    if (!nombre && !email && telefono === undefined) {
      return res.status(400).json({
        error: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    // Construir consulta de actualización dinámica
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre.trim());
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Formato de email invalido",
        });
      }
      updates.push("email = ?");
      values.push(email.trim());
    }

    if (telefono !== undefined) {
      updates.push("telefono = ?");
      values.push(telefono === "" ? null : telefono);
    }

    values.push(id);

    const sql = `UPDATE USUARIOS SET ${updates.join(", ")} WHERE idUsuario = ?`;

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Obtener datos actualizados del usuario
    const [updated] = await pool.query(
      "SELECT idUsuario, nombre, email, telefono FROM USUARIOS WHERE idUsuario = ?",
      [id],
    );

    res.json({
      message: "Usuario actualizado exitosamente",
      user: updated[0],
    });
  }),
);

/**
 * DELETE /api/usuarios/:id
 *
 * Elimina un usuario específico (solo admin)
 *
 * @route DELETE /api/usuarios/:id
 * @param {number} id - ID del usuario
 * @returns {Object} Mensaje de éxito
 */
router.delete(
  "/usuarios/:id",
  adminAuth,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de usuario invalido" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Primero eliminar las reservaciones del usuario
      await connection.query("DELETE FROM RESERVACIONES WHERE USUARIOS_idUsuario = ?", [
        id,
      ]);

      // Luego eliminar el usuario
      const [result] = await connection.query(
        "DELETE FROM USUARIOS WHERE idUsuario = ?",
        [id],
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      res.json({
        message: "Usuario eliminado exitosamente",
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),
);

// Exportar router para usar en index.js
module.exports = router;
