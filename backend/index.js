/**
 * Servidor de la aplicacion de Reservacion de Canchas de Padel
 *
 * Este es el punto de entrada principal para la aplicación backend.
 * Características:
 * - Validación de conexión a base de datos al inicio
 * - Manejo de apagado graceful
 * - Middleware centralizado de manejo de errores
 * - Configuración enfocada en seguridad
 */

// Cargar variables de entorno desde el archivo .env PRIMERO (antes de cualquier otra importación)
require("dotenv").config();

// Importar los módulos del framework y la base de datos
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { pool, testConnection, closePool } = require("./config/db");
const dbErrorHandler = require("./middlewares/dbErrorHandler");

// Inicializar aplicación Express
const app = express();

// Obtener puerto desde el entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

/**
 * Configuración de Middleware
 */

// SEGURIDAD: Helmet establece varios headers HTTP de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Needed for some frontend frameworks
  }),
);

// SEGURIDAD: Rate limiting para prevenir ataques de fuerza bruta
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 peticiones por ventana por IP
  message: {
    error: "Demasiadas peticiones, por favor intente de nuevo más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por ventana
  message: {
    error:
      "Demasiados intentos de inicio de sesión. Por favor intente de nuevo en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting general a todas las rutas
app.use(generalLimiter);

// Habilitar CORS para peticiones de origen cruzado
// SEGURIDAD: Configurar orígenes específicos para producción
const allowedOrigins = [
  "https://a-la-reja.vercel.app",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // SEGURIDAD: Rechazar peticiones sin origen en producción
      if (!origin) {
        if (process.env.NODE_ENV === "production") {
          return callback(new Error("Origin required"));
        }
        // Permitir en desarrollo para testing con herramientas como Postman
        return callback(null, true);
      }

      // Permitir todos los subdominios de Vercel
      if (origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Parsear cuerpos de peticiones JSON
// SEGURIDAD: Limitar tamaño del cuerpo para prevenir ataques DoS
app.use(express.json({ limit: "10kb" }));

// Parsear cuerpos de peticiones URL-encoded
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Middleware de registro de peticiones (solo desarrollo)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

/**
 * Importación de Rutas
 */
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminUsuariosRoutes = require("./routes/admin/usuarios");
const reservacionesRoutes = require("./routes/reservaciones");
const canchasRoutes = require("./routes/canchas");

/**
 * Configuración de Rutas
 * Todas las rutas de la API tienen el prefijo /api
 */

// Aplicar rate limiting estricto solo a endpoints de autenticación
app.use("/api/login", authLimiter);
// Limitar registro de nuevos usuarios (POST /api/usuarios)
app.use("/api/usuarios", (req, res, next) => {
  if (req.method === "POST") return authLimiter(req, res, next);
  next();
});

console.log("[Server] Registrando rutas de autenticacion...");
app.use("/api", authRoutes);
console.log("[Server] Registrando rutas de perfil...");
app.use("/api", profileRoutes);
console.log("[Server] Registrando rutas de administracion de usuarios...");
app.use("/api", adminUsuariosRoutes);
console.log("[Server] Registrando rutas de reservaciones...");
app.use("/api", reservacionesRoutes);
console.log("[Server] Registrando rutas de canchas...");
app.use("/api", canchasRoutes);
console.log("[Server] Todas las rutas registradas");

/**
 * Endpoint de Verificación de Salud
 * Usado para verificar que el servidor está corriendo y la base de datos está conectada
 */
app.get("/health", async (req, res) => {
  try {
    // Probar conexión a la base de datos
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

/**
 * Manejador 404
 * Captura peticiones a rutas no definidas
 */
app.use((req, res, next) => {
  console.log(`[404] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

/**
 * Middleware Global de Manejo de Errores
 * Debe registrarse DESPUÉS de todas las rutas
 * Maneja errores de base de datos y otros errores inesperados
 */
app.use(dbErrorHandler);

/**
 * Función de Inicio del Servidor
 *
 * Valida la conexión a la base de datos antes de iniciar el servidor.
 * Si la conexión a la base de datos falla, el servidor no iniciará.
 */
async function startServer() {
  try {
    console.log("[Server] Iniciando aplicación...");
    console.log(`[Server] Entorno: ${process.env.NODE_ENV || "development"}`);

    // Validar variables de entorno requeridas
    const requiredEnvVars = [
      "DB_HOST",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "JWT_SECRET",
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      console.error(
        "[Server] ERROR: Variables de entorno requeridas faltantes:",
      );
      missingVars.forEach((varName) => console.error(`  - ${varName}`));
      console.error("[Server] Por favor verifica tu archivo .env");
      process.exit(1);
    }

    // Probar conexión a la base de datos antes de iniciar el servidor
    console.log("[Server] Probando conexión a la base de datos...");
    await testConnection();

    // Iniciar el servidor HTTP
    const server = app.listen(PORT, () => {
      console.log("[Server] ========================================");
      console.log(`[Server] Servidor corriendo en el puerto ${PORT}`);
      console.log(
        `[Server] Verificación de salud: http://localhost:${PORT}/health`,
      );
      console.log(`[Server] CORS origenes permitidos:`);
      allowedOrigins.forEach((origin) => console.log(`  - ${origin}`));
      console.log("[Server] ========================================");
    });

    // Manejadores de apagado graceful
    setupGracefulShutdown(server);
  } catch (error) {
    console.error("[Server] ========================================");
    console.error("[Server] FATAL: Fallo al iniciar el servidor");
    console.error("[Server] ========================================");

    // Proporcionar mensajes de error útiles basados en el tipo de error
    if (error.code === "ECONNREFUSED") {
      console.error("[Server] Conexión a la base de datos rechazada.");
      console.error("[Server] Por favor verifica:");
      console.error("  1. El servidor MySQL está corriendo");
      console.error(`  2. El host (${process.env.DB_HOST}) es accesible`);
      console.error(
        `  3. El puerto (${process.env.DB_PORT || 3306}) es correcto`,
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("[Server] Acceso a la base de datos denegado.");
      console.error(
        "[Server] Por favor verifica tus credenciales en el archivo .env",
      );
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error(
        `[Server] La base de datos "${process.env.DB_NAME}" no existe.`,
      );
      console.error(
        "[Server] Por favor crea la base de datos o verifica DB_NAME en .env",
      );
    } else if (error.code === "ETIMEDOUT" || error.code === "EHOSTUNREACH") {
      console.error("[Server] El host de la base de datos es inalcanzable.");
      console.error(
        "[Server] Por favor verifica la conectividad de red y reglas del firewall",
      );
    } else {
      console.error(`[Server] Error: ${error.message}`);
    }

    // Salir con código de error
    process.exit(1);
  }
}

/**
 * Configurar Apagado Graceful
 *
 * Asegura que las conexiones a la base de datos se cierren apropiadamente
 * cuando el servidor recibe una señal de terminación.
 *
 * @param {http.Server} server - La instancia del servidor HTTP
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n[Server] Recibido ${signal}. Iniciando apagado graceful...`);

    // Dejar de aceptar nuevas conexiones
    server.close(async () => {
      console.log("[Server] Servidor HTTP cerrado");

      try {
        // Cerrar pool de base de datos
        await closePool();
        console.log("[Server] Apagado graceful completado");
        process.exit(0);
      } catch (error) {
        console.error("[Server] Error durante el apagado:", error.message);
        process.exit(1);
      }
    });

    // Forzar apagado después de 10 segundos si el apagado graceful falla
    setTimeout(() => {
      console.error("[Server] Apagado forzado después del timeout");
      process.exit(1);
    }, 10000);
  };

  // Manejar señales de terminación
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Manejar excepciones no capturadas
  process.on("uncaughtException", (error) => {
    console.error("[Server] Excepción no capturada:", error);
    shutdown("uncaughtException");
  });

  // Manejar rechazos de promesas no manejados
  process.on("unhandledRejection", (reason, promise) => {
    console.error(
      "[Server] Rechazo no manejado en:",
      promise,
      "razón:",
      reason,
    );
    if (process.env.NODE_ENV === "production") {
      shutdown("unhandledRejection");
    }
  });
}

// Iniciar el servidor
startServer();
