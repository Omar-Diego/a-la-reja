/**
 * Rutas de Gestion de Canchas
 *
 * Este módulo maneja consultas de canchas.
 * Características:
 * - Listar todas las canchas disponibles
 * - Consultas de base de datos async/await con pool de conexiones
 * - Manejo de errores seguro
 */

// Registrar carga del módulo (depuración en desarrollo)
console.log("[Routes] Canchas routes loaded");

// Importar framework Express
const express = require("express");

// Crear router para definir rutas
const router = express.Router();

// Importar el pool de conexiones de base de datos
const { pool } = require("../config/db");

// Importar manejador asíncrono para manejo de errores
const { asyncHandler } = require("../middlewares/dbErrorHandler");

// Importar middleware de autenticación para administradores
const adminAuth = require("../middlewares/adminAuth");

/**
 * GET /api/canchas
 *
 * Obtiene todas las canchas disponibles
 *
 * @route GET /api/canchas
 * @returns {Array} Lista de canchas con nombre, ubicación y precio por hora
 *
 * Consideraciones de seguridad:
 * - Usa consultas parametrizadas (sin entrada de usuario en esta consulta)
 * - Retorna solo campos necesarios
 * - No requiere autenticación (endpoint público)
 */
router.get(
  "/canchas",
  asyncHandler(async (req, res) => {
    // Consulta SQL para obtener todas las canchas (solo datos públicos)
    const sql = `
    SELECT idCancha, nombre, ubicacion, precio_por_hora
    FROM CANCHAS
    ORDER BY nombre
  `;

    // Ejecutar consulta usando pool de conexiones
    const [resultados] = await pool.query(sql);

    // Retornar lista de canchas
    res.json(resultados);
  }),
);

/**
 * GET /api/canchas/stats
 *
 * Obtiene estadísticas de canchas (solo admin)
 *
 * @route GET /api/canchas/stats
 * @returns {Array} Lista de canchas con totalReservaciones e ingresos
 */
router.get(
  "/canchas/stats",
  adminAuth,
  asyncHandler(async (req, res) => {
    const sql = `
    SELECT c.idCancha, c.nombre, c.ubicacion, c.precio_por_hora,
           COUNT(r.idReservacion) as totalReservaciones,
           COUNT(r.idReservacion) * c.precio_por_hora as ingresos
    FROM CANCHAS c
    LEFT JOIN RESERVACIONES r ON c.idCancha = r.CANCHAS_idCancha
    GROUP BY c.idCancha
    ORDER BY c.nombre
  `;

    const [resultados] = await pool.query(sql);
    res.json(resultados);
  }),
);

/**
 * GET /api/canchas/top
 *
 * Obtiene las 3 canchas más rentadas (con más reservaciones)
 *
 * @route GET /api/canchas/top
 * @returns {Array} Lista de las 3 canchas más populares
 */
router.get(
  "/canchas/top",
  asyncHandler(async (req, res) => {
    const sql = `
      SELECT c.idCancha, c.nombre, c.ubicacion, c.precio_por_hora,
             COUNT(r.idReservacion) as totalReservaciones
      FROM CANCHAS c
      LEFT JOIN RESERVACIONES r ON c.idCancha = r.CANCHAS_idCancha
      GROUP BY c.idCancha
      ORDER BY totalReservaciones DESC, c.nombre ASC
      LIMIT 3
    `;

    const [resultados] = await pool.query(sql);
    res.json(resultados);
  }),
);

/**
 * GET /api/canchas/by-slug/:slug
 *
 * Obtiene una cancha por su slug (nombre normalizado)
 *
 * @route GET /api/canchas/by-slug/:slug
 * @param {string} slug - Slug de la cancha (ej: "pista-1", "pista-central")
 * @returns {Object} Detalles de la cancha
 */
router.get(
  "/canchas/by-slug/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Convertir slug a nombre buscable
    // Remover guiones y capitalizar
    const searchName = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const sql = `
      SELECT idCancha, nombre, ubicacion, precio_por_hora
      FROM CANCHAS
      WHERE LOWER(REPLACE(nombre, ' ', '-')) = LOWER(?)
         OR LOWER(nombre) = LOWER(?)
         OR nombre LIKE ?
    `;

    const [resultados] = await pool.query(sql, [
      slug,
      searchName,
      `%${searchName}%`,
    ]);

    if (resultados.length === 0) {
      return res.status(404).json({
        error: "Cancha no encontrada",
      });
    }

    res.json(resultados[0]);
  }),
);

/**
 * GET /api/canchas/:idCancha
 *
 * Obtiene una cancha específica por ID
 *
 * @route GET /api/canchas/:idCancha
 * @param {number} idCancha - ID de la cancha
 * @returns {Object} Detalles de la cancha
 *
 * Consideraciones de seguridad:
 * - Usa consultas parametrizadas para prevenir inyección SQL
 * - Valida que el ID sea un número
 */
