/**
 * Rutas de Gestion de Reservaciones
 *
 * Este módulo maneja operaciones CRUD de reservaciones.
 * Características:
 * - Crear, leer, actualizar y eliminar reservaciones
 * - Validación de disponibilidad para prevenir doble reserva
 * - Autenticación JWT para rutas protegidas
 * - Consultas de base de datos async/await con pool de conexiones
 * - Manejo de errores seguro
 */

// Registrar carga del módulo (depuración en desarrollo)
console.log("[Routes] Reservaciones routes loaded");

// Importar framework Express
const express = require("express");

// Crear router para definir rutas
const router = express.Router();

// Importar el pool de conexiones de base de datos
const { pool } = require("../config/db");

// Importar middleware de autenticación JWT
const auth = require("../middlewares/auth");

// Importar middleware de autenticación para administradores
const adminAuth = require("../middlewares/adminAuth");

// Middleware condicional: requiere adminAuth solo cuando no se usan filtros de disponibilidad
const requireAdminIfUnfiltered = (req, res, next) => {
  if (req.query.fecha && req.query.canchaId) {
    return next(); // Consulta pública de disponibilidad
  }
  return adminAuth(req, res, next); // Lista completa: solo admins
};

// Importar manejador asíncrono para manejo de errores
const { asyncHandler } = require("../middlewares/dbErrorHandler");

// Importar utilidades de correo
const { enviarConfirmacionReservacion } = require("../utils/email");

/**
 * POST /api/reservaciones
 *
 * Crea una nueva reservación de cancha
 *
 * @route POST /api/reservaciones
 * @header Authorization: Bearer <token>
 * @param {string} fecha - Fecha de reservación (YYYY-MM-DD)
 * @param {string} hora_inicio - Hora de inicio (HH:MM:SS)
 * @param {string} hora_fin - Hora de fin (HH:MM:SS)
 * @param {number} idCancha - ID de cancha a reservar
 * @returns {Object} Mensaje de éxito e ID de reservación
 *
 * Consideraciones de seguridad:
 * - Requiere autenticación JWT
 * - Usa consultas parametrizadas para prevenir inyección SQL
 * - Valida disponibilidad antes de crear reservación
 * - Solo usa ID de usuario autenticado (del token, no de la petición)
 */
