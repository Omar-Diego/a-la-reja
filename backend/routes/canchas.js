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
    // Consulta SQL para obtener todas las canchas
    // Solo seleccionar campos necesarios por seguridad
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

// Exportar router para usar en index.js
module.exports = router;
