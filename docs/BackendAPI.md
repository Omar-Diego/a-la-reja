# Backend API

Esta página provee un overview del servicio backend Express.js: su conjunto de dependencias, middleware stack, organización de rutas, modelo de permisos de dos niveles, patrón de manejo de errores, y ciclo de vida del servidor. Para documentación detallada de grupos de rutas individuales, ver las páginas 5.1–5.5. Para la capa de base de datos, ver [Database](Database.md). Para cómo el frontend invoca el backend, ver [Architecture](Architecture.md).

---

## Stack Tecnológico

El backend es un servicio Node.js cuyas dependencias en tiempo de ejecución están declaradas en `backend/package.json` (líneas 1–24):

| Package              | Version   | Propósito                              |
| -------------------- | --------- | -------------------------------------- |
| `express`            | `^5.2.1`  | HTTP framework                         |
| `helmet`             | `^8.0.0`  | Headers HTTP de seguridad              |
| `express-rate-limit` | `^7.5.0`  | Rate limiting por IP                   |
| `cors`               | `^2.8.6`  | Cross-origin resource sharing          |
| `jsonwebtoken`       | `^9.0.3`  | Firma y verificación de JWT            |
| `bcryptjs`           | `^3.0.3`  | Hashing y comparación de contraseñas   |
| `mysql2`             | `^3.16.2` | Pool de conexiones MySQL (promise API) |
| `resend`             | `^6.9.2`  | Entrega de email transaccional         |
| `dotenv`             | `^17.2.3` | Carga de archivos `.env`               |

---

## Punto de Entrada

Toda la inicialización del backend vive en `backend/index.js`. El archivo realiza cuatro responsabilidades en orden:

1. Cargar variables de entorno via `dotenv`
2. Configurar y registrar el middleware stack
3. Registrar los módulos de rutas
4. Llamar a `startServer()`, que valida las variables de entorno requeridas, prueba la conexión DB, y comienza a escuchar

---

## Stack de Middleware

El middleware se registra en un orden específico. **El orden importa:** el middleware de seguridad corre antes del routing, y el error handler corre después de todas las rutas.

**Fuentes:** `backend/index.js` #37-218

---

## Limitadores de Tasa

Se configuran dos instancias distintas de `express-rate-limit` (`backend/index.js` #52-72):

| Limiter          | Ventana    | Máx. Peticiones | Aplicado a                              |
| ---------------- | ---------- | --------------- | --------------------------------------- |
| `generalLimiter` | 15 minutos | 100             | Todas las rutas (global)                |
| `authLimiter`    | 15 minutos | 5               | `POST /api/login`, `POST /api/usuarios` |

El `authLimiter` se aplica selectivamente en `backend/index.js` #157-162 antes de que se registren los módulos de rutas.

---

## Política de CORS

El array `allowedOrigins` (`backend/index.js` #79-84) se construye desde entradas hardcodeadas más `process.env.FRONTEND_URL`. La lógica adicional acepta cualquier subdominio que coincida con `*.vercel.app` para soportar Vercel preview deployments. En desarrollo, solicitudes sin header `Origin` (ej. desde Postman) también son aceptadas.

---

## Organización de Rutas

Cinco módulos de rutas se cargan bajo el prefijo `/api` (`backend/index.js` #145-173):

| Archivo de ruta                    | Montado en | Auth requerida                                 |
| ---------------------------------- | ---------- | ---------------------------------------------- |
| `backend/routes/auth.js`           | `/api`     | Ninguna (endpoint de login público)            |
| `backend/routes/profile.js`        | `/api`     | Middleware `auth`                              |
| `backend/routes/admin/usuarios.js` | `/api`     | Middleware `adminAuth`                         |
| `backend/routes/reservaciones.js`  | `/api`     | Mixta (ver nota abajo)                         |
| `backend/routes/canchas.js`        | `/api`     | Mixta (lecturas públicas, escrituras de admin) |

---

## Modelo de Permisos

El backend usa dos funciones middleware que protegen rutas en diferentes niveles de confianza:

| Middleware  | Quién pasa                                                                               | Comportamiento en falla |
| ----------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `auth`      | Cualquier solicitud con un JWT válido y no expirado en el header `Authorization: Bearer` | `401 Unauthorized`      |
| `adminAuth` | Un JWT válido cuyo payload contiene el claim `role: "admin"`                             | `403 Forbidden`         |

Este modelo de dos niveles mapea directamente a las dos categorías de usuario del sistema:

- **Usuarios regulares** se autentican via `POST /api/login` y reciben un JWT del backend (ver **Users API**).
- **El administrador** se autentica via la capa `auth.ts` de Next.js y también recibe un JWT, pero emitido client-side con un claim `role: "admin"` (ver **NextAuth Configuration**).

Ambos tipos de token comparten el mismo `JWT_SECRET` y son verificados por el mismo middleware `auth`. `adminAuth` simplemente agrega un chequeo de rol encima.

---

## Manejo Asíncrono de Errores

Las funciones de route handler están envueltas con un utilitario `asyncHandler`. Este wrapper captura promesas rechazadas de los route handlers async y las reenvía al `next(err)` de Express, dirigiéndolas al middleware global `dbErrorHandler` al final del stack.

El middleware `dbErrorHandler` (`backend/middlewares/dbErrorHandler`) mapea códigos de error MySQL a los códigos de estado HTTP apropiados antes de enviar una respuesta JSON de error.

---

## Endpoint de Salud

`GET /health` (`backend/index.js` #180-199) es un endpoint **no autenticado** que:

1. Adquiere una conexión del pool
2. Ejecuta `SELECT 1` para confirmar accesibilidad de la base de datos
3. Retorna `200` con `{ status: "healthy", database: "connected" }` en éxito
4. Retorna `503` con `{ status: "unhealthy", database: "disconnected" }` en falla

Este endpoint es usado por la directiva `HEALTHCHECK` de Docker Compose en el contenedor backend (ver **Docker Setup**) y por el script diagnóstico `test-backend.js` (ver **Environment Variables & Configuration**).

---

## Ciclo de Vida del Servidor

**Fuentes:** `backend/index.js` #226-366

### Variables de Entorno Requeridas

`startServer()` verifica estas variables al arranque y llama `process.exit(1)` si alguna está ausente (`backend/index.js` #232-250):

| Variable      | Propósito                               |
| ------------- | --------------------------------------- |
| `DB_HOST`     | Dirección del host MySQL                |
| `DB_USER`     | Usuario MySQL                           |
| `DB_PASSWORD` | Contraseña MySQL                        |
| `DB_NAME`     | Nombre de la base de datos              |
| `JWT_SECRET`  | Clave de firma para verificación de JWT |

Una lista completa de todas las variables de entorno está documentada en **Environment Variables & Configuration**.

### Cierre Controlado

`setupGracefulShutdown()` (`backend/index.js` #318-366) registra handlers para `SIGTERM`, `SIGINT`, `uncaughtException`, y `unhandledRejection`. En cualquiera de estas señales:

1. El servidor HTTP deja de aceptar nuevas conexiones (`server.close()`)
2. `closePool()` drena y cierra el pool de conexiones MySQL
3. El proceso sale limpiamente

Un timeout de **10 segundos** fuerza `process.exit(1)` si la secuencia de graceful shutdown se atasca.
