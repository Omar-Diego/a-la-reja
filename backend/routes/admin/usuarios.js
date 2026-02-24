/**
 * Rutas de Administracion de Usuarios
 *
 * Responsabilidad unica: operaciones administrativas sobre usuarios.
 * - GET    /api/usuarios      — Listar todos los usuarios
 * - GET    /api/usuarios/:id  — Obtener usuario por ID
 * - PUT    /api/usuarios/:id  — Actualizar usuario por ID
 * - DELETE /api/usuarios/:id  — Eliminar usuario por ID (con transacción)
 *
 * Todos los endpoints requieren privilegios de administrador mediante adminAuth.
 */

const express = require("express");
const router = express.Router();

const { pool } = require("../../config/db");
const { asyncHandler } = require("../../middlewares/dbErrorHandler");
const adminAuth = require("../../middlewares/adminAuth");

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
 * IMPORTANTE: Las reservaciones del usuario se mantienen para preservar
 * el historial de ingresos, pero se desvinculan del usuario (USUARIOS_idUsuario = NULL).
 * Esto permite:
 * - Mantener el registro de ingresos históricos
 * - Preservar datos de reservaciones para auditoría
 * - No afectar las estadísticas de ingresos totales
 *
 * @route DELETE /api/usuarios/:id
 * @param {number} id - ID del usuario
 * @returns {Object} Mensaje de éxito con cantidad de reservaciones desvinculadas
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

      // Contar reservaciones antes de desvincularlas
      const [countResult] = await connection.query(
        "SELECT COUNT(*) as total FROM RESERVACIONES WHERE USUARIOS_idUsuario = ?",
        [id]
      );
      const reservacionesCount = countResult[0].total;

      // Desvincular las reservaciones del usuario (poner NULL en lugar de eliminar)
      // Esto preserva el historial de ingresos y reservaciones
      await connection.query(
        "UPDATE RESERVACIONES SET USUARIOS_idUsuario = NULL WHERE USUARIOS_idUsuario = ?",
        [id]
      );

      // Eliminar el usuario
      const [result] = await connection.query(
        "DELETE FROM USUARIOS WHERE idUsuario = ?",
        [id]
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      res.json({
        message: "Usuario eliminado exitosamente",
        reservacionesDesvinculadas: reservacionesCount,
        nota: "Las reservaciones del usuario se mantuvieron para preservar el historial de ingresos"
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),
);

module.exports = router;
