/* Servidor de la aplicación de Reservación de Canchas de Pádel */

// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

// Importa el framework Express para crear el servidor web
const express = require('express');

// Inicializa la aplicación Express
const app = express();

// Middleware para parsear solicitudes JSON en el cuerpo de las peticiones
app.use(express.json());

// Middleware para registrar cada solicitud entrante en la consola
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

/* Importación de Rutas */
// Rutas para gestión de usuarios (registro y login)
const usuariosRoutes = require('./routes/usuarios');

// Rutas para gestión de reservaciones (CRUD completo)
const reservacionesRoutes = require("./routes/reservaciones");

// Rutas para consulta de canchas disponibles
const canchasRoutes = require("./routes/canchas");


/* Configuración de Rutas */
// Todas las rutas estaran bajo el prefijo /api
app.use('/api', usuariosRoutes);
app.use('/api', reservacionesRoutes);
app.use('/api', canchasRoutes);

/* Inicio del Servidor */
// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
