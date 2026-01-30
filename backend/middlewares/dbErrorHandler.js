/**
 * Middleware de Manejo de Errores de Base de Datos
 *
 * Este middleware captura errores relacionados con la base de datos y proporciona:
 * - Mensajes de error genéricos a los clientes (sin detalles internos expuestos)
 * - Registro detallado del lado del servidor para depuración
 * - Códigos de estado HTTP apropiados basados en el tipo de error
 * - Manejo para diferentes códigos de error de MySQL
 */

/**
 * Referencia de Códigos de Error de MySQL
 *
 * Errores de Conexión:
 * - ECONNREFUSED: Servidor no alcanzable
 * - ETIMEDOUT: Conexión expiró
 * - EHOSTUNREACH: Host inalcanzable
 * - PROTOCOL_CONNECTION_LOST: Conexión perdida durante consulta
 * - ENOTFOUND: Búsqueda DNS fallida
 *
 * Errores de Autenticación/Acceso:
 * - ER_ACCESS_DENIED_ERROR (1045): Credenciales inválidas
 * - ER_DBACCESS_DENIED_ERROR (1044): Acceso denegado a la base de datos
 *
 * Errores de Consulta:
 * - ER_DUP_ENTRY (1062): Entrada duplicada para clave única
 * - ER_NO_REFERENCED_ROW (1216): Restricción de clave foránea falla (insertar)
 * - ER_ROW_IS_REFERENCED (1217): Restricción de clave foránea falla (eliminar)
 * - ER_NO_REFERENCED_ROW_2 (1452): Restricción de clave foránea falla
 * - ER_ROW_IS_REFERENCED_2 (1451): No se puede eliminar - referenciado por clave foránea
 * - ER_BAD_NULL_ERROR (1048): La columna no puede ser nula
 * - ER_DATA_TOO_LONG (1406): Datos demasiado largos para la columna
 * - ER_TRUNCATED_WRONG_VALUE (1292): Valor incorrecto
 * - ER_LOCK_WAIT_TIMEOUT (1205): Tiempo de espera de bloqueo excedido
 * - ER_LOCK_DEADLOCK (1213): Deadlock encontrado
 *
 * Errores de Base de Datos/Tabla:
 * - ER_BAD_DB_ERROR (1049): Base de datos desconocida
 * - ER_NO_SUCH_TABLE (1146): La tabla no existe
 * - ER_BAD_FIELD_ERROR (1054): Columna desconocida
 */

/**
 * Determina si un error está relacionado con la base de datos
 *
 * @param {Error} error - El objeto de error a verificar
 * @returns {boolean} - Verdadero si es un error de base de datos
 */
function isDatabaseError(error) {
  // Verificar propiedades específicas de errores de MySQL
  if (
    error.code &&
    (error.code.startsWith("ER_") ||
      error.code.startsWith("PROTOCOL_") ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "EHOSTUNREACH" ||
      error.code === "ENOTFOUND" ||
      error.errno !== undefined)
  ) {
    return true;
  }

  // Verificar errores del pool de mysql2
  if (
    error.message &&
    (error.message.includes("mysql") ||
      error.message.includes("MySQL") ||
      error.message.includes("pool") ||
      error.message.includes("connection"))
  ) {
    return true;
  }

  return false;
}

/**
 * Obtener respuesta de error segura para el cliente basada en el tipo de error
 *
 * @param {Error} error - El error de base de datos
 * @returns {Object} - Objeto que contiene statusCode y message
 */
