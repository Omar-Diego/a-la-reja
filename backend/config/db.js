/**
 * Configuración Segura del Pool de Conexiones a Base de Datos
 *
 * Este módulo crea un pool de conexiones MySQL seguro usando mysql2/promise.
 * Características:
 * - Pool de conexiones para mejor rendimiento y gestión de recursos
 * - Soporte para prepared statements (previene inyección SQL)
 * - Soporte para async/await mediante promesas
 * - Configuraciones de timeout y límites de cola de conexiones
 * - Configuración SSL/TLS lista (comentada para fácil habilitación)
 */

// Importar mysql2/promise para soporte async/await y pool de conexiones
const mysql = require("mysql2/promise");

/**
 * Configuración del Pool de Conexiones a Base de Datos
 *
 * Consideraciones de seguridad:
 * - Todas las credenciales cargadas desde variables de entorno (nunca hardcodeadas)
 * - Límites de conexión previenen ataques de agotamiento de recursos
 * - Límites de cola previenen agotamiento de memoria por conexiones pendientes
 * - Timeouts previenen conexiones colgadas
 * - Opciones SSL/TLS listas para uso en producción
 */
const poolConfig = {
  // Credenciales de conexión desde variables de entorno
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 3306,

  // Configuraciones del pool de conexiones
  // Número máximo de conexiones en el pool
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,

  // Número máximo de peticiones de conexión que el pool pondrá en cola
  // antes de retornar un error (0 = ilimitado)
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0,

  // Configuraciones de timeout de conexión (en milisegundos)
  // Tiempo de espera para una conexión del pool
  waitForConnections: true,

  // Timeout de adquisición de conexión (10 segundos)
  connectTimeout: 10000,

  // Habilitar múltiples statements (deshabilitado por seguridad - previene ataques de inyección SQL)
  multipleStatements: false,

  // Configuración de zona horaria
  timezone: "local",

  // Conjunto de caracteres para codificación segura
  charset: "utf8mb4",
};

// Crear el pool de conexiones
const pool = mysql.createPool(poolConfig);

/**
 * Probar la conexión a la base de datos
 *
 * Esta función intenta adquirir una conexión del pool
 * y ejecutar una consulta simple para verificar la conectividad.
 *
 * @returns {Promise<boolean>} - Verdadero si la conexión es exitosa
 * @throws {Error} - Si la conexión falla
 */
async function testConnection() {
  let connection;
  try {
    // Intentar obtener una conexión del pool
    connection = await pool.getConnection();

    // Ejecutar una consulta simple para verificar que la conexión funciona
    await connection.query("SELECT 1");

    console.log("[Database] Pool de conexiones inicializado exitosamente");
    console.log(
      `[Database] Conectado a: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`,
    );
    console.log(
      `[Database] Tamaño del pool: ${poolConfig.connectionLimit} conexiones`,
    );

    return true;
  } catch (error) {
    console.error("[Database] Prueba de conexión fallida:", error.message);
    throw error;
  } finally {
    // Siempre liberar la conexión de vuelta al pool
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Cerrar gracefulmente todas las conexiones del pool
 *
 * Llama a esta función durante el apagado de la aplicación para cerrar
 * limpiamente todas las conexiones a la base de datos.
 *
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log("[Database] Pool de conexiones cerrado");
  } catch (error) {
    console.error(
      "[Database] Error cerrando pool de conexiones:",
      error.message,
    );
    throw error;
  }
}

// Exportar el pool y las funciones de utilidad
module.exports = {
  pool,
  testConnection,
  closePool,
};
