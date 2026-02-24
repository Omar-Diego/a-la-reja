/**
 * Rutas de Perfil del Usuario
 *
 * Responsabilidad unica: operaciones sobre el perfil del usuario autenticado.
 * - GET  /api/usuarios/me          — Obtener perfil propio
 * - PUT  /api/usuarios/me          — Actualizar perfil propio
 * - GET  /api/usuarios/me/stats    — Estadísticas del usuario
 * - GET  /api/usuarios/me/activity — Actividad reciente del usuario
 *
 * Todos los endpoints requieren autenticación JWT mediante el middleware auth.
 */

const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { asyncHandler } = require("../middlewares/dbErrorHandler");
const auth = require("../middlewares/auth");

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

module.exports = router;