function getClientResponse(error) {
  const code = error.code;
  const errno = error.errno;

  // Errores de conexión - 503 Servicio No Disponible
  if (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "EHOSTUNREACH" ||
    code === "ENOTFOUND" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
  ) {
    return {
      statusCode: 503,
      message:
        "Servicio temporalmente no disponible. Por favor intente mas tarde.",
    };
  }

  // Error de entrada duplicada - 409 Conflicto
  if (errno === 1062 || code === "ER_DUP_ENTRY") {
    return {
      statusCode: 409,
      message:
        "El registro ya existe. Por favor verifique los datos ingresados.",
    };
  }

  // Errores de restricción de clave foránea - 400 Solicitud Incorrecta
  if (
    errno === 1216 ||
    errno === 1217 ||
    errno === 1451 ||
    errno === 1452 ||
    code === "ER_NO_REFERENCED_ROW" ||
    code === "ER_ROW_IS_REFERENCED" ||
    code === "ER_NO_REFERENCED_ROW_2" ||
    code === "ER_ROW_IS_REFERENCED_2"
  ) {
    return {
      statusCode: 400,
      message:
        "No se puede completar la operacion debido a referencias existentes.",
    };
  }

  // Errores de validación de datos - 400 Solicitud Incorrecta
  if (
    errno === 1048 ||
    code === "ER_BAD_NULL_ERROR" ||
    errno === 1406 ||
    code === "ER_DATA_TOO_LONG" ||
    errno === 1292 ||
    code === "ER_TRUNCATED_WRONG_VALUE"
  ) {
    return {
      statusCode: 400,
      message:
        "Datos invalidos. Por favor verifique la informacion proporcionada.",
    };
  }

  // Errores de bloqueo/deadlock - 503 Servicio No Disponible
  if (
    errno === 1205 ||
    code === "ER_LOCK_WAIT_TIMEOUT" ||
    errno === 1213 ||
    code === "ER_LOCK_DEADLOCK"
  ) {
    return {
      statusCode: 503,
      message: "El servidor esta ocupado. Por favor intente de nuevo.",
    };
  }

  // Errores de acceso denegado - 503 Servicio No Disponible
  // (No informar al cliente sobre problemas de autenticación)
  if (
    errno === 1044 ||
    errno === 1045 ||
    code === "ER_ACCESS_DENIED_ERROR" ||
    code === "ER_DBACCESS_DENIED_ERROR"
  ) {
    return {
      statusCode: 503,
      message: "Servicio temporalmente no disponible.",
    };
  }

  // Errores de estructura de base de datos/tabla - 500 Error Interno del Servidor
  if (
    errno === 1049 ||
    code === "ER_BAD_DB_ERROR" ||
    errno === 1146 ||
    code === "ER_NO_SUCH_TABLE" ||
    errno === 1054 ||
    code === "ER_BAD_FIELD_ERROR"
  ) {
    return {
      statusCode: 500,
      message: "Error interno del servidor.",
    };
  }

  // Por defecto - 500 Error Interno del Servidor
  return {
    statusCode: 500,
    message: "Error del servidor. Por favor intente mas tarde.",
  };
}

/**
 * Registrar información detallada del error del lado del servidor
 *
 * @param {Error} error - El objeto de error
 * @param {Request} req - Objeto de solicitud de Express
 */
function logError(error, req) {
  const timestamp = new Date().toISOString();
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
  };

  console.error("========================================");
  console.error(`[DB Error] ${timestamp}`);
  console.error("[DB Error] Request:", JSON.stringify(requestInfo));
  console.error("[DB Error] Code:", error.code);
  console.error("[DB Error] Errno:", error.errno);
  console.error("[DB Error] SQL State:", error.sqlState);
  console.error("[DB Error] Message:", error.message);

  // Registrar SQL solo en desarrollo (NUNCA en producción)
  if (process.env.NODE_ENV !== "production" && error.sql) {
    console.error("[DB Error] SQL:", error.sql);
  }

  // Registrar stack trace solo en desarrollo
  if (process.env.NODE_ENV !== "production") {
    console.error("[DB Error] Stack:", error.stack);
  }

  console.error("========================================");
}

/**
 * Middleware de Manejo de Errores de Base de Datos
 *
 * Middleware de manejo de errores de Express para errores de base de datos.
 * Debe tener 4 parámetros (err, req, res, next) para ser reconocido
 * como un manejador de errores por Express.
 *
 * @param {Error} err - El objeto de error
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 */
function dbErrorHandler(err, req, res, next) {
  // Si la respuesta ya fue enviada, delegar al manejador de errores por defecto de Express
  if (res.headersSent) {
    return next(err);
  }

  // Verificar si este es un error de base de datos
  if (isDatabaseError(err)) {
    // Registrar información detallada del error del lado del servidor
    logError(err, req);

    // Obtener respuesta apropiada para el cliente
    const { statusCode, message } = getClientResponse(err);

    // Enviar error genérico al cliente
    return res.status(statusCode).json({
      error: message,
      // Incluir ID de solicitud para referencia de soporte (si está implementado)
      // requestId: req.id
    });
  }

  // Para errores no relacionados con la base de datos, verificar si es un error conocido de la aplicación
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message || "Error del servidor",
    });
  }

  // Para errores desconocidos, registrar y retornar mensaje genérico
  console.error("[Error]", new Date().toISOString(), err);

  return res.status(500).json({
    error: "Error interno del servidor",
  });
}

/**
 * Wrapper de Manejador Asíncrono
 *
 * Envuelve manejadores de rutas asíncronas para asegurar que los errores
 * sean pasados al middleware de manejo de errores.
 *
 * Uso:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   const [rows] = await pool.query('SELECT * FROM table');
 *   res.json(rows);
 * }));
 *
 * @param {Function} fn - Función asíncrona a envolver
 * @returns {Function} - Función envuelta
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Exportar el middleware y las funciones auxiliares
module.exports = dbErrorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.isDatabaseError = isDatabaseError;
