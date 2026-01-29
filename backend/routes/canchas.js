// Rutas de Gestión de Canchas
// Mensaje de confirmación al cargar el módulo de rutas
console.log("Canchas cargadas")

// Importa el framework Express
const express = require("express");

// Crea un enrutador para definir las rutas de este módulo
const router = express.Router();

// Importa la configuración de la base de datos
const db = require("../config/db");


// GET /api/canchas
//Obtiene la lista de todas las canchas disponibles
//No requiere autenticación
//Regresa una lista de canchas con nombre, ubicación y precio por hora
router.get("/canchas", (req, res) => {
  // Consulta SQL para obtener todas las canchas
  const sql = `
    SELECT nombre, ubicacion, precio_por_hora FROM CANCHAS
  `;

  // Ejecuta la consulta en la base de datos
  db.query(sql, (error, resultados) => {
    // Si hay un error, responde con error 500
    if (error) {
      return res.status(500).json({ error: "Error al obtener canchas" });
    }

    // Si no hay error, responde con la lista de canchas
    res.json(resultados);
  });
});

// Exporta el enrutador para ser utilizado en index.js
module.exports = router;