router.post(
  "/reservaciones",
  auth,
  asyncHandler(async (req, res) => {
    // Extraer datos de reservación del cuerpo de la petición
    const { fecha, hora_inicio, hora_fin, idCancha, monto } = req.body;

    // Obtener ID de usuario autenticado del token JWT (establecido por middleware auth)
    const idUsuario = req.usuario.idUsuario;

    // Validar campos requeridos
    if (
      !fecha ||
      !hora_inicio ||
      !hora_fin ||
      !idCancha ||
      monto === undefined
    ) {
      return res.status(400).json({
        error: "Fecha, hora_inicio, hora_fin, idCancha y monto son requeridos",
      });
    }

    // Validar que el monto sea un número positivo
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({
        error: "El monto debe ser un número positivo",
      });
    }

    // Validar formato de fecha (validación básica)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return res.status(400).json({
        error: "Formato de fecha invalido. Use YYYY-MM-DD",
      });
    }

    // Validar formato de hora (validación básica)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
      return res.status(400).json({
        error: "Formato de hora invalido. Use HH:MM o HH:MM:SS",
      });
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        error: "La hora de fin debe ser posterior a la hora de inicio",
      });
    }

    // Usar transacción para prevenir race conditions
    // Esto asegura que dos personas no puedan reservar el mismo horario simultáneamente
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Consulta de validación de disponibilidad con bloqueo de filas (FOR UPDATE)
      // Esto bloquea las filas hasta que la transacción termine
      const validarSql = `
        SELECT idReservacion FROM RESERVACIONES
        WHERE fecha = ?
        AND CANCHAS_idCancha = ?
        AND (
          hora_inicio < ?
          AND hora_fin > ?
        )
        LIMIT 1
        FOR UPDATE
      `;

      // Ejecutar verificación de disponibilidad con bloqueo
      const [existentes] = await connection.query(validarSql, [
        fecha,
        idCancha,
        hora_fin,
        hora_inicio,
      ]);

      // Si existe una reservación que se superpone, hacer rollback y retornar error
      if (existentes.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          error: "La cancha ya esta reservada en ese horario",
        });
      }

      // Insertar nueva reservación
      const insertSql = `
        INSERT INTO RESERVACIONES
        (fecha, hora_inicio, hora_fin, USUARIOS_idUsuario, CANCHAS_idCancha, monto)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      // Ejecutar consulta de inserción
      const [result] = await connection.query(insertSql, [
        fecha,
        hora_inicio,
        hora_fin,
        idUsuario,
        idCancha,
        monto,
      ]);

      // Confirmar transacción
      await connection.commit();
      connection.release();

      // Enviar correo de confirmación (async, no bloquea la respuesta)
      // Obtenemos datos del usuario y cancha para el correo
      const usuarioSql = `SELECT u.nombre, u.email, c.nombre as nombreCancha 
        FROM USUARIOS u 
        JOIN RESERVACIONES r ON r.USUARIOS_idUsuario = u.idUsuario 
        JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha 
        WHERE r.idReservacion = ?`;

      const [usuarioData] = await pool.query(usuarioSql, [result.insertId]);

      if (
        usuarioData.length > 0 &&
        usuarioData[0].email &&
        process.env.RESEND_API_KEY
      ) {
        const usuario = usuarioData[0];
        // Enviar correo sin esperar (fire and forget)
        enviarConfirmacionReservacion(usuario.email, usuario.nombre, {
          fecha,
          hora_inicio,
          hora_fin,
          cancha: usuario.nombreCancha,
          monto,
        }).catch((err) =>
          console.error("[Email] Error secundario:", err.message),
        );
      }

      // Retornar respuesta de éxito
      res.status(201).json({
        message: "Reservacion creada exitosamente",
        idReservacion: result.insertId,
      });
    } catch (error) {
      // En caso de error, hacer rollback
      await connection.rollback();
      connection.release();
      throw error;
    }
  }),
);

/**
 * GET /api/reservaciones
 *
 * Obtiene todas las reservaciones del sistema
 *
 * @route GET /api/reservaciones
 * @query {string} fecha - Filtrar por fecha (opcional)
 * @query {number} canchaId - Filtrar por ID de cancha (opcional)
 * @returns {Array} Lista de reservaciones con información de usuario y cancha
 *
 * Consideraciones de seguridad:
 * - Usa consultas parametrizadas
 * - No expone datos sensibles de usuario
 * - Endpoint público (no requiere autenticación)
 */
router.get(
  "/reservaciones",
  requireAdminIfUnfiltered,
  asyncHandler(async (req, res) => {
    // Verificar si se filtra por fecha y cancha
    const { fecha, canchaId } = req.query;

    // Si se proporcionan ambos filtros, retornar resultados filtrados
    if (fecha && canchaId) {
      // Validar que canchaId sea un número
      const courtId = parseInt(canchaId, 10);
      if (isNaN(courtId) || courtId <= 0) {
        return res.status(400).json({
          error: "ID de cancha invalido",
        });
      }

      // Consulta SQL para reservaciones filtradas (para verificar disponibilidad)
      const sql = `
      SELECT idReservacion, hora_inicio, hora_fin
      FROM RESERVACIONES
      WHERE DATE_FORMAT(fecha, '%Y-%m-%d') = ?
      AND CANCHAS_idCancha = ?
      ORDER BY hora_inicio
    `;

      const [resultados] = await pool.query(sql, [fecha, courtId]);
      return res.json(resultados);
    }

    // Si no hay filtros, retornar todas las reservaciones con detalles
    // Usar DATE_FORMAT para garantizar formato YYYY-MM-DD consistente
    // LEFT JOIN con USUARIOS porque puede ser NULL si el usuario fue eliminado
    const sql = `
    SELECT r.idReservacion, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha, r.hora_inicio, r.hora_fin,
           COALESCE(u.nombre, 'Usuario eliminado') AS usuario,
           c.nombre AS cancha,
           r.monto AS precio
    FROM RESERVACIONES r
    LEFT JOIN USUARIOS u ON r.USUARIOS_idUsuario = u.idUsuario
    JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
    ORDER BY r.fecha DESC, r.hora_inicio DESC
  `;

    const [resultados] = await pool.query(sql);
    res.json(resultados);
  }),
);

/**
 * GET /api/reservaciones/usuario
 *
 * Obtiene las reservaciones del usuario autenticado
 *
 * @route GET /api/reservaciones/usuario
 * @header Authorization: Bearer <token>
 * @returns {Array} Lista de reservaciones del usuario
 *
 * Consideraciones de seguridad:
 * - Requiere autenticación JWT
 * - Usa ID de usuario del token (no de la petición)
 * - Solo retorna las reservaciones propias del usuario
 */
router.get(
  "/reservaciones/usuario",
  auth,
  asyncHandler(async (req, res) => {
    // Obtener ID de usuario autenticado del token JWT
    const idUsuario = req.usuario.idUsuario;

    // Consulta SQL para obtener reservaciones del usuario
    // Usar DATE_FORMAT para garantizar formato YYYY-MM-DD consistente
    const sql = `
    SELECT r.idReservacion, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha, r.hora_inicio, r.hora_fin,
           c.nombre AS cancha, c.ubicacion
    FROM RESERVACIONES r
    JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
    WHERE r.USUARIOS_idUsuario = ?
    ORDER BY r.fecha, r.hora_inicio
  `;

    const [resultados] = await pool.query(sql, [idUsuario]);
    res.json(resultados);
  }),
);

/**
 * GET /api/reservaciones/:idReservacion
 *
 * Obtiene una reservación específica por ID
 *
 * @route GET /api/reservaciones/:idReservacion
 * @param {number} idReservacion - ID de reservación
 * @returns {Object} Detalles de la reservación
 *
 * Consideraciones de seguridad:
 * - Usa consultas parametrizadas
 * - Valida que el ID sea un número
 */
router.get(
  "/reservaciones/:idReservacion",
  auth,
  asyncHandler(async (req, res) => {
    // Extraer y validar ID de reservación
    const { idReservacion } = req.params;

    const id = parseInt(idReservacion, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de reservacion invalido",
      });
    }

    // Consulta SQL para obtener detalles de reservación
    // Usar DATE_FORMAT para garantizar formato YYYY-MM-DD consistente
    // LEFT JOIN con USUARIOS porque puede ser NULL si el usuario fue eliminado
    const sql = `
    SELECT r.idReservacion, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha, r.hora_inicio, r.hora_fin,
           r.USUARIOS_idUsuario,
           COALESCE(u.nombre, 'Usuario eliminado') AS usuario,
           c.nombre AS cancha, c.ubicacion, c.precio_por_hora
    FROM RESERVACIONES r
    LEFT JOIN USUARIOS u ON r.USUARIOS_idUsuario = u.idUsuario
    JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
    WHERE r.idReservacion = ?
  `;

    const [resultados] = await pool.query(sql, [id]);

    if (resultados.length === 0) {
      return res.status(404).json({
        error: "Reservacion no encontrada",
      });
    }

    const reservacion = resultados[0];

    // Verificar que el usuario autenticado sea el propietario o un admin
    if (
      reservacion.USUARIOS_idUsuario !== req.usuario.idUsuario &&
      req.usuario.role !== "admin"
    ) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    res.json(resultados[0]);
  }),
);

/**
 * DELETE /api/reservaciones/:idReservacion
 *
 * Cancela/elimina una reservación
 *
 * @route DELETE /api/reservaciones/:idReservacion
 * @header Authorization: Bearer <token>
 * @param {number} idReservacion - ID de reservación a eliminar
 * @returns {Object} Mensaje de éxito
 *
 * Consideraciones de seguridad:
 * - Requiere autenticación JWT
 * - Solo el propietario puede eliminar su reservación
 * - Usa ID de usuario del token (no de la petición)
 */
router.delete(
  "/reservaciones/:idReservacion",
  auth,
  asyncHandler(async (req, res) => {
    // Extraer ID de reservación de los parámetros de URL
    const { idReservacion } = req.params;

    // Obtener ID de usuario autenticado del token JWT
    const idUsuario = req.usuario.idUsuario;

    // Validar ID de reservación
    const id = parseInt(idReservacion, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de reservacion invalido",
      });
    }

    // Consulta SQL para eliminar reservación
    // Solo elimina si pertenece al usuario autenticado
    const sql = `
    DELETE FROM RESERVACIONES
    WHERE idReservacion = ? AND USUARIOS_idUsuario = ?
  `;

    const [resultado] = await pool.query(sql, [id, idUsuario]);

    // Verificar si alguna fila fue afectada
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "Reservacion no encontrada o no pertenece al usuario",
      });
    }

    res.json({ message: "Reservacion cancelada correctamente" });
  }),
);

/**
 * PUT /api/reservaciones/:idReservacion
 *
 * Actualiza/modifica una reservación
 *
 * @route PUT /api/reservaciones/:idReservacion
 * @header Authorization: Bearer <token>
 * @param {number} idReservacion - ID de reservación a actualizar
 * @param {string} fecha - Nueva fecha
 * @param {string} hora_inicio - Nueva hora de inicio
 * @param {string} hora_fin - Nueva hora de fin
 * @param {number} idCancha - Nuevo ID de cancha
 * @returns {Object} Mensaje de éxito
 *
 * Consideraciones de seguridad:
 * - Requiere autenticación JWT
 * - Solo el propietario puede modificar su reservación
 * - Valida disponibilidad para prevenir doble reserva
 * - Usa consultas parametrizadas
 */
router.put(
  "/reservaciones/:idReservacion",
  auth,
  asyncHandler(async (req, res) => {
    // Extraer ID de reservación de los parámetros de URL
    const { idReservacion } = req.params;

    // Extraer nuevos datos del cuerpo de la petición
    const { fecha, hora_inicio, hora_fin, idCancha } = req.body;

    // Obtener ID de usuario autenticado del token JWT
    const idUsuario = req.usuario.idUsuario;

    // Validar ID de reservación
    const id = parseInt(idReservacion, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de reservacion invalido",
      });
    }

    // Validar campos requeridos
    if (!fecha || !hora_inicio || !hora_fin || !idCancha) {
      return res.status(400).json({
        error: "Fecha, hora_inicio, hora_fin e idCancha son requeridos",
      });
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return res.status(400).json({
        error: "Formato de fecha invalido. Use YYYY-MM-DD",
      });
    }

    // Validar formato de hora
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
      return res.status(400).json({
        error: "Formato de hora invalido. Use HH:MM o HH:MM:SS",
      });
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        error: "La hora de fin debe ser posterior a la hora de inicio",
      });
    }

    // Primero, verificar que la reservación existe y pertenece al usuario
    const verifyOwnerSql = `
    SELECT idReservacion FROM RESERVACIONES
    WHERE idReservacion = ? AND USUARIOS_idUsuario = ?
  `;

    const [ownerCheck] = await pool.query(verifyOwnerSql, [id, idUsuario]);

    if (ownerCheck.length === 0) {
      return res.status(404).json({
        error: "Reservacion no encontrada o no pertenece al usuario",
      });
    }

    // Validación de disponibilidad (excluyendo la reservación actual)
    const validarSql = `
    SELECT idReservacion FROM RESERVACIONES
    WHERE fecha = ?
    AND CANCHAS_idCancha = ?
    AND idReservacion != ?
    AND (
      hora_inicio < ?
      AND hora_fin > ?
    )
    LIMIT 1
  `;

    const [existentes] = await pool.query(validarSql, [
      fecha,
      idCancha,
      id,
      hora_fin,
      hora_inicio,
    ]);

    // Si existe una reservación que se superpone, retornar error de conflicto
    if (existentes.length > 0) {
      return res.status(409).json({
        error: "La cancha ya esta reservada en ese horario",
      });
    }

    // Actualizar reservación
    const updateSql = `
    UPDATE RESERVACIONES
    SET fecha = ?, hora_inicio = ?, hora_fin = ?, CANCHAS_idCancha = ?
    WHERE idReservacion = ? AND USUARIOS_idUsuario = ?
  `;

    const [result] = await pool.query(updateSql, [
      fecha,
      hora_inicio,
      hora_fin,
      idCancha,
      id,
      idUsuario,
    ]);

    // Verificar si la actualización fue exitosa
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Reservacion no encontrada o no pertenece al usuario",
      });
    }

    res.json({ message: "Reservacion modificada correctamente" });
  }),
);

/**
 * DELETE /api/admin/reservaciones/:idReservacion
 *
 * Elimina cualquier reservación (solo admin)
 *
 * @route DELETE /api/admin/reservaciones/:idReservacion
 * @param {number} idReservacion - ID de reservación a eliminar
 * @returns {Object} Mensaje de éxito
 *
 * Nota: Este endpoint está destinado para uso administrativo
 * y no requiere verificar el propietario de la reservación
 */
router.delete(
  "/admin/reservaciones/:idReservacion",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { idReservacion } = req.params;

    const id = parseInt(idReservacion, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de reservacion invalido",
      });
    }

    const sql = `DELETE FROM RESERVACIONES WHERE idReservacion = ?`;

    const [resultado] = await pool.query(sql, [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "Reservacion no encontrada",
      });
    }

    res.json({ message: "Reservacion eliminada correctamente" });
  }),
);

// Exportar router para usar en index.js
module.exports = router;