router.get(
  "/canchas/:idCancha",
  asyncHandler(async (req, res) => {
    // Extraer y validar ID de cancha
    const { idCancha } = req.params;

    // Validar que idCancha sea un número válido
    const id = parseInt(idCancha, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de cancha invalido",
      });
    }

    // Consulta SQL para obtener cancha específica
    const sql = `
    SELECT idCancha, nombre, ubicacion, precio_por_hora
    FROM CANCHAS
    WHERE idCancha = ?
  `;

    // Ejecutar consulta usando pool de conexiones
    const [resultados] = await pool.query(sql, [id]);

    // Verificar si se encontró la cancha
    if (resultados.length === 0) {
      return res.status(404).json({
        error: "Cancha no encontrada",
      });
    }

    // Retornar detalles de la cancha
    res.json(resultados[0]);
  }),
);

/**
 * POST /api/canchas
 *
 * Crea una nueva cancha
 *
 * @route POST /api/canchas
 * @param {string} nombre - Nombre de la cancha
 * @param {string} ubicacion - Descripción/ubicación de la cancha
 * @param {number} precio_por_hora - Precio por hora
 * @returns {Object} Mensaje de éxito e ID de la nueva cancha
 */
router.post(
  "/canchas",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { nombre, ubicacion, precio_por_hora } = req.body;

    // Validar campos requeridos
    if (!nombre || !ubicacion || precio_por_hora === undefined) {
      return res.status(400).json({
        error: "Nombre, ubicacion y precio_por_hora son requeridos",
      });
    }

    // Validar precio
    const precio = parseFloat(precio_por_hora);
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({
        error: "Precio por hora debe ser un número positivo",
      });
    }

    const sql = `
      INSERT INTO CANCHAS (nombre, ubicacion, precio_por_hora)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      nombre.trim(),
      ubicacion.trim(),
      precio,
    ]);

    res.status(201).json({
      message: "Cancha creada exitosamente",
      idCancha: result.insertId,
    });
  }),
);

/**
 * PUT /api/canchas/:idCancha
 *
 * Actualiza una cancha existente
 *
 * @route PUT /api/canchas/:idCancha
 * @param {number} idCancha - ID de la cancha
 * @param {string} nombre - Nuevo nombre de la cancha
 * @param {string} ubicacion - Nueva descripción/ubicación
 * @param {number} precio_por_hora - Nuevo precio por hora
 * @returns {Object} Mensaje de éxito
 */
router.put(
  "/canchas/:idCancha",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { idCancha } = req.params;
    const { nombre, ubicacion, precio_por_hora } = req.body;

    const id = parseInt(idCancha, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de cancha invalido",
      });
    }

    // Construir consulta dinámica
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre.trim());
    }

    if (ubicacion !== undefined) {
      updates.push("ubicacion = ?");
      values.push(ubicacion.trim());
    }

    if (precio_por_hora !== undefined) {
      const precio = parseFloat(precio_por_hora);
      if (isNaN(precio) || precio < 0) {
        return res.status(400).json({
          error: "Precio por hora debe ser un número positivo",
        });
      }
      updates.push("precio_por_hora = ?");
      values.push(precio);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    values.push(id);
    const sql = `UPDATE CANCHAS SET ${updates.join(", ")} WHERE idCancha = ?`;

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Cancha no encontrada",
      });
    }

    // Obtener cancha actualizada
    const [updated] = await pool.query(
      "SELECT idCancha, nombre, ubicacion, precio_por_hora FROM CANCHAS WHERE idCancha = ?",
      [id],
    );

    res.json({
      message: "Cancha actualizada exitosamente",
      cancha: updated[0],
    });
  }),
);

/**
 * DELETE /api/canchas/:idCancha
 *
 * Elimina una cancha
 *
 * @route DELETE /api/canchas/:idCancha
 * @param {number} idCancha - ID de la cancha
 * @returns {Object} Mensaje de éxito
 */
router.delete(
  "/canchas/:idCancha",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { idCancha } = req.params;

    const id = parseInt(idCancha, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "ID de cancha invalido",
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Primero eliminar las reservaciones asociadas
      await connection.query("DELETE FROM RESERVACIONES WHERE CANCHAS_idCancha = ?", [
        id,
      ]);

      // Luego eliminar la cancha
      const [result] = await connection.query(
        "DELETE FROM CANCHAS WHERE idCancha = ?",
        [id],
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Cancha no encontrada",
        });
      }

      res.json({
        message: "Cancha eliminada exitosamente",
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
