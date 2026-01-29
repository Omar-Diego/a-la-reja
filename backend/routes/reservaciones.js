// Rutas de Gestión de Reservaciones

// Mensaje para que saber si cargaron las rutas
console.log("Rutas de reservacion cargadas")

// Importa express
const express = require("express");

// Crea el router
const router = express.Router();

// Importa la configuración de la base de datos
const db = require("../config/db");

// Importa el middleware de autenticación JWT
const auth = require("../middlewares/auth");

// POST /api/reservaciones
/**
 * Crea una nueva reservación de cancha
 * Requiere autenticación (token JWT válido)
 * Valida que no haya conflictos de horarios
 * @header Authorization: Bearer <token>
 * @param {string} fecha - Fecha de la reservación (YYYY-MM-DD)
 * @param {string} hora_inicio - Hora de inicio (HH:MM:SS)
 * @param {string} hora_fin - Hora de fin (HH:MM:SS)
 * @param {number} idCancha - ID de la cancha a reservar
 * @returns {Object} Mensaje de éxito y ID de la reservación
 */
router.post("/reservaciones", auth, (req, res) => {
  // Extrae los datos del cuerpo de la solicitud
  const {
    fecha,
    hora_inicio,
    hora_fin,
    idCancha
  } = req.body;

  // Obtiene el ID del usuario autenticado desde el middleware auth
  // El middleware auth decodifica el token y guarda la información en req.usuario
  const idUsuario = req.usuario.idUsuario;

  // Validación de Disponibilidad
  // Consulta SQL para verificar si ya existe una reservación
  // en el mismo horario para la misma cancha y fecha
  const validarSql = `
    SELECT * FROM RESERVACIONES
    WHERE fecha = ?
    AND CANCHAS_idCancha = ?
    AND (
      hora_inicio < ?
      AND hora_fin > ?
    )
  `;

  // Ejecuta la consulta de validación
  db.query(
    validarSql,
    [fecha, idCancha, hora_fin, hora_inicio],
    (error, resultados) => {
      // Si hay un error en la consulta, responde con error 500
      if (error) {
        return res.status(500).json({ error: "Error al validar disponibilidad" });
      }

      // Si hay resultados, significa que ya existe una reservación en ese horario
      if (resultados.length > 0) {
        return res.status(409).json({
          error: "La cancha ya está reservada en ese horario"
        });
      }

      // Inserción de la Reservación

      // Consulta SQL para insertar una nueva reservación
      const insertSql = `
        INSERT INTO RESERVACIONES
        (fecha, hora_inicio, hora_fin, USUARIOS_idUsuario, CANCHAS_idCancha)
        VALUES (?, ?, ?, ?, ?)
      `;

      // Ejecuta la consulta de inserción
      db.query(
        insertSql,
        [fecha, hora_inicio, hora_fin, idUsuario, idCancha],
        (error, result) => {
          // Si hay un error en la consulta, responde con error 500
          if (error) {
            console.error(error);
            return res.status(500).json({
              error: "Error al crear reservación",
              detalle: error.sqlMessage
            });
          }

          // Responde con éxito, incluyendo el ID de la nueva reservación
          res.status(201).json({
            message: "Reservación creada",
            idReservacion: result.insertId
          });
        }
      );
    }
  );
});

// GET /api/reservaciones (Todas las reservaciones)
/**
 * Obtiene todas las reservaciones del sistema
 * Incluye información del usuario y la cancha
 * No requiere autenticación
 * @returns {Array} Lista de todas las reservaciones
 */
router.get("/reservaciones", (req, res) => {
  // Consulta SQL para obtener todas las reservaciones
  // Usa JOINs para incluir información del usuario y la cancha
  const sql = `
    SELECT r.idReservacion, r.fecha, r.hora_inicio, r.hora_fin,
           u.nombre AS usuario,
           c.nombre AS cancha
    FROM RESERVACIONES r
    JOIN USUARIOS u ON r.USUARIOS_idUsuario = u.idUsuario
    JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
    ORDER BY r.fecha, r.hora_inicio
  `;

  // Ejecuta la consulta
  db.query(sql, (error, resultados) => {
    // Si hay un error, responde con error 500
    if (error) {
      return res.status(500).json({ error: "Error al obtener reservaciones" });
    }

    // Responde con la lista de reservaciones
    res.json(resultados);
  });
});

// GET /api/reservaciones/usuario
//Obtiene las reservaciones del usuario autenticado
//Requiere autenticación (token JWT válido)

router.get("/reservaciones/usuario", auth, (req, res) => {
  // Obtiene el ID del usuario autenticado
  const { idUsuario } = req.usuario.idUsuario;

  // Consulta SQL para obtener reservaciones del usuario
  const sql = `
    SELECT r.idReservacion, r.fecha, r.hora_inicio, r.hora_fin,
           c.nombre AS cancha
    FROM RESERVACIONES r
    JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
    WHERE r.USUARIOS_idUsuario = ?
    ORDER BY r.fecha, r.hora_inicio
  `;

  // Ejecuta la consulta con el ID del usuario
  db.query(sql, [idUsuario], (error, resultados) => {
    // Si hay un error, responde con error 500
    if (error) {
      return res.status(500).json({ error: "Error al obtener reservaciones" });
    }

    // Responde con la lista de reservaciones del usuario
    res.json(resultados);
  });
});

// GET /api/reservaciones (Con filtros de fecha y cancha)
/**
 * Obtiene las reservaciones de una cancha específica en una fecha específica
 * Es util para consultar disponibilidad
 * No requiere autenticación
 * @param {string} fecha - Fecha a consultar (YYYY-MM-DD)
 * @param {number} canchaId - ID de la cancha
 * @returns {Array} Lista de horarios reservados
 */
router.get("/reservaciones", (req, res) => {
  // Extrae los parámetros de consulta (query params)
  const { fecha, canchaId } = req.query;

  // Valida que se proporcionen ambos parámetros
  if (!fecha || !canchaId) {
    return res.status(400).json({
      error: "Fecha y canchaId son requeridos"
    });
  }

  // Consulta SQL para obtener reservaciones filtradas
  const sql = `
    SELECT idReservacion, hora_inicio, hora_fin
    FROM RESERVACIONES
    WHERE fecha = ?
    AND CANCHAS_idCancha = ?
    ORDER BY hora_inicio
  `;

  // Ejecuta la consulta con los filtros
  db.query(sql, [fecha, canchaId], (error, resultados) => {
    // Si hay un error, responde con error 500
    if (error) {
      return res.status(500).json({
        error: "Error al obtener reservaciones"
      });
    }

    // Responde con la lista de horarios reservados
    res.json(resultados);
  });
});

// DELETE /api/reservaciones/:idReservacion
/**
 * Cancela/elimina una reservación del usuario autenticado
 * Requiere autenticación (token JWT válido)
 * Solo puede eliminar sus propias reservaciones
 * @header Authorization: Bearer <token>
 * @param {number} idReservacion - ID de la reservación a eliminar
 * @returns {Object} Mensaje de éxito
 */
router.delete("/reservaciones/:idReservacion", auth, (req, res) => {
  // Extrae el ID de la reservación de los parámetros de la URL
  const { idReservacion } = req.params;

  // Obtiene el ID del usuario autenticado
  const idUsuario = req.usuario.idUsuario;

  // Consulta SQL para eliminar la reservación
  // Solo elimina si pertenece al usuario autenticado
  const sql = `
    DELETE FROM RESERVACIONES WHERE idReservacion = ? AND USUARIOS_idUsuario = ?
  `;

  // Ejecuta la consulta de eliminación
  db.query(sql, [idReservacion, idUsuario], (error, resultado) => {
    // Si hay un error, responde con error 500
    if (error) {
      return res.status(500).json({
        error: "Error al eliminar la reservacion"
      });
    }

    // Verifica si se eliminó algún registro
    // Si affectedRows es 0, no se encontró la reservación o no pertenece al usuario
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "Reservación no encontrada o no pertenece al usuario"
      });
    }

    // Responde con éxito
    res.json({ message: "Reservacion cancelada correctamente" });
  });
});

// PUT /api/reservaciones/:idReservacion
/**
 * Edita/actualiza una reservación del usuario autenticado
 * Requiere autenticación (token JWT válido)
 * Valida que no haya conflictos de horarios al actualizar
 * Solo puede editar sus propias reservaciones
 * 
 * @route PUT /api/reservaciones/:idReservacion
 * @header Authorization: Bearer <token>
 * @param {number} idReservacion - ID de la reservación a editar
 * @param {string} fecha - Nueva fecha (opcional)
 * @param {string} hora_inicio - Nueva hora de inicio (opcional)
 * @param {string} hora_fin - Nueva hora de fin (opcional)
 * @param {number} idCancha - Nueva ID de cancha (opcional)
 * @returns {Object} Mensaje de éxito
 */
router.put("/reservaciones/:idReservacion", auth, (req, res) => {
  // Extrae el ID de la reservación de los parámetros de la URL
  const { idReservacion } = req.params;

  // Extrae los nuevos datos del cuerpo de la solicitud
  const {
    fecha,
    hora_inicio,
    hora_fin,
    idCancha
  } = req.body;

  // Obtiene el ID del usuario autenticado
  const idUsuario = req.usuario.idUsuario;

  // Validación de Disponibilidad (pero excluyendo la reservacion a editar)
  // ============================================

  // Consulta SQL para verificar disponibilidad
  // Excluye la reservación actual (idReservacion != ?)
  const validarSql = `
    SELECT * FROM RESERVACIONES
    WHERE fecha = ?
    AND CANCHAS_idCancha = ?
    AND idReservacion != ?
    AND (
      hora_inicio < ?
      AND hora_fin > ?
    )
  `;

  // Ejecuta la consulta de validación
  db.query(
    validarSql,
    [fecha, idCancha, idReservacion, hora_fin, hora_inicio],
    (error, resultados) => {
      // Si hay un error, responde con error 500
      if (error) {
        return res.status(500).json({ error: "Error al validar disponibilidad" });
      }

      // Si hay resultados, significa que ya existe otra reservación en ese horario
      if (resultados.length > 0) {
        return res.status(409).json({
          error: "La cancha ya está reservada en ese horario"
        });
      }

      // Actualización de la Reservación
      // Consulta SQL para actualizar la reservación
      const updateSql = `
        UPDATE RESERVACIONES 
        SET fecha = ?, hora_inicio = ?, hora_fin = ?, USUARIOS_idUsuario = ?, CANCHAS_idCancha = ?
        WHERE idReservacion = ? AND USUARIOS_idUsuario = ?
      `;

      // Ejecuta la consulta de actualización
      db.query(
        updateSql,
        [fecha, hora_inicio, hora_fin, idUsuario, idCancha, idReservacion, idUsuario],
        (error, result) => {
          // Si hay un error, responde con error 500
          if (error) {
            console.error(error);
            return res.status(500).json({
              error: "Error al actualizar reservación",
              detalle: error.sqlMessage
            });
          }

          // Verifica si se actualizó algún registro
          if (result.affectedRows === 0) {
            return res.status(404).json({
              error: "Reservación no encontrada o no pertenece al usuario"
            });
          }

          // Responde con éxito
          res.json({
            message: "Reservación modificada correctamente",
          });
        }
      );
    }
  );
});

// Exporta el enrutador para ser utilizado en index.js
module.exports = router;